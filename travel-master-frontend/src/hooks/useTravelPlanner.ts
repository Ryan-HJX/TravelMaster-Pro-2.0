import { useState, useCallback } from 'react';
import { createItinerary, getHistory, deleteItinerary, type PlanResponse, type Itinerary } from '../services/api';

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
    let parsedWaypoints = [];
    if (itinerary.waypoints) {
      try {
        parsedWaypoints = typeof itinerary.waypoints === 'string' 
          ? JSON.parse(itinerary.waypoints) 
          : itinerary.waypoints;
      } catch (e) {
        console.error('解析历史途径点失败:', e);
      }
    }
    
    setCurrentItinerary({
      itinerary: itinerary.content,
      status: 'success',
      waypoints: parsedWaypoints,
    });
  }, []);

  /**
   * 删除指定的历史记录
   */
  const removeItinerary = useCallback(async (id: number) => {
    try {
      await deleteItinerary(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      // 如果当前正在查看的就是被删除的行程，清空当前视图
      setCurrentItinerary(prev => {
        // 如果当前没有行程，就不管
        if (!prev) return prev;
        // 如果我们能获取到当前 itinerary 的某些标志（这里简单清空，因为如果删除了最好清空界面或者至少历史记录中没了）
        // 更严谨的话，ItineraryViewer 可能需要一个当前查看的 ID，但这里我们就先不强行清空，或者每次删除都清空
        return prev;
      });
    } catch (err: any) {
      console.error('删除历史记录失败:', err);
      // 可以选择暴露 error 给组件层
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
