import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, TrendingUp, Users, Bell, 
  MessageSquare, Heart, Bookmark, ArrowUpRight,
  LogOut, Settings, LayoutDashboard, History, MapPin, Trash2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getFeed, getNotifications, getAnalyticsOverview, 
  getHotItineraries, getCreatorRankings, createTask,
  getHistory, likePost, favoritePost, followUser,
  getAnalyticsFunnel, getAnalyticsDestinations, deleteItinerary,
  type PostResponse, type AuthorSummary, type NotificationResponse, type ItineraryResponse
} from '../services/api';

const DashboardPage: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [taskInput, setTaskInput] = useState('北京3天文化游，预算中等，想多逛博物馆和古建');
  const [feed, setFeed] = useState<PostResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [history, setHistory] = useState<ItineraryResponse[]>([]);
  const [hotPosts, setHotPosts] = useState<PostResponse[]>([]);
  const [topCreators, setTopCreators] = useState<AuthorSummary[]>([]);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    // Individual loaders to prevent one failure from blocking everything
    const safeLoad = async (promise: Promise<any>, setter: (val: any) => void, name: string) => {
      try {
        const val = await promise;
        setter(val);
      } catch (err) {
        console.warn(`Failed to load ${name}, continuing...`);
      }
    };

    safeLoad(getFeed(), setFeed, 'feed');
    safeLoad(getNotifications(), setNotifications, 'notifications');
    safeLoad(getHistory(), setHistory, 'history');
    safeLoad(getHotItineraries(), setHotPosts, 'hotPosts');
    safeLoad(getCreatorRankings(), setTopCreators, 'creators');
    safeLoad(getAnalyticsOverview(), setOverview, 'overview');
    safeLoad(getAnalyticsFunnel(), setFunnel, 'funnel');
    safeLoad(getAnalyticsDestinations(), setDestinations, 'destinations');
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitTask = async (customInput?: string) => {
    const input = customInput || taskInput;
    if (!input) return;
    
    setLoading(true);
    try {
      const task = await createTask({
        userInput: input,
        preferences: { user_id: user.userId },
        promptVersion: 'v2-mcp'
      });
      navigate(`/itinerary/${task.taskId}`);
    } catch (err) {
      alert('提交任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个行程吗？')) return;
    try {
      await deleteItinerary(id);
      // 直接从列表中移除，避免重新加载全部数据
      setHistory(prev => prev.filter(item => item.itineraryId !== id));
    } catch (err: any) {
      // 提取后端返回的具体错误信息
      const message = err.response?.data?.message || '删除失败，请稍后重试';
      alert(message);
      console.error('删除行程失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-orange-900 to-amber-900 text-white p-6 hidden xl:flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <TrendingUp size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">TravelMaster</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-sm font-bold">
            <LayoutDashboard size={18} /> 工作台
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-orange-200 hover:text-white hover:bg-white/5 rounded-xl text-sm font-bold transition-all">
            <Settings size={18} /> 个人设置
          </Link>
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-orange-300 hover:bg-orange-500/10 rounded-xl text-sm font-bold transition-all"
        >
          <LogOut size={18} /> 退出登录
        </button>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-64 min-h-screen pb-12">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">早安, {user.nickname}</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">今天想去哪里探索？AI 已准备好为您规划。</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-slate-100 rounded-full text-slate-600 relative">
              <Bell size={20} />
              {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>
            <Link to="/settings" className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm">
              {user.nickname[0]}
            </Link>
          </div>
        </header>

        <div className="px-8 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8">
            {/* AI Input Card */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-orange-600/5 pointer-events-none">
                <Search size={160} />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">AI 智能行程助手</h2>
                <div className="relative">
                  <textarea 
                    className="w-full min-h-[140px] p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-slate-700 text-lg leading-relaxed placeholder:text-slate-300"
                    placeholder="例如：北京3天文化游，预算中等，想多逛博物馆和古建..."
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                  />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-indigo-100">高德地图优化</span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">盈米金融支持</span>
                  </div>
                  <button 
                    onClick={() => handleSubmitTask()}
                    disabled={loading || !taskInput}
                    className="px-8 py-4 premium-gradient text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-orange-100 hover:shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? '生成中...' : <><Plus size={24} /> 开始智能规划</>}
                  </button>
                </div>
              </div>
            </section>

            {/* My History Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="text-orange-600" size={24} /> 我的历史行程
                </h2>
                {history.length > 0 && <span className="text-xs font-bold text-slate-400">{history.length} 个行程</span>}
              </div>
              
              {history.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <History size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">暂无历史行程，快去创建一个吧！</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.slice(0, 6).map(item => (
                    <motion.div 
                      whileHover={{ y: -4 }}
                      key={item.itineraryId}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-orange-200 transition-all group relative"
                      onClick={() => navigate(`/itinerary/${item.itineraryId}`)}
                    >
                      <button 
                        onClick={(e) => handleDelete(e, item.itineraryId)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="text-xs font-bold text-orange-500 mb-2 uppercase tracking-widest">{item.items?.length || 0} 个地点</div>
                      <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{item.summary}</p>
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">{new Date(item.publishedAt || Date.now()).toLocaleDateString()}</span>
                        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Social Feed */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">灵感发现</h2>
                <Link to="/" className="text-sm font-bold text-orange-600 hover:underline">查看全部</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {feed.map(post => (
                  <motion.article 
                    whileHover={{ y: -4 }}
                    key={post.postId} 
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                        {post.author?.nickname?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{post.author?.nickname || '匿名旅者'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.publishedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">{post.contentExcerpt}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                          <Heart size={18} /> <span className="text-xs font-bold">{post.likeCount}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-orange-500 transition-colors">
                          <Bookmark size={18} /> <span className="text-xs font-bold">{post.favoriteCount}</span>
                        </button>
                      </div>
                      <Link to={`/itinerary/${post.itineraryId}`} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors">
                        <ArrowUpRight size={20} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            <section className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">热门榜单</h3>
              <div className="space-y-4">
                {hotPosts.slice(0, 5).map((p, i) => (
                  <div key={p.postId} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/itinerary/${p.itineraryId}`)}>
                    <span className="text-xl font-black text-slate-800 group-hover:text-orange-500 transition-colors">0{i+1}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate group-hover:text-orange-400 transition-colors cursor-pointer">{p.title}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">{p.likeCount} 喜欢</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">热门目的地</h3>
              <div className="space-y-3">
                {destinations.slice(0, 6).map((d, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => handleSubmitTask(`${d.destination}3天游，推荐一些特色景点`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black group-hover:bg-orange-600 group-hover:text-white transition-all">{i+1}</div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{d.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400">{d.tripCount} 计划</span>
                      <Search size={12} className="text-slate-200 group-hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
