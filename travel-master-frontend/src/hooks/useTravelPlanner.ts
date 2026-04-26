import { useState, useCallback } from 'react';
import { createItinerary, getHistory, type PlanResponse, type Itinerary } from '../services/api';

/**
 * 自定义 Hook：管理旅行规划相关的状态和逻辑
 */
export const useTravelPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<PlanResponse | null>(null);
  const [history, setHistory] = useState<Itinerary[]>([]);

  /**
   * 生成新的行程单
   */
  const generateItinerary = useCallback(async (query: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createItinerary({ query, userId });
      setCurrentItinerary(result);
      // 生成成功后刷新历史记录
      await fetchHistory(userId);
    } catch (err: any) {
      setError(err.message || '生成行程单失败，请稍后重试');
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
      setHistory(historyList);
    } catch (err: any) {
      console.error('获取历史记录失败:', err);
    }
  }, []);

  /**
   * 从历史记录中选择一个行程进行查看
   */
  const selectFromHistory = useCallback((itinerary: Itinerary) => {
    setCurrentItinerary({
      itinerary: itinerary.content,
      status: 'success',
    });
  }, []);

  return {
    loading,
    error,
    currentItinerary,
    history,
    generateItinerary,
    fetchHistory,
    selectFromHistory,
  };
};
