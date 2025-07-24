import { io, Socket } from 'socket.io-client';
import { CandleData, IndicatorData, ScoringData } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionChangeCallbacks: ((connected: boolean) => void)[] = [];

  connect(url: string = 'ws://localhost:3001'): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });
  }

  // 订阅新的K线数据
  onNewCandleData(callback: (data: CandleData) => void): void {
    this.socket?.on('new_candle_data', callback);
  }

  // 订阅新的指标数据
  onNewIndicatorData(callback: (data: IndicatorData) => void): void {
    this.socket?.on('new_indicator_data', callback);
  }

  // 订阅新的评分数据
  onNewScoringData(callback: (data: ScoringData) => void): void {
    this.socket?.on('new_scoring_data', callback);
  }

  // 订阅特定交易对的数据更新
  subscribeToPair(pair: string): void {
    this.socket?.emit('subscribe_pair', pair);
  }

  // 取消订阅特定交易对
  unsubscribeFromPair(pair: string): void {
    this.socket?.emit('unsubscribe_pair', pair);
  }

  // 订阅所有数据更新
  subscribeToAll(): void {
    this.socket?.emit('subscribe_all');
  }

  // 取消所有订阅
  unsubscribeAll(): void {
    this.socket?.emit('unsubscribe_all');
  }

  // 移除事件监听器
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 获取Socket实例
  getSocket(): Socket | null {
    return this.socket;
  }

  // 监听连接状态变化
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionChangeCallbacks.push(callback);
  }

  // 移除连接状态变化监听器
  offConnectionChange(callback: (connected: boolean) => void): void {
    const index = this.connectionChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionChangeCallbacks.splice(index, 1);
    }
  }

  // 通知连接状态变化
  private notifyConnectionChange(connected: boolean): void {
    this.connectionChangeCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection change callback:', error);
      }
    });
  }
}

// 创建单例实例
const websocketService = new WebSocketService();

export default websocketService;