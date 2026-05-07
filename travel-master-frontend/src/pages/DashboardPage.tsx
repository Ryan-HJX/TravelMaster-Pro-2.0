import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, TrendingUp, Users, Bell,
  MessageSquare, Heart, Bookmark, ArrowUpRight,
  LogOut, Settings, LayoutDashboard, History, MapPin, Trash2,
  Wallet, Calendar, Coins
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getFeed, getNotifications, getAnalyticsOverview,
  getHotItineraries, getCreatorRankings, createTask,
  getHistory, likePost, favoritePost, followUser, commentOnPost,
  getAnalyticsFunnel, getAnalyticsDestinations, deleteItinerary,
  type PostResponse, type AuthorSummary, type NotificationResponse, type ItineraryResponse
} from '../services/api';
import ChinaMap from '../components/ChinaMap';
import CityMap, { countVisitedProvinces } from '../components/CityMap';

const DashboardPage: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [taskInput, setTaskInput] = useState('北京3天文化游，预算中等，想多逛博物馆和古建');
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLevel, setBudgetLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [days, setDays] = useState<number>(3);
  const [feed, setFeed] = useState<PostResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [history, setHistory] = useState<ItineraryResponse[]>([]);
  const [hotPosts, setHotPosts] = useState<PostResponse[]>([]);
  const [topCreators, setTopCreators] = useState<AuthorSummary[]>([]);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [commentDialog, setCommentDialog] = useState<{ open: boolean; postId: string | null }>({ open: false, postId: null });
  const [commentText, setCommentText] = useState('');
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>(() => {
    const saved = localStorage.getItem('visitedProvinces');
    return saved ? [...new Set(JSON.parse(saved) as string[])] : [];
  });
  const [showChinaMap, setShowChinaMap] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const handleProvinceToggle = (province: string) => {
    setVisitedProvinces(prev => {
      const newVisited = prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province];
      localStorage.setItem('visitedProvinces', JSON.stringify(newVisited));
      return newVisited;
    });
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  const loadData = useCallback(async () => {
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

  // Date <-> days linkage
  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays >= 1 && diffDays <= 15) {
        setDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && days >= 1) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + days - 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [days, startDate]);

  const handleSubmitTask = async (customInput?: string) => {
    const input = customInput || taskInput;
    if (!input) return;

    setLoading(true);
    try {
      let fullInput = input;
      if (departureCity) {
        fullInput = `从${departureCity}出发，` + fullInput;
      }
      if (startDate && endDate) {
        fullInput += `。旅行时间：从 ${startDate} 到 ${endDate}`;
      } else if (startDate) {
        fullInput += `。开始时间：${startDate}`;
      }

      const task = await createTask({
        userInput: fullInput,
        preferences: {
          user_id: user.userId,
          budget: budgetLevel,
          days: days,
          departure_city: departureCity,
          start_date: startDate,
          end_date: endDate
        },
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
      setHistory(prev => prev.filter(item => item.itineraryId !== id));
    } catch (err: any) {
      const message = err.response?.data?.message || '删除失败，请稍后重试';
      alert(message);
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await likePost(postId);
      setFeed(prev => prev.map(post =>
        post.postId === postId
          ? { ...post, likeCount: post.likeCount + 1, liked: true }
          : post
      ));
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleFavorite = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await favoritePost(postId);
      setFeed(prev => prev.map(post =>
        post.postId === postId
          ? { ...post, favoriteCount: post.favoriteCount + 1, favorited: true }
          : post
      ));
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await commentOnPost(postId, commentText);
      setCommentText('');
      setCommentDialog({ open: false, postId: null });
      alert('评论成功！');
    } catch (err) {
      console.error('评论失败:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 glass border-r flex-col hidden xl:flex overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-5 pt-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>TravelMaster</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 mb-6">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <LayoutDashboard size={18} /> 工作台
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <Settings size={18} /> 个人设置
          </Link>
        </nav>

        {/* Quick Templates */}
        <div className="px-3 mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--text-muted)' }}>快速创建</h3>
          <div className="space-y-0.5">
            {[
              { label: '周末短途游', icon: '🌿', input: '周末短途游，放松身心，预算适中', d: 2, b: 'medium' as const },
              { label: '文化探索之旅', icon: '🏛', input: '文化探索之旅，参观博物馆和历史古迹', d: 3, b: 'medium' as const },
              { label: '美食探索', icon: '🍜', input: '美食之旅，品尝当地特色小吃和餐厅', d: 2, b: 'low' as const },
              { label: '自然风光', icon: '🏔', input: '自然风光之旅，徒步登山看风景', d: 3, b: 'medium' as const },
            ].map(t => (
              <button
                key={t.label}
                onClick={() => { setTaskInput(t.input); setDays(t.d); setBudgetLevel(t.b); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Entry */}
        <div className="px-3 mb-6">
          <button
            onClick={() => setShowChinaMap(true)}
            className="w-full rounded-xl p-3.5 transition-all text-left"
            style={{ background: 'var(--border-light)' }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>我的足迹</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{countVisitedProvinces(visitedProvinces)} 省份已点亮</div>
              </div>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((countVisitedProvinces(visitedProvinces) / 34) * 100, 100)}%`, background: 'var(--primary)' }} />
            </div>
          </button>
        </div>

        <div className="flex-1" />

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={18} /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-60 min-h-screen pb-12">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>早安, {user.nickname}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>今天想去哪里探索？</p>
          </div>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={handleBellClick}
              className="p-2 rounded-full transition-colors relative"
              style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF3B30' }} />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 right-0 w-80 apple-card overflow-hidden z-50"
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>通知</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                      <p className="text-sm">暂无通知</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.notificationId}
                        className="p-4 border-b transition-colors"
                        style={{ borderColor: 'var(--border-light)', background: !notif.read ? 'var(--primary-light)' : 'transparent' }}
                      >
                        <div className="font-medium text-sm" style={{ color: 'var(--text-main)' }}>{notif.title}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{notif.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            <Link
              to="/settings"
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
            >
              {user.nickname[0]}
            </Link>
          </div>
        </header>

        <div className="px-8 py-6 grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            {/* AI Input Card */}
            <section className="apple-card p-6">
              <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-main)' }}>AI 智能行程助手</h2>
              <div>
                <textarea
                  className="w-full min-h-[120px] p-4 rounded-xl outline-none text-sm leading-relaxed resize-none"
                  style={{ background: 'var(--border-light)', color: 'var(--text-main)', border: '1px solid transparent' }}
                  placeholder="例如：北京3天文化游，想多逛博物馆和古建..."
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onFocus={e => { e.target.style.background = 'var(--card-bg)'; e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                  onBlur={e => { e.target.style.background = 'var(--border-light)'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Departure & Date */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={13} style={{ color: 'var(--primary)' }} /> 出发地
                  </label>
                  <input
                    type="text"
                    value={departureCity}
                    onChange={(e) => setDepartureCity(e.target.value)}
                    placeholder="例如：上海"
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--border-light)', border: '1px solid transparent', color: 'var(--text-main)' }}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['北京', '上海', '广州', '深圳', '成都'].map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setDepartureCity(city)}
                        className="text-[10px] px-2 py-0.5 rounded-full transition-all font-medium"
                        style={{
                          background: departureCity === city ? 'var(--primary)' : 'var(--border-light)',
                          color: departureCity === city ? 'white' : 'var(--text-muted)',
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={13} style={{ color: 'var(--primary)' }} /> 开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--border-light)', border: '1px solid transparent', color: 'var(--text-main)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={13} style={{ color: 'var(--primary)' }} /> 结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--border-light)', border: '1px solid transparent', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Budget & Days */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Coins size={13} style={{ color: 'var(--primary)' }} /> 预算级别
                  </label>
                  <div className="flex gap-1.5">
                    {([
                      { key: 'low' as const, label: '经济型' },
                      { key: 'medium' as const, label: '舒适型' },
                      { key: 'high' as const, label: '豪华型' },
                    ]).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setBudgetLevel(opt.key)}
                        className="flex-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: budgetLevel === opt.key ? 'var(--primary)' : 'var(--border-light)',
                          color: budgetLevel === opt.key ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={13} style={{ color: 'var(--primary)' }} /> 旅行天数
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors"
                      style={{ background: 'var(--border-light)', color: 'var(--text-main)' }}
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{days}</span>
                      <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>天</span>
                    </div>
                    <button
                      onClick={() => setDays(Math.min(15, days + 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors"
                      style={{ background: 'var(--border-light)', color: 'var(--text-main)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>高德地图</span>
                  <span className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>盈米金融</span>
                </div>
                <button
                  onClick={() => handleSubmitTask()}
                  disabled={loading || !taskInput}
                  className="px-6 py-3 apple-btn-primary text-sm flex items-center gap-2 disabled:opacity-40"
                >
                  {loading ? '生成中...' : <><Plus size={18} /> 开始规划</>}
                </button>
              </div>
            </section>

            {/* History */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <History size={18} style={{ color: 'var(--primary)' }} /> 历史行程
                </h2>
                {history.length > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{history.length} 个</span>}
              </div>

              {history.length === 0 ? (
                <div className="apple-card p-10 text-center">
                  <p style={{ color: 'var(--text-muted)' }}>暂无历史行程</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.slice(0, 6).map(item => (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={item.itineraryId}
                      className="apple-card p-4 cursor-pointer group relative"
                      onClick={() => navigate(`/itinerary/${item.itineraryId}`)}
                    >
                      <button
                        onClick={(e) => handleDelete(e, item.itineraryId)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--primary)' }}>{item.items?.length || 0} 个地点</div>
                      <h3 className="font-bold text-sm line-clamp-1" style={{ color: 'var(--text-main)' }}>{item.title}</h3>
                      <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.summary}</p>
                      <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(item.publishedAt || Date.now()).toLocaleDateString()}</span>
                        <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Social Feed */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>灵感发现</h2>
                <Link to="/" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>查看全部</Link>
              </div>

              {feed.length === 0 ? (
                <div className="apple-card p-10 text-center">
                  <p style={{ color: 'var(--text-muted)' }}>暂无灵感分享</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {feed.map(post => (
                    <motion.article
                      whileHover={{ y: -2 }}
                      key={post.postId}
                      className="apple-card p-5 cursor-pointer group"
                      onClick={() => navigate(`/itinerary/${post.itineraryId}`)}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {post.author?.nickname?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>{post.author?.nickname ?? "匿名旅者"}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(post.publishedAt).toLocaleDateString("zh-CN")}</div>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold line-clamp-1 mb-1.5" style={{ color: 'var(--text-main)' }}>{post.title}</h3>
                      <p className="text-xs line-clamp-2 leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{post.contentExcerpt}</p>

                      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => handleLike(e, post.postId)}
                            className="flex items-center gap-1 transition-colors"
                            style={{ color: post.liked ? '#FF3B30' : 'var(--text-muted)' }}
                          >
                            <Heart size={15} className={post.liked ? 'fill-current' : ''} />
                            <span className="text-[11px] font-medium">{post.likeCount}</span>
                          </button>
                          <button
                            onClick={(e) => handleFavorite(e, post.postId)}
                            className="flex items-center gap-1 transition-colors"
                            style={{ color: post.favorited ? '#FF9500' : 'var(--text-muted)' }}
                          >
                            <Bookmark size={15} className={post.favorited ? 'fill-current' : ''} />
                            <span className="text-[11px] font-medium">{post.favoriteCount}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCommentDialog({ open: true, postId: post.postId }); }}
                            className="flex items-center gap-1 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <MessageSquare size={15} />
                            <span className="text-[11px] font-medium">{post.commentCount}</span>
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-4">
            {/* Hot Posts */}
            <section className="apple-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>热门榜单</h3>
              <div className="space-y-3">
                {hotPosts.slice(0, 5).map((p, i) => (
                  <div key={p.postId} className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/itinerary/${p.itineraryId}`)}>
                    <span className="text-sm font-bold w-5" style={{ color: i < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>0{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text-main)' }}>{p.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>❤️ {p.likeCount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Destinations */}
            <section className="apple-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>热门目的地</h3>
              <div className="space-y-2">
                {destinations.slice(0, 6).map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer"
                    style={{ color: 'var(--text-main)' }}
                    onClick={() => handleSubmitTask(`${d.destination}3天游，推荐一些特色景点`)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold w-5" style={{ color: 'var(--primary)' }}>{i + 1}</span>
                      <span className="text-xs font-medium">{d.destination}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.tripCount} 计划</span>
                  </div>
                ))}
              </div>
            </section>

            {/* City Map */}
            <section className="apple-card overflow-hidden">
              <CityMap visitedCities={visitedProvinces} onCityToggle={handleProvinceToggle} />
            </section>
          </aside>
        </div>
      </main>

      {/* China Map Modal */}
      {showChinaMap && (
        <ChinaMap visitedCities={visitedProvinces} onCityToggle={handleProvinceToggle} onClose={() => setShowChinaMap(false)} />
      )}

      {/* Comment Dialog */}
      {commentDialog.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="apple-card max-w-md w-full p-6"
          >
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-main)' }}>发表评论</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="分享你的想法..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none mb-4"
              style={{ background: 'var(--border-light)', border: '1px solid transparent', color: 'var(--text-main)' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setCommentDialog({ open: false, postId: null }); setCommentText(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={() => commentDialog.postId && handleComment(commentDialog.postId)}
                disabled={!commentText.trim()}
                className="flex-1 px-4 py-2.5 apple-btn-primary text-sm disabled:opacity-40"
              >
                发表
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
