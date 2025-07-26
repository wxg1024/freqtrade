import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  CandlestickData, 
  HistogramData, 
  LineData,
  CandlestickSeriesPartialOptions,
  LineSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  LineSeries,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { ChartDataPoint } from '../types';
import { Settings, Maximize2, BarChart3 } from 'lucide-react';
import { MACD, RSI, EMA, SMA, BollingerBands, Stochastic, ATR, CCI, WilliamsR } from 'technicalindicators';

interface TradingViewChartProps {
  data: ChartDataPoint[];
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  autoUpdate?: boolean;
  pair?: string;
}

interface ChartSettings {
  showEMA12: boolean;
  showEMA26: boolean;
  showSMA20: boolean;
  showBollingerBands: boolean;
  showMACD: boolean;
  showRSI: boolean;
  showStochastic: boolean;
  showATR: boolean;
  showCCI: boolean;
  showWilliamsR: boolean;
  showVolume: boolean;
  showScore: boolean;
  showScore5m: boolean;
  showScore15m: boolean;
  showScore1h: boolean;
  showScore4h: boolean;
  theme: 'light' | 'dark';
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  height = 800,
  showVolume = true,
  showIndicators = true,
  autoUpdate = true,
  pair = 'BTC/USDT',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const stochasticChartRef = useRef<IChartApi | null>(null);
  const atrChartRef = useRef<IChartApi | null>(null);
  const cciChartRef = useRef<IChartApi | null>(null);
  const williamsRChartRef = useRef<IChartApi | null>(null);
  const scoreChartRef = useRef<IChartApi | null>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const stochasticContainerRef = useRef<HTMLDivElement>(null);
  const atrContainerRef = useRef<HTMLDivElement>(null);
  const cciContainerRef = useRef<HTMLDivElement>(null);
  const williamsRContainerRef = useRef<HTMLDivElement>(null);
  const scoreContainerRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<ChartSettings>({
    showEMA12: true,
    showEMA26: true,
    showSMA20: false,
    showBollingerBands: false,
    showMACD: true,
    showRSI: true,
    showStochastic: false,
    showATR: false,
    showCCI: false,
    showWilliamsR: false,
    showVolume: true,
    showScore: true,
    showScore5m: true,
    showScore15m: true,
    showScore1h: true,
    showScore4h: true,
    theme: 'light',
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  
  // 数据转换函数
  const convertToCandlestickData = useCallback((data: ChartDataPoint[]): CandlestickData[] => {
    return data.map(item => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
  }, []);
  
  const convertToVolumeData = useCallback((data: ChartDataPoint[]): HistogramData[] => {
    return data.map(item => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      value: item.volume,
      color: item.close >= item.open ? '#26a69a' : '#ef5350',
    }));
  }, []);
  
  const convertToLineData = useCallback((data: ChartDataPoint[], field: keyof ChartDataPoint): LineData[] => {
    return data
      .filter(item => item[field] !== undefined && item[field] !== null)
      .map(item => ({
        time: (new Date(item.timestamp).getTime() / 1000) as Time,
        value: item[field] as number,
      }));
  }, []);
  
  // 技术指标计算函数
  const calculateTechnicalIndicators = useCallback((data: ChartDataPoint[]) => {
    if (!data || data.length < 50) return {}; // 需要足够的数据点
    
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    const indicators: any = {};
    
    try {
      // EMA计算
      if (settings.showEMA12) {
        const ema12Values = EMA.calculate({ period: 12, values: closes });
        indicators.ema12 = ema12Values;
      }
      
      if (settings.showEMA26) {
        const ema26Values = EMA.calculate({ period: 26, values: closes });
        indicators.ema26 = ema26Values;
      }
      
      // SMA计算
      if (settings.showSMA20) {
        const sma20Values = SMA.calculate({ period: 20, values: closes });
        indicators.sma20 = sma20Values;
      }
      
      // 布林带计算
      if (settings.showBollingerBands) {
        const bbValues = BollingerBands.calculate({
          period: 20,
          values: closes,
          stdDev: 2
        });
        indicators.bollingerBands = bbValues;
      }
      
      // MACD计算
      if (settings.showMACD) {
        const macdValues = MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        });
        indicators.macd = macdValues;
      }
      
      // RSI计算
      if (settings.showRSI) {
        const rsiValues = RSI.calculate({ period: 14, values: closes });
        indicators.rsi = rsiValues;
      }
      
      // Stochastic计算
      if (settings.showStochastic) {
        const stochasticInput = data.map(d => ({ high: d.high, low: d.low, close: d.close }));
        const stochasticValues = Stochastic.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: 14,
          signalPeriod: 3
        });
        indicators.stochastic = stochasticValues;
      }
      
      // ATR计算
      if (settings.showATR) {
        const atrInput = data.map(d => ({ high: d.high, low: d.low, close: d.close }));
        const atrValues = ATR.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: 14
        });
        indicators.atr = atrValues;
      }
      
      // CCI计算
      if (settings.showCCI) {
        const cciValues = CCI.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: 20
        });
        indicators.cci = cciValues;
      }
      
      // Williams %R计算
      if (settings.showWilliamsR) {
        const williamsRValues = WilliamsR.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: 14
        });
        indicators.williamsR = williamsRValues;
      }
      
    } catch (error) {
      console.error('计算技术指标时出错:', error);
    }
    
    return indicators;
  }, [settings]);
  
  // 初始化主图表
  const initializeMainChart = useCallback(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: Math.floor(height * 0.6),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    chartRef.current = chart;
    
    // 添加K线系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    } as CandlestickSeriesPartialOptions);
    candlestickSeriesRef.current = candlestickSeries;
    
    // 添加成交量系列
    if (settings.showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      } as HistogramSeriesPartialOptions);
      volumeSeriesRef.current = volumeSeries;
      
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }
    
    // 添加EMA线
    if (settings.showEMA12) {
      const ema12Series = chart.addSeries(LineSeries, {
        color: '#2196f3',
        lineWidth: 2,
        title: 'EMA12',
      } as LineSeriesPartialOptions);
      ema12SeriesRef.current = ema12Series;
    }
    
    if (settings.showEMA26) {
      const ema26Series = chart.addSeries(LineSeries, {
        color: '#9c27b0',
        lineWidth: 2,
        title: 'EMA26',
      } as LineSeriesPartialOptions);
      ema26SeriesRef.current = ema26Series;
    }
    
    // 添加SMA20线
    if (settings.showSMA20) {
      const sma20Series = chart.addSeries(LineSeries, {
        color: '#ff9800',
        lineWidth: 2,
        title: 'SMA20',
      } as LineSeriesPartialOptions);
      sma20SeriesRef.current = sma20Series;
    }
    
    // 添加布林带
    if (settings.showBollingerBands) {
      const bollingerUpperSeries = chart.addSeries(LineSeries, {
        color: '#f44336',
        lineWidth: 1,
        lineStyle: 2, // 虚线
        title: '布林带上轨',
      } as LineSeriesPartialOptions);
      bollingerUpperSeriesRef.current = bollingerUpperSeries;
      
      const bollingerLowerSeries = chart.addSeries(LineSeries, {
        color: '#4caf50',
        lineWidth: 1,
        lineStyle: 2, // 虚线
        title: '布林带下轨',
      } as LineSeriesPartialOptions);
      bollingerLowerSeriesRef.current = bollingerLowerSeries;
      
      const bollingerMiddleSeries = chart.addSeries(LineSeries, {
        color: '#607d8b',
        lineWidth: 1,
        lineStyle: 2, // 虚线
        title: '布林带中轨',
      } as LineSeriesPartialOptions);
      bollingerMiddleSeriesRef.current = bollingerMiddleSeries;
    }
    
    return chart;
  }, [height, settings]);
  
  // MACD系列引用
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  // 初始化MACD图表
  const initializeMACDChart = useCallback(() => {
    if (!macdContainerRef.current || !settings.showMACD) return;
    
    const chart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: Math.floor(height * 0.15),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    macdChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('时间轴同步失败:', error);
          }
        }
      });
    }
    
    // 添加MACD线
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 2,
      title: 'MACD',
    } as LineSeriesPartialOptions);
    macdSeriesRef.current = macdSeries;
    
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: 'Signal',
    } as LineSeriesPartialOptions);
    macdSignalSeriesRef.current = signalSeries;
    
    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      title: 'Histogram',
    } as HistogramSeriesPartialOptions);
    macdHistogramSeriesRef.current = histogramSeries;
    
    return { chart, macdSeries, signalSeries, histogramSeries };
  }, [height, settings]);
  
  // RSI系列
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // Stochastic系列
  const stochasticKSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const stochasticDSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // ATR系列
  const atrSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // CCI系列
  const cciSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // Williams %R系列
  const williamsRSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // 初始化RSI图表
  const initializeRSIChart = useCallback(() => {
    if (!rsiContainerRef.current || !settings.showRSI) return;
    
    const chart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    rsiChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('RSI时间轴同步失败:', error);
          }
        }
      });
    }

    // 添加RSI线
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: 'RSI',
    } as LineSeriesPartialOptions);
    rsiSeriesRef.current = rsiSeries;
    
    return { chart, rsiSeries };
  }, [height, settings]);
  
  // 初始化Stochastic图表
  const initializeStochasticChart = useCallback(() => {
    if (!stochasticContainerRef.current || !settings.showStochastic) return;
    
    const chart = createChart(stochasticContainerRef.current, {
      width: stochasticContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    stochasticChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('Stochastic时间轴同步失败:', error);
          }
        }
      });
    }

    // 添加%K线
    const kSeries = chart.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 2,
      title: '%K',
    } as LineSeriesPartialOptions);
    stochasticKSeriesRef.current = kSeries;
    
    // 添加%D线
    const dSeries = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: '%D',
    } as LineSeriesPartialOptions);
    stochasticDSeriesRef.current = dSeries;
    
    return { chart, kSeries, dSeries };
  }, [height, settings]);
  
  // 初始化ATR图表
  const initializeATRChart = useCallback(() => {
    if (!atrContainerRef.current || !settings.showATR) return;
    
    const chart = createChart(atrContainerRef.current, {
      width: atrContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    atrChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('ATR时间轴同步失败:', error);
          }
        }
      });
    }

    // 添加ATR线
    const atrSeries = chart.addSeries(LineSeries, {
      color: '#795548',
      lineWidth: 2,
      title: 'ATR',
    } as LineSeriesPartialOptions);
    atrSeriesRef.current = atrSeries;
    
    return { chart, atrSeries };
  }, [height, settings]);
  
  // 初始化CCI图表
  const initializeCCIChart = useCallback(() => {
    if (!cciContainerRef.current || !settings.showCCI) return;
    
    const chart = createChart(cciContainerRef.current, {
      width: cciContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    cciChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('CCI时间轴同步失败:', error);
          }
        }
      });
    }

    // 添加CCI线
    const cciSeries = chart.addSeries(LineSeries, {
      color: '#607d8b',
      lineWidth: 2,
      title: 'CCI',
    } as LineSeriesPartialOptions);
    cciSeriesRef.current = cciSeries;
    
    return { chart, cciSeries };
  }, [height, settings]);
  
  // 初始化Williams %R图表
  const initializeWilliamsRChart = useCallback(() => {
    if (!williamsRContainerRef.current || !settings.showWilliamsR) return;
    
    const chart = createChart(williamsRContainerRef.current, {
      width: williamsRContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    williamsRChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('Williams %R时间轴同步失败:', error);
          }
        }
      });
    }

    // 添加Williams %R线
    const williamsRSeries = chart.addSeries(LineSeries, {
      color: '#e91e63',
      lineWidth: 2,
      title: 'Williams %R',
    } as LineSeriesPartialOptions);
    williamsRSeriesRef.current = williamsRSeries;
    
    return { chart, williamsRSeries };
  }, [height, settings]);
  
  // SCORE系列引用
  const scoreSeriesRefs = useRef<{
    score5m?: ISeriesApi<'Line'>;
    score15m?: ISeriesApi<'Line'>;
    score1h?: ISeriesApi<'Line'>;
    score4h?: ISeriesApi<'Line'>;
    totalScore?: ISeriesApi<'Line'>;
  }>({});
  
  // 初始化SCORE图表
  const initializeScoreChart = useCallback(() => {
    if (!scoreContainerRef.current || !settings.showScore) return;
    
    const chart = createChart(scoreContainerRef.current, {
      width: scoreContainerRef.current.clientWidth,
      height: Math.floor(height * 0.13),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    scoreChartRef.current = chart;
    
    // 同步时间轴
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && chart && timeRange.from !== null && timeRange.to !== null) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            console.warn('SCORE时间轴同步失败:', error);
          }
        }
      });
    }

    const series: any = {};
    
    if (settings.showScore5m) {
      const score5mSeries = chart.addSeries(LineSeries, {
        color: '#2196f3',
        lineWidth: 2,
        title: '5m',
      } as LineSeriesPartialOptions);
      series.score5m = score5mSeries;
      scoreSeriesRefs.current.score5m = score5mSeries;
    }
    
    if (settings.showScore15m) {
      const score15mSeries = chart.addSeries(LineSeries, {
        color: '#4caf50',
        lineWidth: 2,
        title: '15m',
      } as LineSeriesPartialOptions);
      series.score15m = score15mSeries;
      scoreSeriesRefs.current.score15m = score15mSeries;
    }
    
    if (settings.showScore1h) {
      const score1hSeries = chart.addSeries(LineSeries, {
        color: '#ff9800',
        lineWidth: 2,
        title: '1h',
      } as LineSeriesPartialOptions);
      series.score1h = score1hSeries;
      scoreSeriesRefs.current.score1h = score1hSeries;
    }
    
    if (settings.showScore4h) {
      const score4hSeries = chart.addSeries(LineSeries, {
        color: '#f44336',
        lineWidth: 2,
        title: '4h',
      } as LineSeriesPartialOptions);
      series.score4h = score4hSeries;
      scoreSeriesRefs.current.score4h = score4hSeries;
    }
    
    const totalScoreSeries = chart.addSeries(LineSeries, {
      color: '#9c27b0',
      lineWidth: 3,
      title: 'Total',
    } as LineSeriesPartialOptions);
    series.totalScore = totalScoreSeries;
    scoreSeriesRefs.current.totalScore = totalScoreSeries;
    
    return { chart, series };
  }, [height, settings]);
  
  // 更新图表数据
  const updateChartData = useCallback(() => {
    if (!data || data.length === 0) return;
    
    // 计算技术指标
    const indicators = calculateTechnicalIndicators(data);
    
    const candlestickData = convertToCandlestickData(data);
    const volumeData = convertToVolumeData(data);
    
    // 更新主图表数据
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(candlestickData);
    }
    
    if (volumeSeriesRef.current && settings.showVolume) {
      volumeSeriesRef.current.setData(volumeData);
    }
    
    // 更新EMA数据（使用计算的指标）
    if (ema12SeriesRef.current && settings.showEMA12 && indicators.ema12) {
      const ema12Data = indicators.ema12.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.ema12.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      ema12SeriesRef.current.setData(ema12Data);
    }
    
    if (ema26SeriesRef.current && settings.showEMA26 && indicators.ema26) {
      const ema26Data = indicators.ema26.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.ema26.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      ema26SeriesRef.current.setData(ema26Data);
    }
    
    // 更新SMA数据
    if (sma20SeriesRef.current && settings.showSMA20 && indicators.sma20) {
      const sma20Data = indicators.sma20.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.sma20.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      sma20SeriesRef.current.setData(sma20Data);
    }
    
    // 更新布林带数据
    if (settings.showBollingerBands && indicators.bollingerBands) {
      if (bollingerUpperSeriesRef.current) {
        const upperData = indicators.bollingerBands.map((bb: any, index: number) => ({
          time: (new Date(data[data.length - indicators.bollingerBands.length + index].timestamp).getTime() / 1000) as Time,
          value: bb.upper,
        }));
        bollingerUpperSeriesRef.current.setData(upperData);
      }
      
      if (bollingerLowerSeriesRef.current) {
        const lowerData = indicators.bollingerBands.map((bb: any, index: number) => ({
          time: (new Date(data[data.length - indicators.bollingerBands.length + index].timestamp).getTime() / 1000) as Time,
          value: bb.lower,
        }));
        bollingerLowerSeriesRef.current.setData(lowerData);
      }
      
      if (bollingerMiddleSeriesRef.current) {
        const middleData = indicators.bollingerBands.map((bb: any, index: number) => ({
          time: (new Date(data[data.length - indicators.bollingerBands.length + index].timestamp).getTime() / 1000) as Time,
          value: bb.middle,
        }));
        bollingerMiddleSeriesRef.current.setData(middleData);
      }
    }
    
    // 更新MACD数据（使用计算的指标）
    if (settings.showMACD && indicators.macd) {
      if (macdSeriesRef.current) {
        const macdData = indicators.macd.map((macd: any, index: number) => ({
          time: (new Date(data[data.length - indicators.macd.length + index].timestamp).getTime() / 1000) as Time,
          value: macd.MACD,
        }));
        macdSeriesRef.current.setData(macdData);
      }
      
      if (macdSignalSeriesRef.current) {
        const signalData = indicators.macd.map((macd: any, index: number) => ({
          time: (new Date(data[data.length - indicators.macd.length + index].timestamp).getTime() / 1000) as Time,
          value: macd.signal,
        }));
        macdSignalSeriesRef.current.setData(signalData);
      }
      
      if (macdHistogramSeriesRef.current) {
        const histData = indicators.macd.map((macd: any, index: number) => ({
          time: (new Date(data[data.length - indicators.macd.length + index].timestamp).getTime() / 1000) as Time,
          value: macd.histogram,
          color: macd.histogram >= 0 ? '#26a69a' : '#ef5350',
        }));
        macdHistogramSeriesRef.current.setData(histData);
      }
    }
    
    // 更新RSI数据（使用计算的指标）
    if (settings.showRSI && rsiSeriesRef.current && indicators.rsi) {
      const rsiData = indicators.rsi.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.rsi.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      rsiSeriesRef.current.setData(rsiData);
    }
    
    // 更新Stochastic数据
    if (settings.showStochastic && indicators.stochastic) {
      if (stochasticKSeriesRef.current) {
        const kData = indicators.stochastic.map((stoch: any, index: number) => ({
          time: (new Date(data[data.length - indicators.stochastic.length + index].timestamp).getTime() / 1000) as Time,
          value: stoch.k,
        }));
        stochasticKSeriesRef.current.setData(kData);
      }
      
      if (stochasticDSeriesRef.current) {
        const dData = indicators.stochastic.map((stoch: any, index: number) => ({
          time: (new Date(data[data.length - indicators.stochastic.length + index].timestamp).getTime() / 1000) as Time,
          value: stoch.d,
        }));
        stochasticDSeriesRef.current.setData(dData);
      }
    }
    
    // 更新ATR数据
    if (settings.showATR && atrSeriesRef.current && indicators.atr) {
      const atrData = indicators.atr.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.atr.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      atrSeriesRef.current.setData(atrData);
    }
    
    // 更新CCI数据
    if (settings.showCCI && cciSeriesRef.current && indicators.cci) {
      const cciData = indicators.cci.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.cci.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      cciSeriesRef.current.setData(cciData);
    }
    
    // 更新Williams %R数据
    if (settings.showWilliamsR && williamsRSeriesRef.current && indicators.williamsR) {
      const williamsRData = indicators.williamsR.map((value: number, index: number) => ({
        time: (new Date(data[data.length - indicators.williamsR.length + index].timestamp).getTime() / 1000) as Time,
        value,
      }));
      williamsRSeriesRef.current.setData(williamsRData);
    }
    
    // 更新SCORE数据（保持原有逻辑）
    if (settings.showScore) {
      if (settings.showScore5m && scoreSeriesRefs.current.score5m) {
        const score5mData = convertToLineData(data, 'score_5m');
        scoreSeriesRefs.current.score5m.setData(score5mData);
      }
      
      if (settings.showScore15m && scoreSeriesRefs.current.score15m) {
        const score15mData = convertToLineData(data, 'score_15m');
        scoreSeriesRefs.current.score15m.setData(score15mData);
      }
      
      if (settings.showScore1h && scoreSeriesRefs.current.score1h) {
        const score1hData = convertToLineData(data, 'score_1h');
        scoreSeriesRefs.current.score1h.setData(score1hData);
      }
      
      if (settings.showScore4h && scoreSeriesRefs.current.score4h) {
        const score4hData = convertToLineData(data, 'score_4h');
        scoreSeriesRefs.current.score4h.setData(score4hData);
      }
      
      if (scoreSeriesRefs.current.totalScore) {
        const totalScoreData = convertToLineData(data, 'total_score');
        scoreSeriesRefs.current.totalScore.setData(totalScoreData);
      }
    }
  }, [data, settings, calculateTechnicalIndicators, convertToCandlestickData, convertToVolumeData, convertToLineData]);
  
  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // 初始化图表
  useEffect(() => {
    initializeMainChart();
    if (settings.showMACD) initializeMACDChart();
    if (settings.showRSI) initializeRSIChart();
    if (settings.showStochastic) initializeStochasticChart();
    if (settings.showATR) initializeATRChart();
    if (settings.showCCI) initializeCCIChart();
    if (settings.showWilliamsR) initializeWilliamsRChart();
    if (settings.showScore) initializeScoreChart();
    
    return () => {
      chartRef.current?.remove();
      macdChartRef.current?.remove();
      rsiChartRef.current?.remove();
      stochasticChartRef.current?.remove();
      atrChartRef.current?.remove();
      cciChartRef.current?.remove();
      williamsRChartRef.current?.remove();
      scoreChartRef.current?.remove();
    };
  }, [initializeMainChart, initializeMACDChart, initializeRSIChart, initializeStochasticChart, initializeATRChart, initializeCCIChart, initializeWilliamsRChart, initializeScoreChart, settings]);
  
  // 更新数据
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);
  
  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
      if (macdChartRef.current && macdContainerRef.current) {
        macdChartRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth,
        });
      }
      if (rsiChartRef.current && rsiContainerRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
        });
      }
      if (stochasticChartRef.current && stochasticContainerRef.current) {
        stochasticChartRef.current.applyOptions({
          width: stochasticContainerRef.current.clientWidth,
        });
      }
      if (atrChartRef.current && atrContainerRef.current) {
        atrChartRef.current.applyOptions({
          width: atrContainerRef.current.clientWidth,
        });
      }
      if (cciChartRef.current && cciContainerRef.current) {
        cciChartRef.current.applyOptions({
          width: cciContainerRef.current.clientWidth,
        });
      }
      if (williamsRChartRef.current && williamsRContainerRef.current) {
        williamsRChartRef.current.applyOptions({
          width: williamsRContainerRef.current.clientWidth,
        });
      }
      if (scoreChartRef.current && scoreContainerRef.current) {
        scoreChartRef.current.applyOptions({
          width: scoreContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无交易数据</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">请选择交易对并等待数据加载</p>
        </div>
      </div>
    );
  }
  
  const latestData = data[data.length - 1];
  const prevData = data[data.length - 2];
  const priceChange = latestData && prevData ? latestData.close - prevData.close : 0;
  const priceChangePercent = prevData ? (priceChange / prevData.close) * 100 : 0;
  
  return (
    <div className={`w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 图表头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pair}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">TradingView专业图表</p>
          </div>
          
          {latestData && (
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {latestData.close.toFixed(6)}
                </p>
                <p className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">24h最高</p>
                  <p className="font-medium">{Math.max(...data.map(d => d.high)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h最低</p>
                  <p className="font-medium">{Math.min(...data.map(d => d.low)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h成交量</p>
                  <p className="font-medium">{data.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">数据点</p>
                  <p className="font-medium">{data.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* 移动平均线 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">移动平均线</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showEMA12}
                    onChange={(e) => setSettings(prev => ({ ...prev, showEMA12: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">EMA12</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showEMA26}
                    onChange={(e) => setSettings(prev => ({ ...prev, showEMA26: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">EMA26</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showSMA20}
                    onChange={(e) => setSettings(prev => ({ ...prev, showSMA20: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">SMA20</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showBollingerBands}
                    onChange={(e) => setSettings(prev => ({ ...prev, showBollingerBands: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">布林带</span>
                </label>
              </div>
            </div>
            
            {/* 技术指标 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">技术指标</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showMACD}
                    onChange={(e) => setSettings(prev => ({ ...prev, showMACD: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">MACD</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showRSI}
                    onChange={(e) => setSettings(prev => ({ ...prev, showRSI: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">RSI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showStochastic}
                    onChange={(e) => setSettings(prev => ({ ...prev, showStochastic: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Stochastic</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showATR}
                    onChange={(e) => setSettings(prev => ({ ...prev, showATR: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">ATR</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showCCI}
                    onChange={(e) => setSettings(prev => ({ ...prev, showCCI: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">CCI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showWilliamsR}
                    onChange={(e) => setSettings(prev => ({ ...prev, showWilliamsR: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Williams %R</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showVolume}
                    onChange={(e) => setSettings(prev => ({ ...prev, showVolume: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">成交量</span>
                </label>
              </div>
            </div>
            
            {/* SCORE指标 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SCORE指标</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">SCORE图表</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore5m}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore5m: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-blue-600">5分钟</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore15m}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore15m: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-green-600">15分钟</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore1h}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore1h: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-orange-600">1小时</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore4h}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore4h: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-red-600">4小时</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 图表区域 */}
      <div className="p-4 space-y-2">
        {/* 主K线图 */}
        <div className="relative">
          <div className="absolute top-2 left-4 z-10">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
              价格图表 (TradingView)
            </span>
          </div>
          <div ref={chartContainerRef} className="w-full" />
        </div>
        
        {/* MACD图表 */}
        {settings.showMACD && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                MACD
              </span>
            </div>
            <div ref={macdContainerRef} className="w-full" />
          </div>
        )}
        
        {/* RSI图表 */}
        {settings.showRSI && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                RSI
              </span>
            </div>
            <div ref={rsiContainerRef} className="w-full" />
          </div>
        )}
        
        {/* Stochastic图表 */}
        {settings.showStochastic && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                Stochastic
              </span>
            </div>
            <div className="absolute top-2 right-4 z-10 flex space-x-2">
              <span className="text-xs text-blue-600">●%K</span>
              <span className="text-xs text-orange-600">●%D</span>
            </div>
            <div ref={stochasticContainerRef} className="w-full" />
          </div>
        )}
        
        {/* ATR图表 */}
        {settings.showATR && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                ATR
              </span>
            </div>
            <div ref={atrContainerRef} className="w-full" />
          </div>
        )}
        
        {/* CCI图表 */}
        {settings.showCCI && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                CCI
              </span>
            </div>
            <div ref={cciContainerRef} className="w-full" />
          </div>
        )}
        
        {/* Williams %R图表 */}
        {settings.showWilliamsR && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                Williams %R
              </span>
            </div>
            <div ref={williamsRContainerRef} className="w-full" />
          </div>
        )}
        
        {/* SCORE图表 */}
        {settings.showScore && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                SCORE指标
              </span>
            </div>
            <div className="absolute top-2 right-4 z-10 flex space-x-2">
              <span className="text-xs text-blue-600">●5m</span>
              <span className="text-xs text-green-600">●15m</span>
              <span className="text-xs text-orange-600">●1h</span>
              <span className="text-xs text-red-600">●4h</span>
              <span className="text-xs text-purple-600">●总分</span>
            </div>
            <div ref={scoreContainerRef} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;