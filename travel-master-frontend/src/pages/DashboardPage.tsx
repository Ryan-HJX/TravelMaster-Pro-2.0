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
  const [departureCity, setDepartureCity] = useState(''); // 新增：出发地
  const [startDate, setStartDate] = useState(''); // 新增：开始日期
  const [endDate, setEndDate] = useState(''); // 新增：结束日期
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
  
  // 获取今天的日期字符串 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  
  // 处理省份切换 - 保存到 localStorage
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

  // 根据开始和结束日期自动计算旅行天数
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // 计算两个日期之间的天数差（包含首尾两天）
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // 确保天数在合理范围内（1-15天）
      if (diffDays >= 1 && diffDays <= 15) {
        setDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  const handleSubmitTask = async (customInput?: string) => {
    const input = customInput || taskInput;
    if (!input) return;
    
    setLoading(true);
    try {
      // 构建完整的用户输入，包含出发地和日期信息
      let fullInput = input;
      
      // 添加出发地信息
      if (departureCity) {
        fullInput = `从${departureCity}出发，` + fullInput;
      }
      
      // 添加具体日期范围
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
          departure_city: departureCity, // 传递出发地
          start_date: startDate, // 传递开始日期
          end_date: endDate // 传递结束日期
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
      // 直接从列表中移除，避免重新加载全部数据
      setHistory(prev => prev.filter(item => item.itineraryId !== id));
    } catch (err: any) {
      // 提取后端返回的具体错误信息
      const message = err.response?.data?.message || '删除失败，请稍后重试';
      alert(message);
      console.error('删除行程失败:', err);
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await likePost(postId);
      // 乐观更新UI
      setFeed(prev => prev.map(post => 
        post.postId === postId 
          ? { ...post, likeCount: post.likeCount + 1, liked: true }
          : post
      ));
    } catch (err) {
      console.error('点赞失败:', err);
      alert('操作失败，请稍后重试');
    }
  };

  const handleFavorite = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await favoritePost(postId);
      // 乐观更新UI
      setFeed(prev => prev.map(post => 
        post.postId === postId 
          ? { ...post, favoriteCount: post.favoriteCount + 1, favorited: true }
          : post
      ));
    } catch (err) {
      console.error('收藏失败:', err);
      alert('操作失败，请稍后重试');
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await commentOnPost(postId, commentText);
      setCommentText('');
      setCommentDialog({ open: false, postId: null });
      // Show success notification
      alert('评论成功！');
    } catch (err) {
      console.error('评论失败:', err);
      alert('评论失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-orange-500 to-amber-500 text-white p-6 hidden xl:flex flex-col shadow-xl overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
            <TrendingUp size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">TravelMaster</span>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2 mb-6">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold shadow-sm">
            <LayoutDashboard size={18} /> 工作台
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl text-sm font-bold transition-all">
            <Settings size={18} /> 个人设置
          </Link>
        </nav>

        {/* Quick Templates Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3 px-2">⚡ 快速创建</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setTaskInput('周末短途游，放松身心，预算适中');
                setDays(2);
                setBudgetLevel('medium');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-left"
            >
              <Calendar size={16} /> 周末短途游
            </button>
            <button
              onClick={() => {
                setTaskInput('文化探索之旅，参观博物馆和历史古迹');
                setDays(3);
                setBudgetLevel('medium');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-left"
            >
              <History size={16} /> 文化探索之旅
            </button>
            <button
              onClick={() => {
                setTaskInput('美食之旅，品尝当地特色小吃和餐厅');
                setDays(2);
                setBudgetLevel('low');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-left"
            >
              🍜 美食探索
            </button>
            <button
              onClick={() => {
                setTaskInput('自然风光之旅，徒步登山看风景');
                setDays(3);
                setBudgetLevel('medium');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-left"
            >
              🏔️ 自然风光
            </button>
          </div>
        </div>

        {/* China Map Entry Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowChinaMap(true)}
            className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white shadow-lg">
                <MapPin size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">我的足迹地图</div>
                <div className="text-[10px] text-white/70">{countVisitedProvinces(visitedProvinces)} 个省份已点亮</div>
              </div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min((countVisitedProvinces(visitedProvinces) / 34) * 100, 100)}%` }}
              />
            </div>
          </button>
        </div>

        {/* Recent Favorites Section */}
        {feed.filter(f => f.favorited).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3 px-2">⭐ 我的收藏</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {feed.filter(f => f.favorited).slice(0, 3).map(post => (
                <div
                  key={post.postId}
                  onClick={() => navigate(`/itinerary/${post.itineraryId}`)}
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-3 cursor-pointer transition-all group"
                >
                  <div className="text-xs font-bold line-clamp-2 group-hover:text-white/90">{post.title}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-white/60">
                    <Heart size={10} className="fill-current text-rose-400" />
                    <span>{post.likeCount}</span>
                    <Bookmark size={10} className="fill-current text-orange-400" />
                    <span>{post.favoriteCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Travel Tips Section */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3">💡 旅行小贴士</h3>
          <div className="space-y-2 text-xs text-white/90">
            <div className="flex items-start gap-2">
              <span className="text-amber-300">🎒</span>
              <span>春季出行记得携带雨具和薄外套</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-300">📱</span>
              <span>提前下载离线地图，避免网络问题</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-300">💰</span>
              <span>准备少量现金，部分小店不支持移动支付</span>
            </div>
          </div>
        </div>

        {/* Spacer to push logout to bottom */}
        <div className="flex-1" />

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 rounded-xl text-sm font-bold transition-all mt-4"
        >
          <LogOut size={18} /> 退出登录
        </button>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-72 min-h-screen pb-12">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">早安, {user.nickname}</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">今天想去哪里探索？AI 已准备好为您规划。</p>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={handleBellClick}
              className="p-2.5 bg-orange-100 hover:bg-orange-200 rounded-full text-orange-600 relative transition-colors"
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-14 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden z-50"
              >
                <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  <h3 className="font-bold text-lg">通知中心</h3>
                  <p className="text-xs text-white/80 mt-1">您有 {notifications.filter(n => !n.read).length} 条未读通知</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={48} className="mx-auto mb-3 opacity-30" />
                      <p>暂无通知</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.notificationId}
                        className={`p-4 border-b border-orange-50 hover:bg-orange-50 transition-colors ${!notif.read ? 'bg-orange-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-orange-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{notif.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{notif.content}</div>
                            <div className="text-[10px] text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString('zh-CN')}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            
            <Link to="/settings" className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm hover:bg-orange-200 transition-colors">
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
                    placeholder="例如：北京3天文化游，想多逛博物馆和古建..."
                    value={taskInput}
                    onChange={e => setTaskInput(e.target.value)}
                  />
                </div>
                
                {/* 新增：出发地与日期范围选择 */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {/* 出发地选择 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <MapPin size={16} className="text-orange-600" /> 出发地
                    </label>
                    <input
                      type="text"
                      value={departureCity}
                      onChange={(e) => setDepartureCity(e.target.value)}
                      placeholder="例如：上海"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                    />
                    {/* 常用城市快捷选择 */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['北京', '上海', '广州', '深圳', '成都'].map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setDepartureCity(city)}
                          className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                            departureCity === city
                              ? 'bg-orange-500 text-white'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 开始日期 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} className="text-orange-600" /> 开始日期
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        // 如果结束日期早于新的开始日期，清空结束日期
                        if (endDate && e.target.value > endDate) {
                          setEndDate('');
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                    />
                  </div>

                  {/* 结束日期 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} className="text-orange-600" /> 结束日期
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
                
                {/* Budget & Days Selector */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Budget Level */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Coins size={16} className="text-orange-600" /> 预算级别
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBudgetLevel('low')}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          budgetLevel === 'low'
                            ? 'bg-green-500 text-white shadow-md shadow-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        经济型
                      </button>
                      <button
                        onClick={() => setBudgetLevel('medium')}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          budgetLevel === 'medium'
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        舒适型
                      </button>
                      <button
                        onClick={() => setBudgetLevel('high')}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          budgetLevel === 'high'
                            ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        豪华型
                      </button>
                    </div>
                  </div>

                  {/* Days Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} className="text-orange-600" /> 旅行天数
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDays(Math.max(1, days - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-all"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-black text-orange-600">{days}</span>
                        <span className="text-sm text-slate-500 ml-1">天</span>
                      </div>
                      <button
                        onClick={() => setDays(Math.min(15, days + 1))}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Yingmi Finance Feature Card */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                      <Wallet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 mb-1">💰 智能资金规划助手</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        基于<b>盈米金融 MCP</b>，为您提供旅行预算分析、基金流动性管理、现金预留建议及旅行保险推荐。
                        让每一分钱都花在刀刃上！
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white/80 text-orange-700 rounded-lg text-[10px] font-bold border border-orange-200">📊 预算分解</span>
                        <span className="px-2 py-1 bg-white/80 text-orange-700 rounded-lg text-[10px] font-bold border border-orange-200">💳 基金推荐</span>
                        <span className="px-2 py-1 bg-white/80 text-orange-700 rounded-lg text-[10px] font-bold border border-orange-200">🛡️ 保险建议</span>
                        <span className="px-2 py-1 bg-white/80 text-orange-700 rounded-lg text-[10px] font-bold border border-orange-200">📝 消费追踪</span>
                      </div>
                    </div>
                  </div>
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
              <div className="flex items-center justify-between group relative">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">💡 灵感发现</h2>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-orange-100 p-4 z-10">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      这里展示其他用户分享的精彩行程，为您提供旅行灵感和参考。点击卡片可以查看完整行程详情！
                    </p>
                  </div>
                </div>
                <Link to="/" className="text-sm font-bold text-orange-600 hover:underline">查看全部</Link>
              </div>
              
              {feed.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">暂无灵感分享内容</p>
                  <p className="text-xs text-slate-300 mt-2">发布您的第一个行程，成为创作者吧！</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {feed.map(post => (
                    <motion.article 
                      whileHover={{ y: -4, scale: 1.02 }}
                      key={post.postId} 
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group"
                      onClick={() => navigate(`/itinerary/${post.itineraryId}`)}
                    >
                      {/* Author Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
                          {post.author?.nickname?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{post.author?.nickname || '匿名旅者'}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">{post.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">{post.contentExcerpt}</p>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex gap-3">
                          <button 
                            onClick={(e) => handleLike(e, post.postId)}
                            className={`flex items-center gap-1.5 transition-all active:scale-90 ${post.liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                          >
                            <motion.div
                              whileTap={{ scale: 1.3 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Heart size={18} className={post.liked ? 'fill-current' : ''} />
                            </motion.div>
                            <span className="text-xs font-bold">{post.likeCount}</span>
                          </button>
                          <button 
                            onClick={(e) => handleFavorite(e, post.postId)}
                            className={`flex items-center gap-1.5 transition-all active:scale-90 ${post.favorited ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}
                          >
                            <motion.div
                              whileTap={{ scale: 1.3 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Bookmark size={18} className={post.favorited ? 'fill-current' : ''} />
                            </motion.div>
                            <span className="text-xs font-bold">{post.favoriteCount}</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommentDialog({ open: true, postId: post.postId });
                            }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <MessageSquare size={18} />
                            <span className="text-xs font-bold">{post.commentCount}</span>
                          </button>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                          <ArrowUpRight size={20} />
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            <section className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[2rem] p-6 text-white overflow-hidden relative shadow-lg shadow-orange-200">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/90 mb-6 relative z-10">🔥 热门榜单</h3>
              <div className="space-y-4 relative z-10">
                {hotPosts.slice(0, 5).map((p, i) => (
                  <div key={p.postId} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/itinerary/${p.itineraryId}`)}>
                    <span className={`text-xl font-black transition-colors ${i < 3 ? 'text-white' : 'text-white/60'}`}>0{i+1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate group-hover:text-white/90 transition-colors cursor-pointer">{p.title}</div>
                      <div className="text-[10px] text-white/70 font-bold mt-0.5">❤️ {p.likeCount} 喜欢</div>
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

            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <CityMap 
                visitedCities={visitedProvinces} 
                onCityToggle={handleProvinceToggle} 
              />
            </section>
          </aside>
        </div>
      </main>

      {/* China Map Modal */}
      {showChinaMap && (
        <ChinaMap
          visitedCities={visitedProvinces}
          onCityToggle={handleProvinceToggle}
          onClose={() => setShowChinaMap(false)}
        />
      )}

      {/* Comment Dialog */}
      {commentDialog.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">发表评论</h3>
              <button 
                onClick={() => setCommentDialog({ open: false, postId: null })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="分享你的想法..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none mb-4"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCommentDialog({ open: false, postId: null });
                  setCommentText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => commentDialog.postId && handleComment(commentDialog.postId)}
                disabled={!commentText.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发表评论
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
