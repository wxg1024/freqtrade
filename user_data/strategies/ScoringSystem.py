# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from pandas import DataFrame
from typing import Optional, Union, Dict, List
import logging
from freqtrade.strategy import (
    IStrategy,
    informative,
    merge_informative_pair,
)
import talib.abstract as ta
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from freqtrade.persistence.base import ModelBase
from freqtrade.persistence import Trade

# 添加logger
logger = logging.getLogger(__name__)

# 定义K线数据模型
class CandleData(ModelBase):
    """存储K线数据"""
    __tablename__ = 'candle_data'
    __table_args__ = (UniqueConstraint("pair", "timeframe", "date", name="_pair_timeframe_date_uc"),)
    
    id = Column(Integer, primary_key=True)
    pair = Column(String(25), nullable=False)
    timeframe = Column(String(10), nullable=False)
    date = Column(DateTime, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f"CandleData(id={self.id}, pair={self.pair}, timeframe={self.timeframe}, " \
               f"date={self.date}, open={self.open}, high={self.high}, low={self.low}, " \
               f"close={self.close}, volume={self.volume})"

# 定义指标数据模型
class IndicatorData(ModelBase):
    """存储技术指标数据"""
    __tablename__ = 'indicator_data'
    __table_args__ = (UniqueConstraint("pair", "timeframe", "date", "indicator_name", name="_pair_timeframe_date_indicator_uc"),)
    
    id = Column(Integer, primary_key=True)
    pair = Column(String(25), nullable=False)
    timeframe = Column(String(10), nullable=False)
    date = Column(DateTime, nullable=False)
    indicator_name = Column(String(50), nullable=False)  # 如：macd, rsi, ema_short等
    value = Column(Float, nullable=True)  # 指标值
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f"IndicatorData(id={self.id}, pair={self.pair}, timeframe={self.timeframe}, " \
               f"date={self.date}, indicator_name={self.indicator_name}, value={self.value})"

# 定义评分系统数据库模型
class ScoringData(ModelBase):
    """存储多空评分系统的数据"""
    __tablename__ = 'scoring_data'
    
    id = Column(Integer, primary_key=True)
    pair = Column(String(25), nullable=False)
    date = Column(DateTime, nullable=False)
    timeframe = Column(String(10), nullable=False)
    indicator = Column(String(20), nullable=False)
    score = Column(Integer, nullable=False)  # 1表示多，-1表示空
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f"ScoringData(id={self.id}, pair={self.pair}, date={self.date}, " \
               f"timeframe={self.timeframe}, indicator={self.indicator}, score={self.score})"


class ScoringSystem(IStrategy):
    """
    多空评分系统策略
    基于MACD、EMA和RSI在不同时间周期的多空状态进行评分
    同时存储K线数据和指标数据
    """
    # 策略接口版本
    INTERFACE_VERSION = 3
    
    # 最小ROI表
    minimal_roi = {
        "0": 0.1
    }
    
    # 止损设置
    stoploss = -0.05
    
    # 时间周期设置为5分钟（基础时间段）
    timeframe = "5m"
    
    # 启动所需的K线数量
    startup_candle_count: int = 200
    
    # 是否可以做空
    can_short = False
    
    # 处理模式设置
    process_only_new_candles = True
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False
    
    # 数据库连接
    # URL= "postgresql+psycopg2://scott:tiger@localhost/test"#:5432
    db_url = "postgresql+psycopg2://freqtrader:Aa123456@localhost/freqtrader"
    engine = None
    session = None
    
    def __init__(self, config: dict) -> None:
        """初始化策略"""
        super().__init__(config)
        
        # 初始化数据库连接
        try:
            self.engine = create_engine(self.db_url)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            
            # 确保表存在
            ModelBase.metadata.create_all(self.engine)

            logger.debug(f"数据库连接成功: {self.db_url}", logger='info')
        except Exception as e:
            logger.debug(f"数据库连接失败: {e}", logger='error')
            self.session = None
    
    def store_candle_data(self, dataframe: DataFrame, pair: str, timeframe: str) -> None:
        """存储K线数据到数据库"""
        if self.session is None:
            return
        
        try:
            # 只存储最新的K线数据
            if not dataframe.empty:
                last_candle = dataframe.iloc[-1]
                last_date = last_candle['date'].to_pydatetime()
                
                # 检查是否已存在相同记录
                existing = self.session.query(CandleData).filter(
                    CandleData.pair == pair,
                    CandleData.timeframe == timeframe,
                    CandleData.date == last_date
                ).first()
                
                if not existing:
                    # 创建新的K线数据记录
                    candle_data = CandleData(
                        pair=pair,
                        timeframe=timeframe,
                        date=last_date,
                        open=float(last_candle['open']),
                        high=float(last_candle['high']),
                        low=float(last_candle['low']),
                        close=float(last_candle['close']),
                        volume=float(last_candle['volume']),
                        created_at=datetime.utcnow()
                    )
                    self.session.add(candle_data)
                    self.session.commit()
                    logger.debug(f"存储K线数据: {pair} {timeframe} {last_date}")
                    
        except Exception as e:
            logger.error(f"存储K线数据失败: {e}")
            self.session.rollback()
    
    def store_indicator_data(self, dataframe: DataFrame, pair: str, timeframe: str, indicators: Dict[str, str]) -> None:
        """存储指标数据到数据库"""
        if self.session is None:
            return
        
        try:
            # 只存储最新的指标数据
            if not dataframe.empty:
                last_candle = dataframe.iloc[-1]
                last_date = last_candle['date'].to_pydatetime()
                
                # 存储各个指标的数据
                for indicator_name, column_name in indicators.items():
                    if column_name in last_candle and pd.notna(last_candle[column_name]):
                        # 检查是否已存在相同记录
                        existing = self.session.query(IndicatorData).filter(
                            IndicatorData.pair == pair,
                            IndicatorData.timeframe == timeframe,
                            IndicatorData.date == last_date,
                            IndicatorData.indicator_name == indicator_name
                        ).first()
                        
                        if existing:
                            # 更新现有记录
                            existing.value = float(last_candle[column_name])
                        else:
                            # 创建新记录
                            indicator_data = IndicatorData(
                                pair=pair,
                                timeframe=timeframe,
                                date=last_date,
                                indicator_name=indicator_name,
                                value=float(last_candle[column_name]),
                                created_at=datetime.utcnow()
                            )
                            self.session.add(indicator_data)
                
                self.session.commit()
                logger.debug(f"存储指标数据: {pair} {timeframe} {last_date}")
                
        except Exception as e:
            logger.error(f"存储指标数据失败: {e}")
            self.session.rollback()
    
    def informative_pairs(self):
        """定义需要获取的信息对"""
        pairs = self.dp.current_whitelist()
        informative_pairs = []
        
        # 添加不同时间周期的信息对
        for pair in pairs:
            informative_pairs.extend([
                (pair, "15m"),
                (pair, "1h"),
                (pair, "4h"),
                (pair, "1d"),
            ])
            
        return informative_pairs
    
    @informative('15m')
    def populate_indicators_15m(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """计算15分钟时间周期的指标"""
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_long'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # 存储K线数据和指标数据
        self.store_candle_data(dataframe, metadata['pair'], '15m')
        self.store_indicator_data(dataframe, metadata['pair'], '15m', {
            'macd': 'macd',
            'macdsignal': 'macdsignal',
            'macdhist': 'macdhist',
            'ema_short': 'ema_short',
            'ema_long': 'ema_long',
            'rsi': 'rsi'
        })
        
        return dataframe
    
    @informative('1h')
    def populate_indicators_1h(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """计算1小时时间周期的指标"""
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_long'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # 存储K线数据和指标数据
        self.store_candle_data(dataframe, metadata['pair'], '1h')
        self.store_indicator_data(dataframe, metadata['pair'], '1h', {
            'macd': 'macd',
            'macdsignal': 'macdsignal',
            'macdhist': 'macdhist',
            'ema_short': 'ema_short',
            'ema_long': 'ema_long',
            'rsi': 'rsi'
        })
        
        return dataframe
    
    @informative('4h')
    def populate_indicators_4h(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """计算4小时时间周期的指标"""
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_long'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # 存储K线数据和指标数据
        self.store_candle_data(dataframe, metadata['pair'], '4h')
        self.store_indicator_data(dataframe, metadata['pair'], '4h', {
            'macd': 'macd',
            'macdsignal': 'macdsignal',
            'macdhist': 'macdhist',
            'ema_short': 'ema_short',
            'ema_long': 'ema_long',
            'rsi': 'rsi'
        })
        
        return dataframe
    
    @informative('1d')
    def populate_indicators_1d(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """计算日线时间周期的指标"""
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_long'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # 存储K线数据和指标数据
        self.store_candle_data(dataframe, metadata['pair'], '1d')
        self.store_indicator_data(dataframe, metadata['pair'], '1d', {
            'macd': 'macd',
            'macdsignal': 'macdsignal',
            'macdhist': 'macdhist',
            'ema_short': 'ema_short',
            'ema_long': 'ema_long',
            'rsi': 'rsi'
        })
        
        return dataframe
    
    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """计算基础时间周期（5分钟）的指标"""
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # EMA
        dataframe['ema_short'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_long'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # 存储K线数据和指标数据
        self.store_candle_data(dataframe, metadata['pair'], '5m')
        self.store_indicator_data(dataframe, metadata['pair'], '5m', {
            'macd': 'macd',
            'macdsignal': 'macdsignal',
            'macdhist': 'macdhist',
            'ema_short': 'ema_short',
            'ema_long': 'ema_long',
            'rsi': 'rsi'
        })
        
        # 计算各个指标的评分
        self.calculate_scores(dataframe, metadata)
        
        return dataframe
    
    def calculate_scores(self, dataframe: DataFrame, metadata: dict) -> None:
        """计算各个时间周期各个指标的多空评分"""
        if self.session is None:
            return
        
        pair = metadata['pair']
        current_time = datetime.now()
        
        # 只处理最新的K线
        if not dataframe.empty:
            last_candle = dataframe.iloc[-1]
            last_date = last_candle['date'].to_pydatetime()
            
            # 计算5分钟时间周期的评分
            self.calculate_timeframe_scores(pair, '5m', last_date, {
                'macd': 1 if last_candle['macd'] > 0 else -1,
                'ema': 1 if last_candle['ema_short'] > last_candle['ema_long'] else -1,
                'rsi': 1 if last_candle['rsi'] > 50 else -1
            })
            
            # 计算15分钟时间周期的评分
            if 'macd_15m' in last_candle:
                self.calculate_timeframe_scores(pair, '15m', last_date, {
                    'macd': 1 if last_candle['macd_15m'] > 0 else -1,
                    'ema': 1 if last_candle['ema_short_15m'] > last_candle['ema_long_15m'] else -1,
                    'rsi': 1 if last_candle['rsi_15m'] > 50 else -1
                })
            
            # 计算1小时时间周期的评分
            if 'macd_1h' in last_candle:
                self.calculate_timeframe_scores(pair, '1h', last_date, {
                    'macd': 1 if last_candle['macd_1h'] > 0 else -1,
                    'ema': 1 if last_candle['ema_short_1h'] > last_candle['ema_long_1h'] else -1,
                    'rsi': 1 if last_candle['rsi_1h'] > 50 else -1
                })
            
            # 计算4小时时间周期的评分
            if 'macd_4h' in last_candle:
                self.calculate_timeframe_scores(pair, '4h', last_date, {
                    'macd': 1 if last_candle['macd_4h'] > 0 else -1,
                    'ema': 1 if last_candle['ema_short_4h'] > last_candle['ema_long_4h'] else -1,
                    'rsi': 1 if last_candle['rsi_4h'] > 50 else -1
                })
            
            # 计算日线时间周期的评分
            if 'macd_1d' in last_candle:
                self.calculate_timeframe_scores(pair, '1d', last_date, {
                    'macd': 1 if last_candle['macd_1d'] > 0 else -1,
                    'ema': 1 if last_candle['ema_short_1d'] > last_candle['ema_long_1d'] else -1,
                    'rsi': 1 if last_candle['rsi_1d'] > 50 else -1
                })
    
    def calculate_timeframe_scores(self, pair: str, timeframe: str, date: datetime, scores: Dict[str, int]) -> None:
        """计算特定时间周期的评分并保存到数据库"""
        try:
            # 保存各个指标的评分
            for indicator, score in scores.items():
                # 检查是否已存在相同记录
                existing = self.session.query(ScoringData).filter(
                    ScoringData.pair == pair,
                    ScoringData.date == date,
                    ScoringData.timeframe == timeframe,
                    ScoringData.indicator == indicator
                ).first()
                
                if existing:
                    # 更新现有记录
                    existing.score = score
                else:
                    # 创建新记录
                    scoring_data = ScoringData(
                        pair=pair,
                        date=date,
                        timeframe=timeframe,
                        indicator=indicator,
                        score=score,
                        created_at=datetime.utcnow()
                    )
                    self.session.add(scoring_data)
            
            # 提交事务
            self.session.commit()
        except Exception as e:
            logger.debug(f"保存评分数据失败: {e}")
            self.session.rollback()
    
    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """定义入场信号"""
        # 这里可以根据评分系统的结果来生成入场信号
        # 例如，当总评分大于某个阈值时入场
        dataframe['enter_long'] = 0
        
        # 简单示例：当5分钟、1小时和4小时的MACD都为正时入场
        if 'macd_1h' in dataframe.columns and 'macd_4h' in dataframe.columns:
            dataframe.loc[
                (dataframe['macd'] > 0) &
                (dataframe['macd_1h'] > 0) &
                (dataframe['macd_4h'] > 0) &
                (dataframe['volume'] > 0),
                'enter_long'
            ] = 1
        
        return dataframe
    
    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """定义出场信号"""
        # 这里可以根据评分系统的结果来生成出场信号
        dataframe['exit_long'] = 0
        
        # 简单示例：当5分钟和1小时的MACD都为负时出场
        if 'macd_1h' in dataframe.columns:
            dataframe.loc[
                (dataframe['macd'] < 0) &
                (dataframe['macd_1h'] < 0) &
                (dataframe['volume'] > 0),
                'exit_long'
            ] = 1
        
        return dataframe