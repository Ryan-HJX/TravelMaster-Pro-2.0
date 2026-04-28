import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

export type MembershipTier = 'STANDARD' | 'VIP';
export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserProfile {
  userId: string;
  email?: string;
  phone?: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  membershipTier: MembershipTier;
  level: number;
  points: number;
  preferenceTags: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  user: UserProfile;
}

export interface ItineraryItem {
  dayNumber: number;
  sequenceNumber: number;
  itemTitle: string;
  activityType: string;
  address: string;
  startTime: string;
  endTime: string;
  transportMode?: string;
  transportDurationMinutes?: number;
  notes?: string;
}

export interface ItineraryResponse {
  itineraryId: string;
  title: string;
  summary: string;
  riskTips: string;
  renderedMarkdown: string;
  structuredContent: string;
  financeSummary?: string;
  publishedAt?: string;
  items: ItineraryItem[];
}

export interface TaskResponse {
  taskId: string;
  traceId: string;
  promptVersion: string;
  userInput: string;
  status: TaskStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  itinerary?: ItineraryResponse;
  progress?: TaskProgress;
}

export interface ProgressStep {
  stepId: string;
  stepName: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
}

export interface TaskProgress {
  taskId: string;
  currentStep?: string;
  overallProgress: number;
  steps: ProgressStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorSummary {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  following: boolean;
}

export interface PostResponse {
  postId: string;
  itineraryId: string;
  title: string;
  contentExcerpt: string;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  liked: boolean;
  favorited: boolean;
  author?: AuthorSummary;
  publishedAt: string;
}

export interface NotificationResponse {
  notificationId: string;
  type: string;
  title: string;
  content: string;
  actorId?: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  read: boolean;
  createdAt: string;
}

export interface PlanData {
  itinerary: string;
  waypoints: any[];
  structured?: Record<string, unknown>;
}

export interface Itinerary {
  id: number;
  content: string;
  createdAt: string;
  waypoints?: any[] | string;
}

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('tm_access_token', token);
  } else {
    localStorage.removeItem('tm_access_token');
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};

export const register = (payload: { email: string; phone?: string; password: string; nickname: string }) =>
  unwrap<AuthResponse>(api.post('/api/auth/register', payload));

export const login = (payload: { account: string; password: string }) =>
  unwrap<AuthResponse>(api.post('/api/auth/login', payload));

export const getMe = () => unwrap<UserProfile>(api.get('/api/users/me'));
export const updateProfile = (payload: { nickname: string; bio?: string; avatarUrl?: string; phone?: string; preferenceTags?: string[] }) =>
  unwrap<UserProfile>(api.put('/api/users/me', payload));

export const createTask = (payload: { userInput: string; preferences?: Record<string, unknown>; travelConstraints?: Record<string, unknown>; promptVersion?: string }) =>
  unwrap<TaskResponse>(api.post('/api/itinerary-tasks', payload));

export const getTask = (taskId: string) =>
  unwrap<TaskResponse>(api.get(`/api/itinerary-tasks/${taskId}`));

export const publishItinerary = (itineraryId: string, payload: { title: string; caption?: string }) =>
  unwrap<PostResponse>(api.post(`/api/itineraries/${itineraryId}/publish`, payload));

export const unpublishItinerary = (itineraryId: string) =>
  unwrap<void>(api.post(`/api/itineraries/${itineraryId}/unpublish`));

export const getFeed = () => unwrap<PostResponse[]>(api.get('/api/feed'));
export const likePost = (postId: string) => unwrap<PostResponse>(api.post(`/api/posts/${postId}/like`));
export const favoritePost = (postId: string) => unwrap<PostResponse>(api.post(`/api/posts/${postId}/favorite`));
export const commentOnPost = (postId: string, content: string, parentId?: string) =>
  unwrap<unknown>(api.post(`/api/posts/${postId}/comments`, { content, parentId }));
export const followUser = (userId: string) =>
  unwrap<unknown>(api.post(`/api/users/${userId}/follow`));

export const getNotifications = () => unwrap<NotificationResponse[]>(api.get('/api/notifications'));
export const markNotificationRead = (notificationId: string) =>
  unwrap<NotificationResponse>(api.post(`/api/notifications/${notificationId}/read`));

export const getHotItineraries = () => unwrap<PostResponse[]>(api.get('/api/rankings/hot-itineraries'));
export const getCreatorRankings = () => unwrap<AuthorSummary[]>(api.get('/api/rankings/creators'));

export const getAnalyticsOverview = () => unwrap<Record<string, number>>(api.get('/api/analytics/overview'));
export const getAnalyticsFunnel = () => unwrap<Record<string, number>>(api.get('/api/analytics/funnel'));
export const getAnalyticsDestinations = () => unwrap<Array<Record<string, string | number>>>(api.get('/api/analytics/destinations'));

export const createItinerary = async (payload: { user_input: string; preferences?: Record<string, unknown> }): Promise<PlanData> => {
  const response = await api.post('/api/travel/itinerary', {
    query: payload.user_input,
    userId: payload.preferences?.user_id,
  });
  return response.data.data ?? response.data;
};

export const getHistory = () => unwrap<ItineraryResponse[]>(api.get('/api/itineraries'));
export const getItinerary = (id: string) => unwrap<ItineraryResponse>(api.get(`/api/itineraries/${id}`));

export const deleteItinerary = async (id: number | string): Promise<void> => {
  await api.delete(`/api/itineraries/${id}`);
};
