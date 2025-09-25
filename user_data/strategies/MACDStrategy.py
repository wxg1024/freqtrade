# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement
# flake8: noqa: F401
# isort: skip_file
# --- Do not remove these imports ---
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from pandas import DataFrame
from typing import Optional, Union

from freqtrade.strategy import (
    IStrategy,
    Trade,
    Order,
    PairLocks,
    informative,  # @informative decorator
    # Hyperopt Parameters
    BooleanParameter,
    CategoricalParameter,
    DecimalParameter,
    IntParameter,
    RealParameter,
    # timeframe helpers
    timeframe_to_minutes,
    timeframe_to_next_date,
    timeframe_to_prev_date,
    # Strategy helper functions
    merge_informative_pair,
    stoploss_from_absolute,
    stoploss_from_open,
)

# --------------------------------
# Add your lib to import here
import talib.abstract as ta
from technical import qtpylib


# This class is a sample. Feel free to customize it.
class MACDStrategy(IStrategy):
    """
    MACD双时间框架策略
    做多条件：5分钟MACD金叉 + 15分钟MACD多头趋势
    做多平仓：5分钟MACD死叉
    做空条件：5分钟MACD死叉 + 15分钟MACD空头趋势
    做空平仓：5分钟MACD金叉
    """

    # Strategy interface version - allow new iterations of the strategy interface.
    # Check the documentation or the Sample strategy to get the latest version.
    INTERFACE_VERSION = 3

    # Can this strategy go short?
    can_short: bool = True

    # Minimal ROI designed for the strategy.
    # This attribute will be overridden if the config file contains "minimal_roi".
    minimal_roi = {
        "60": 0.01,
        "30": 0.02,
        "0": 0.04,
    }

    # Optimal stoploss designed for the strategy.
    # This attribute will be overridden if the config file contains "stoploss".
    stoploss = -0.10

    # Trailing stoploss
    trailing_stop = True

    # Optimal timeframe for the strategy.
    timeframe = "5m"

    # Run "populate_indicators()" only for new candle.
    process_only_new_candles = True

    # These values can be overridden in the config.
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False

    # Hyperoptable parameters
    buy_rsi = IntParameter(low=1, high=50, default=30, space="buy", optimize=True, load=True)
    sell_rsi = IntParameter(low=50, high=100, default=70, space="sell", optimize=True, load=True)
    short_rsi = IntParameter(low=51, high=100, default=70, space="sell", optimize=True, load=True)
    exit_short_rsi = IntParameter(low=1, high=50, default=30, space="buy", optimize=True, load=True)

    # Number of candles the strategy requires before producing valid signals
    startup_candle_count: int = 200

    # 添加MACD可优化参数
    macd_fastperiod = IntParameter(low=5, high=15, default=5, space="buy", optimize=True, load=True)
    macd_slowperiod = IntParameter(low=20, high=35, default=10, space="buy", optimize=True, load=True)
    macd_signalperiod = IntParameter(low=5, high=15, default=5, space="buy", optimize=True, load=True)

    # Optional order type mapping.
    order_types = {
        "entry": "limit",
        "exit": "limit",
        "stoploss": "market",
        "stoploss_on_exchange": False,
    }

    # Optional order time in force.
    order_time_in_force = {"entry": "GTC", "exit": "GTC"}

    plot_config = {
        "main_plot": {
            "tema": {},
            "sar": {"color": "white"},
        },
        "subplots": {
            "MACD": {
                "macd": {"color": "blue"},
                "macdsignal": {"color": "orange"},
                "macdhist": {"color": "red"},
            },
            "MACD_15m": {
                "macd_15m": {"color": "blue"},
                "macdsignal_15m": {"color": "orange"},
            },
            "RSI": {
                "rsi": {"color": "red"},
            },
        },
    }

    def informative_pairs(self):
        """
        Define additional, informative pair/interval combinations to be cached from the exchange.
        These pair/interval combinations are non-tradeable, unless they are part
        of the whitelist as well.
        For more information, please consult the documentation
        :return: List of tuples in the format (pair, interval)
            Sample: return [("ETH/USDT", "5m"),
                            ("BTC/USDT", "15m"),
                            ]
        """
        return [("ETH/USDT", "5m"),
                ("ETH/USDT", "15m")]

    @informative('15m')
    def populate_indicators_15m(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # 使用 .value 属性获取参数的实际值
        macd = ta.MACD(dataframe,
                       fastperiod=self.macd_fastperiod.value,
                       slowperiod=self.macd_slowperiod.value,
                       signalperiod=self.macd_signalperiod.value)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        return dataframe

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        添加几种不同的TA指标到给定的数据框中

        性能注意事项: 为了获得最佳性能，在使用指标时要节俭。只取消注释你在策略或超参数调优配置中使用的指标，
        否则你将浪费内存和CPU资源。
        :param dataframe: 从交易所获取的数据框
        :param metadata: 其他附加信息，如当前交易对
        :return: 策略所需的所有必要指标的数据框
        """

        # Momentum Indicators
        # ------------------------------------

        # ADX
        dataframe["adx"] = ta.ADX(dataframe)
        # RSI
        dataframe["rsi"] = ta.RSI(dataframe)

        # Stochastic Fast
        stoch_fast = ta.STOCHF(dataframe)
        dataframe["fastd"] = stoch_fast["fastd"]
        dataframe["fastk"] = stoch_fast["fastk"]

        # MACD - 5分钟
        macd = ta.MACD(dataframe,
                       fastperiod=self.macd_fastperiod.value,
                       slowperiod=self.macd_slowperiod.value,
                       signalperiod=self.macd_signalperiod.value)
        dataframe["macd"] = macd["macd"]  # DIF
        dataframe["macdsignal"] = macd["macdsignal"]  # DEA
        dataframe["macdhist"] = macd["macdhist"]

        # MFI
        dataframe["mfi"] = ta.MFI(dataframe)

        # Overlap Studies
        # ------------------------------------

        # Bollinger Bands
        bollinger = qtpylib.bollinger_bands(qtpylib.typical_price(dataframe), window=20, stds=2)
        dataframe["bb_lowerband"] = bollinger["lower"]
        dataframe["bb_middleband"] = bollinger["mid"]
        dataframe["bb_upperband"] = bollinger["upper"]
        dataframe["bb_percent"] = (dataframe["close"] - dataframe["bb_lowerband"]) / (
                dataframe["bb_upperband"] - dataframe["bb_lowerband"]
        )
        dataframe["bb_width"] = (dataframe["bb_upperband"] - dataframe["bb_lowerband"]) / dataframe[
            "bb_middleband"
        ]

        # Parabolic SAR
        dataframe["sar"] = ta.SAR(dataframe)

        # TEMA - Triple Exponential Moving Average
        dataframe["tema"] = ta.TEMA(dataframe, timeperiod=9)

        # Cycle Indicator
        # ------------------------------------
        # Hilbert Transform Indicator - SineWave
        hilbert = ta.HT_SINE(dataframe)
        dataframe["htsine"] = hilbert["sine"]
        dataframe["htleadsine"] = hilbert["leadsine"]

        # 获取15分钟的MACD信息
        if self.dp:
            inf_tf = self.dp.get_pair_dataframe(metadata['pair'], '15m')
            if not inf_tf.empty:
                macd_15m = ta.MACD(inf_tf,
                                   fastperiod=self.macd_fastperiod.value,
                                   slowperiod=self.macd_slowperiod.value,
                                   signalperiod=self.macd_signalperiod.value)
                dataframe['macd_15m'] = macd_15m['macd']
                dataframe['macdsignal_15m'] = macd_15m['macdsignal']
            else:
                # 如果15分钟数据不可用，使用当前时间框架数据
                dataframe['macd_15m'] = dataframe['macd']
                dataframe['macdsignal_15m'] = dataframe['macdsignal']
        else:
            # 如果DataProvider不可用，使用当前时间框架数据
            dataframe['macd_15m'] = dataframe['macd']
            dataframe['macdsignal_15m'] = dataframe['macdsignal']

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Based on TA indicators, populates the entry signal for the given dataframe
        :param dataframe: DataFrame
        :param metadata: Additional information, like the currently traded pair
        :return: DataFrame with entry columns populated
        """
        # 做多条件：5分钟MACD金叉 + 15分钟MACD多头趋势
        dataframe.loc[
            (
                # 5分钟MACD金叉（MACD线上穿信号线）
                    (qtpylib.crossed_above(dataframe['macd'], dataframe['macdsignal']))
                    # 15分钟MACD为多头趋势（MACD线在信号线上方）
                    & (dataframe['macd_15m'] > dataframe['macdsignal_15m'])
            ),
            'enter_long'
        ] = 1

        # 做空条件：5分钟MACD死叉 + 15分钟MACD空头趋势
        dataframe.loc[
            (
                # 5分钟MACD死叉（MACD线下穿信号线）
                    (qtpylib.crossed_below(dataframe['macd'], dataframe['macdsignal']))
                    # 15分钟MACD为空头趋势（MACD线在信号线下方）
                    & (dataframe['macd_15m'] < dataframe['macdsignal_15m'])
            ),
            'enter_short'
        ] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Based on TA indicators, populates the exit signal for the given dataframe
        :param dataframe: DataFrame
        :param metadata: Additional information, like the currently traded pair
        :return: DataFrame with exit columns populated
        """
        # 做多平仓条件：5分钟MACD死叉
        dataframe.loc[
            (
                # 5分钟MACD死叉（MACD线下穿信号线）
                (qtpylib.crossed_below(dataframe['macd'], dataframe['macdsignal']))
            ),
            'exit_long'
        ] = 1

        # 做空平仓条件：5分钟MACD金叉
        dataframe.loc[
            (
                # 5分钟MACD金叉（MACD线上穿信号线）
                (qtpylib.crossed_above(dataframe['macd'], dataframe['macdsignal']))
            ),
            'exit_short'
        ] = 1

        return dataframe
