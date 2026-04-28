import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AuthResponse,
  type AuthorSummary,
  type NotificationResponse,
  type PostResponse,
  type TaskResponse,
  commentOnPost,
  createTask,
  favoritePost,
  followUser,
  getAnalyticsDestinations,
  getAnalyticsFunnel,
  getAnalyticsOverview,
  getCreatorRankings,
  getFeed,
  getHotItineraries,
  getMe,
  getNotifications,
  getTask,
  likePost,
  login,
  markNotificationRead,
  publishItinerary,
  register,
  setAccessToken,
} from './services/api';
import { useNotificationWs } from './hooks/useNotificationWs';

type Mode = 'login' | 'register';

const dashboardBand = 'border border-gray-200 bg-white';

function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [taskInput, setTaskInput] = useState('北京3天文化游，预算中等，想多逛博物馆和古建');
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [feed, setFeed] = useState<PostResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [hotPosts, setHotPosts] = useState<PostResponse[]>([]);
  const [topCreators, setTopCreators] = useState<AuthorSummary[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState<Record<string, number>>({});
  const [analyticsFunnel, setAnalyticsFunnel] = useState<Record<string, number>>({});
  const [analyticsDestinations, setAnalyticsDestinations] = useState<Array<Record<string, string | number>>>([]);
  const [status, setStatus] = useState<string>('');
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const pollTimer = useRef<number | null>(null);

  const isAuthenticated = useMemo(() => Boolean(auth?.accessToken), [auth]);

  const onWsNotification = useCallback(() => {
    loadDashboard();
  }, []);
  useNotificationWs(auth?.user.userId, onWsNotification);

  const loadDashboard = async () => {
    const [feedData, notificationData, hotData, creatorData, overviewData, funnelData, destinationData] = await Promise.all([
      getFeed(),
      getNotifications().catch(() => []),
      getHotItineraries(),
      getCreatorRankings(),
      getAnalyticsOverview(),
      getAnalyticsFunnel(),
      getAnalyticsDestinations(),
    ]);
    setFeed(feedData);
    setNotifications(notificationData);
    setHotPosts(hotData);
    setTopCreators(creatorData);
    setAnalyticsOverview(overviewData);
    setAnalyticsFunnel(funnelData);
    setAnalyticsDestinations(destinationData);
  };

  const clearPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const startPolling = (taskId: string) => {
    clearPolling();
    pollTimer.current = window.setInterval(async () => {
      const latest = await getTask(taskId);
      setTask(latest);
      if (latest.status === 'COMPLETED' || latest.status === 'FAILED') {
        clearPolling();
        await loadDashboard();
      }
    }, 2500);
  };

  const handleAuth = async () => {
    const response =
      mode === 'login'
        ? await login({ account, password })
        : await register({ email: account, password, nickname });
    setAccessToken(response.accessToken);
    setAuth(response);
    setStatus(`已登录: ${response.user.nickname}`);
    await loadDashboard();
  };

  const handleCreateTask = async () => {
    const created = await createTask({
      userInput: taskInput,
      preferences: { user_id: auth?.user.userId, creator_style: '求职作品' },
      travelConstraints: { audience: 'backend-interview-demo' },
      promptVersion: 'v1-pro',
    });
    setTask(created);
    setStatus(`任务已提交: ${created.taskId}`);
    startPolling(created.taskId);
  };

  const handlePublish = async () => {
    if (!task?.itinerary) return;
    await publishItinerary(task.itinerary.itineraryId, {
      title: task.itinerary.title,
      caption: task.itinerary.summary,
    });
    setStatus('行程已发布到 feed');
    await loadDashboard();
  };

  const refreshMe = async () => {
    const me = await getMe();
    setAuth((current) => (current ? { ...current, user: me } : current));
  };

  useEffect(() => {
    const token = localStorage.getItem('tm_access_token');
    if (!token) return;
    setAccessToken(token);
    getMe()
      .then((user) => {
        setAuth({ accessToken: token, refreshToken: '', accessTokenExpiresInSeconds: 0, user });
        return loadDashboard();
      })
      .catch(() => setAccessToken(null));
    return () => clearPolling();
  }, []);

  const summaryCards = [
    { label: '用户数', value: analyticsOverview.userCount ?? 0 },
    { label: '任务数', value: analyticsOverview.taskCount ?? 0 },
    { label: '完成任务', value: analyticsOverview.completedTaskCount ?? 0 },
    { label: '帖子数', value: analyticsOverview.postCount ?? 0 },
    { label: '评论数', value: analyticsOverview.commentCount ?? 0 },
    { label: '未读通知', value: analyticsOverview.unreadNotificationCount ?? notifications.filter((item) => !item.read).length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">TravelMaster Pro</h1>
            <p className="mt-1 text-sm text-gray-500">Java 主后端 + Python AI Planner 的旅游社交求职项目</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>{auth?.user.nickname ?? '未登录'}</div>
            <div>{auth?.user.membershipTier ?? 'STANDARD'} / Lv.{auth?.user.level ?? 0}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
        <section className={`${dashboardBand} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">账号与任务</h2>
            <button
              className="text-xs text-blue-600"
              onClick={() => setMode((current) => (current === 'login' ? 'register' : 'login'))}
            >
              {mode === 'login' ? '切换注册' : '切换登录'}
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="mt-4 space-y-3">
              <input
                className="w-full border border-gray-300 px-3 py-2 text-sm"
                placeholder={mode === 'login' ? '邮箱或手机号' : '邮箱'}
                value={account}
                onChange={(event) => setAccount(event.target.value)}
              />
              {mode === 'register' && (
                <input
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  placeholder="昵称"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
              )}
              <input
                className="w-full border border-gray-300 px-3 py-2 text-sm"
                type="password"
                placeholder="密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="w-full bg-gray-900 px-3 py-2 text-sm font-medium text-white" onClick={handleAuth}>
                {mode === 'login' ? '登录' : '注册并登录'}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-1 border border-gray-200 p-3 text-sm">
                <div className="font-medium">{auth?.user.nickname}</div>
                <div className="text-gray-500">{auth?.user.bio || '暂无简介'}</div>
                <div className="text-gray-500">偏好标签: {(auth?.user.preferenceTags || []).join(', ') || '未设置'}</div>
                <button className="text-xs text-blue-600" onClick={refreshMe}>
                  刷新个人资料
                </button>
              </div>

              <textarea
                className="min-h-[140px] w-full border border-gray-300 px-3 py-2 text-sm"
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
              />
              <button className="w-full bg-blue-600 px-3 py-2 text-sm font-medium text-white" onClick={handleCreateTask}>
                创建 AI 行程任务
              </button>

              {task && (
                <div className="space-y-3 border border-gray-200 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">任务状态</span>
                    <span>{task.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">Task ID: {task.taskId}</div>
                  {task.failureReason && <div className="text-sm text-red-600">{task.failureReason}</div>}
                  {task.itinerary && (
                    <>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="text-sm font-medium">{task.itinerary.title}</div>
                        <div className="mt-1 text-sm text-gray-600">{task.itinerary.summary}</div>
                        <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap bg-gray-50 p-3 text-xs leading-6">
                          {task.itinerary.renderedMarkdown}
                        </div>
                      </div>
                      <button className="w-full border border-gray-900 px-3 py-2 text-sm font-medium" onClick={handlePublish}>
                        发布到社交 Feed
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {status && <div className="mt-4 text-xs text-gray-500">{status}</div>}
        </section>

        <section className="space-y-6">
          <div className={`${dashboardBand} px-5 py-4`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">运营概览</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {summaryCards.map((card) => (
                <div key={card.label} className="border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">{card.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{card.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="border border-gray-200 p-3 text-sm">
                <div className="font-medium">转化漏斗</div>
                <div className="mt-2 text-gray-600">创建任务: {analyticsFunnel.taskCreated ?? 0}</div>
                <div className="text-gray-600">完成任务: {analyticsFunnel.taskCompleted ?? 0}</div>
                <div className="text-gray-600">发布帖子: {analyticsFunnel.postPublished ?? 0}</div>
              </div>
              <div className="border border-gray-200 p-3 text-sm">
                <div className="font-medium">热门目的地</div>
                <div className="mt-2 space-y-1 text-gray-600">
                  {analyticsDestinations.map((item, index) => (
                    <div key={`${item.destination}-${index}`} className="flex justify-between">
                      <span>{String(item.destination)}</span>
                      <span>{String(item.tripCount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className={`${dashboardBand} px-5 py-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">社交 Feed</h2>
              <div className="mt-4 space-y-4">
                {feed.map((post) => (
                  <article key={post.postId} className="border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">{post.title}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          {post.author?.nickname || '系统发布'} · {new Date(post.publishedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{post.author?.following ? '已关注作者' : '未关注作者'}</div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-700">{post.contentExcerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <button className="border border-gray-300 px-3 py-1" onClick={async () => { await likePost(post.postId); await loadDashboard(); }}>
                        点赞 {post.likeCount}
                      </button>
                      <button className="border border-gray-300 px-3 py-1" onClick={async () => { await favoritePost(post.postId); await loadDashboard(); }}>
                        收藏 {post.favoriteCount}
                      </button>
                      <span className="px-3 py-1 text-gray-500">评论 {post.commentCount}</span>
                      {post.author && !post.author.following && auth?.user.userId !== post.author.userId && (
                        <button className="border border-blue-400 px-3 py-1 text-blue-600" onClick={async () => { await followUser(post.author!.userId); await loadDashboard(); }}>
                          + 关注
                        </button>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="mt-3 flex gap-2">
                        <input
                          className="flex-1 border border-gray-300 px-3 py-1 text-sm"
                          placeholder="写一条评论…"
                          value={commentTexts[post.postId] || ''}
                          onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.postId]: e.target.value }))}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && commentTexts[post.postId]?.trim()) {
                              await commentOnPost(post.postId, commentTexts[post.postId].trim());
                              setCommentTexts((prev) => ({ ...prev, [post.postId]: '' }));
                              await loadDashboard();
                            }
                          }}
                        />
                        <button
                          className="border border-gray-300 px-3 py-1 text-sm"
                          onClick={async () => {
                            if (commentTexts[post.postId]?.trim()) {
                              await commentOnPost(post.postId, commentTexts[post.postId].trim());
                              setCommentTexts((prev) => ({ ...prev, [post.postId]: '' }));
                              await loadDashboard();
                            }
                          }}
                        >
                          发送
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${dashboardBand} px-5 py-4`}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">未读通知</h2>
                <div className="mt-4 space-y-3">
                  {notifications.map((item) => (
                    <div key={item.notificationId} className="border border-gray-200 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        <button className="text-xs text-blue-600" onClick={async () => { await markNotificationRead(item.notificationId); await loadDashboard(); }}>
                          {item.read ? '已读' : '标记已读'}
                        </button>
                      </div>
                      <div className="mt-1 text-gray-600">{item.content}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${dashboardBand} px-5 py-4`}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">排行榜</h2>
                <div className="mt-4 grid gap-4">
                  <div className="border border-gray-200 p-3 text-sm">
                    <div className="font-medium">热门行程</div>
                    <div className="mt-2 space-y-2 text-gray-600">
                      {hotPosts.map((post) => (
                        <div key={post.postId} className="flex justify-between gap-2">
                          <span className="truncate">{post.title}</span>
                          <span>{post.likeCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 p-3 text-sm">
                    <div className="font-medium">优质创作者</div>
                    <div className="mt-2 space-y-2 text-gray-600">
                      {topCreators.map((creator) => (
                        <div key={creator.userId} className="flex justify-between gap-2">
                          <span>{creator.nickname}</span>
                          <span>{creator.following ? '已关注' : '创作者'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
