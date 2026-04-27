import axios from 'axios';

// 1. 标准响应格式
export interface BaseResponse<T> {
  code: number;
  data: T;
  message: string;
  timestamp: number;
}

export interface PlanData {
  itinerary: string;
  waypoints: any[];
}

export interface PlanRequest {
  user_input: string;
  preferences?: Record<string, any>;
}

/**
 * [AI 核心] 发送至 Python (Port 8000)
 */
export const createItinerary = async (request: PlanRequest): Promise<PlanData> => {
  // 改为调用 Java 后端 (8080)，由 Java 负责转发给 Python 并持久化到数据库
  const response = await axios.post<any>('http://localhost:8080/api/travel/itinerary', {
    userId: request.preferences?.user_id, // 适配 Java 后端的 PlanRequest.userId
    query: request.user_input              // 适配 Java 后端的 PlanRequest.query
  });
  
  // Java 后端返回的是 PlanResponse 中的 DataContent 部分，或者直接返回 PlanData
  // 根据 ItineraryController.java，它返回 Mono<PlanResponse>
  // 但 ItineraryService.java 中的 generateItinerary 返回的是 Mono<PlanResponse>
  // 这里的类型需要根据 Java 端的 @RestController 行为来确定。
  // 假设 Java 端直接透传了 Python 的 BaseResponse 结构，但被 PlanResponse 捕获了。
  
  const data = (response.data as any);
  console.log('Java Backend Response:', data);
  if (data.data) {
    return data.data;
  }
  return data;
};

/**
 * [业务逻辑] 发送至 Java (Port 8080)
 */
export const getHistory = async (userId: string): Promise<any[]> => {
  console.log(`正在请求 Java 后端历史记录: ${userId}...`);
  // 强制指定 8080 端口，绕过一切代理
  const response = await axios.get(`http://localhost:8080/api/travel/history/${userId}`);
  return response.data;
};

/**
 * [业务逻辑] 删除历史 (Java)
 */
export const deleteItinerary = async (id: number): Promise<void> => {
  await axios.delete(`http://localhost:8080/api/travel/history/${id}`);
};
