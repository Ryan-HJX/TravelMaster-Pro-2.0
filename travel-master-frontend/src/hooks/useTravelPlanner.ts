import { useState, useCallback } from 'react';
import { createItinerary, getHistory, deleteItinerary, type PlanData } from '../services/api';

/**
 * 自定义 Hook：管理旅行规划相关的状态和逻辑 (适配 Python 1.0 架构)
 */
export const useTravelPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<PlanData | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  /**
   * 生成新的行程单 (调用 Python 异步 Agent)
   */
  const generateItinerary = useCallback(async (userInput: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 这里的 preferences 可以后续扩展，目前先传入基础信息
      const result = await createItinerary({ 
        user_input: userInput,
        preferences: { user_id: userId } 
      });
      
      setCurrentItinerary(result);
      
      // 成功后尝试刷新历史记录 (如果后端实现了 history 接口)
      try {
        await fetchHistory(userId);
      } catch (e) {
        console.warn('历史记录刷新失败，可能接口未实现');
      }
    } catch (err: any) {
      setError(err.message || '生成行程单失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取历史行程列表
   */
  const fetchHistory = useCallback(async (userId: string) => {
    try {
      const historyList = await getHistory(userId);
      setHistory(historyList || []);
    } catch (err: any) {
      console.error('获取历史记录失败:', err);
    }
  }, []);

  /**
   * 从历史记录中选择一个行程进行查看
   */
  const selectFromHistory = useCallback((item: any) => {
    setCurrentItinerary({
      itinerary: item.content || item.itinerary,
      waypoints: typeof item.waypoints === 'string' ? JSON.parse(item.waypoints) : item.waypoints
    });
  }, []);

  /**
   * 删除指定的历史记录
   */
  const removeItinerary = useCallback(async (id: number) => {
    try {
      await deleteItinerary(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('删除历史记录失败:', err);
    }
  }, []);

  return {
    loading,
    error,
    currentItinerary,
    history,
    generateItinerary,
    fetchHistory,
    selectFromHistory,
    removeItinerary,
  };
};
