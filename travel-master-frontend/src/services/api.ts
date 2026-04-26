import axios from 'axios';

// 定义接口返回的数据类型
export interface PlanRequest {
  query: string;
  userId: string;
}

export interface PlanResponse {
  itinerary: string;
  status: string;
  waypoints?: any[];
}

export interface Itinerary {
  id: number;
  userId: string;
  content: string;
  createdAt: string;
  waypoints?: string; // from Java DB it's stored as JSON string
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api/travel',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 发送行程规划请求到 Java 后端
 */
export const createItinerary = async (request: PlanRequest): Promise<PlanResponse> => {
  const response = await apiClient.post('/itinerary', request);
  return response.data;
};

/**
 * 获取用户的历史行程列表
 */
export const getHistory = async (userId: string): Promise<Itinerary[]> => {
  const response = await apiClient.get(`/history/${userId}`);
  return response.data;
};

/**
 * 删除指定的历史行程
 */
export const deleteItinerary = async (id: number): Promise<void> => {
  await apiClient.delete(`/history/${id}`);
};
