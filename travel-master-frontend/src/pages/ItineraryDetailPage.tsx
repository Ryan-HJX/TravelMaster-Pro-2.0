import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Map as MapIcon, Route, Wallet, Cloud, 
  Share2, Download, Star, MapPin, Calendar, Clock, CheckCircle2, Loader2, Send
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTask, getItinerary, publishItinerary, unpublishItinerary, type TaskResponse, type ItineraryResponse, type ProgressStep } from '../services/api';
import ItineraryMapView from '../components/ItineraryMapView';
import RouteAlternatives from '../components/RouteAlternatives';
import TravelBudgetAdvisor from '../components/TravelBudgetAdvisor';

// ── AMAP CONFIGURATION ────────────────────────────────────────
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;

if (typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  };
}
// ─────────────────────────────────────────────────────────────

const ItineraryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [taskProgress, setTaskProgress] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'finance'>('map');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishCaption, setPublishCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  
  const navigate = useNavigate();

  // Check if itinerary is published
  const isPublished = !!itinerary?.publishedAt;

  // Handle publish to inspiration feed
  const handlePublish = async () => {
    if (!id || !itinerary) return;
    
    setPublishing(true);
    try {
      await publishItinerary(id, {
        title: publishTitle || itinerary.title,
        caption: publishCaption
      });
      alert('发布成功！即将跳转到首页查看您的分享');
      setShowPublishDialog(false);
      setPublishTitle('');
      setPublishCaption('');
      // 跳转到首页，让用户看到新发布的行程
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      console.error('Publish failed:', err);
      alert('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  };

  // Handle unpublish from inspiration feed
  const handleUnpublish = async () => {
    if (!id || !itinerary || !isPublished) return;
    
    if (!window.confirm('确定要从灵感发现中撤回吗？撤回后其他用户将无法看到此行程。')) {
      return;
    }
    
    setUnpublishing(true);
    try {
      await unpublishItinerary(id);
      alert('已撤回发布！行程仍保留在您的历史记录中。');
      // Reload the page to update the UI
      window.location.reload();
    } catch (err) {
      console.error('Unpublish failed:', err);
      alert('撤回失败，请稍后重试');
    } finally {
      setUnpublishing(false);
    }
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    if (!itinerary) return;
    
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${itinerary.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #ea580c; border-bottom: 3px solid #fed7aa; padding-bottom: 10px; }
          h2 { color: #c2410c; margin-top: 30px; }
          .summary { background: #fff7ed; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>${itinerary.title}</h1>
        <div class="meta">生成时间: ${new Date().toLocaleDateString('zh-CN')}</div>
        <div class="summary">
          <h2>行程概览</h2>
          <p>${itinerary.summary}</p>
        </div>
        <h2>详细行程</h2>
        <div>${itinerary.renderedMarkdown.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Handle share
  const handleShare = async () => {
    if (!itinerary) return;

    const shareData = {
      title: itinerary.title,
      text: itinerary.summary,
      url: window.location.href
    };

    // Try Web Share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Web Share API failed:', err);
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('行程链接已复制到剪贴板！');
    } catch (err) {
      // Final fallback: show URL
      prompt('复制以下链接分享行程：', window.location.href);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    let pollDelay = 5000; // 初始5秒轮询间隔
    const MAX_DELAY = 30000; // 最大30秒间隔
    
    const fetchData = async () => {
      try {
        // Try as task first (for new generations)
        try {
          const task = await getTask(id);
          if (task.status === 'COMPLETED' && task.itinerary) {
            setItinerary(task.itinerary);
            setLoading(false);
          } else if (task.status === 'FAILED') {
            setTaskStatus('FAILED');
            setLoading(false);
          } else {
            setTaskStatus(task.status);
            // Update progress if available
            if (task.progress) {
              setTaskProgress(task.progress);
            }
            // 指数退避：每次轮询间隔增加50%，最大30秒
            setTimeout(fetchData, pollDelay);
            pollDelay = Math.min(Math.floor(pollDelay * 1.5), MAX_DELAY);
          }
        } catch (err) {
          // If task not found, try as direct itinerary (for history)
          const data = await getItinerary(id);
          setItinerary(data);
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        setTaskStatus('NOT_FOUND');
      }
    };

    fetchData();
  }, [id]);

  if (loading && !itinerary) {
    const completedSteps = taskProgress?.steps.filter((s: ProgressStep) => s.status === 'completed').length ?? 0;
    const totalSteps = taskProgress?.steps.length ?? 8;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-3xl premium-gradient flex items-center justify-center text-white shadow-xl shadow-orange-300/50 mb-8"
        >
          <MapIcon size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在处理您的请求</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          {taskProgress?.currentStep ? (
            <span className="text-orange-600 font-medium">{taskProgress.currentStep}</span>
          ) : (
            '正在从历史库中调取或调用高德/盈米进行实时分析...'
          )}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md h-3 bg-orange-200 rounded-full overflow-hidden mb-6">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${taskProgress?.overallProgress || 0}%` }}
            transition={{ duration: 0.5 }}
            className="h-full premium-gradient"
          />
        </div>
        
        {/* Steps List */}
        <div className="w-full max-w-lg space-y-2 mb-6">
          {taskProgress?.steps.map((step: ProgressStep, index: number) => (
            <motion.div
              key={step.stepId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                step.status === 'processing' 
                  ? 'bg-orange-50 border-orange-300 shadow-sm' 
                  : step.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200 opacity-60'
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : step.status === 'processing' ? (
                  <Loader2 className="text-orange-600 animate-spin" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  step.status === 'processing' ? 'text-orange-700' : 'text-gray-700'
                }`}>
                  {step.stepName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {step.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-4 text-xs font-mono text-gray-500 uppercase tracking-widest">
          STATUS: {taskStatus || 'FETCHING'} · PROGRESS: {completedSteps}/{totalSteps}
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <h2 className="text-2xl font-bold text-orange-700 mb-4">内容加载失败</h2>
        <p className="text-gray-600 mb-8">找不到指定的行程或任务已失效</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all">返回首页</button>
      </div>
    );
  }

  // Parse structured content for MCP components
  const structured = JSON.parse(itinerary.structuredContent || '{}');
  
  // Use financeSummary from API if not in structured content
  if (!structured.finance_summary && itinerary.financeSummary) {
    try {
      structured.finance_summary = JSON.parse(itinerary.financeSummary);
    } catch (e) {
      console.warn('Failed to parse financeSummary:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 to-amber-50/50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-orange-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-orange-100 rounded-xl transition-colors text-orange-700">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{itinerary.title}</h1>
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <Calendar size={12} className="text-orange-500" /> {structured.days?.length || 0} 天行程 · <Star size={12} className="text-amber-500" /> {structured.planning_score?.score || 95} 分
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPublished ? (
              <button 
                onClick={handleUnpublish}
                disabled={unpublishing}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {unpublishing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> 撤回中...
                  </>
                ) : (
                  <>撤回发布</>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setShowPublishDialog(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <Send size={16} /> 发布到灵感发现
              </button>
            )}
            <button 
              onClick={handleShare}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-xl text-sm font-medium hover:bg-orange-50 text-orange-700 transition-all"
            >
              <Share2 size={16} /> 分享
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-orange-200 transition-all"
            >
              <Download size={16} /> 导出 PDF
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <section className="p-8 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
              <MapPin className="text-orange-600" size={24} /> 行程概览
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">{itinerary.summary}</p>
          </section>

          <section className="space-y-4">
            <div className="flex p-1 bg-orange-100/50 rounded-2xl w-fit border border-orange-200">
              <button 
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                <MapIcon size={18} /> 地图路线
              </button>
              <button 
                onClick={() => setActiveTab('route')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'route' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                <Route size={18} /> 交通比选
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'finance' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                <Wallet size={18} /> 资金建议
              </button>
            </div>

            <div className="min-h-[500px] rounded-3xl overflow-hidden border border-orange-200 bg-gradient-to-br from-white to-orange-50/30 relative shadow-sm">
              <AnimatePresence mode="wait">
                {activeTab === 'map' && (
                  <motion.div 
                    key="map"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-[500px]"
                  >
                    <ItineraryMapView 
                      pois={structured.enriched_pois || []} 
                      days={structured.days || []}
                      planningScore={structured.planning_score || { level: 'normal', reasoning: 'AI 建议行程' }}
                      amapKey={AMAP_KEY} 
                    />
                  </motion.div>
                )}
                {activeTab === 'route' && (
                  <motion.div 
                    key="route"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <RouteAlternatives routeOptions={structured.route_options || []} />
                  </motion.div>
                )}
                {activeTab === 'finance' && (
                  <motion.div 
                    key="finance"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="p-6"
                  >
                    <TravelBudgetAdvisor financeSummary={structured.finance_summary} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="prose prose-slate max-w-none 
            prose-headings:font-bold 
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:border-b prose-h2:border-orange-200 prose-h2:pb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:leading-8 prose-p:my-4 prose-p:text-gray-700
            prose-li:leading-7 prose-li:my-2
            prose-strong:text-orange-700 prose-strong:font-semibold
            prose-blockquote:border-l-orange-500 prose-blockquote:bg-orange-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-code:bg-orange-100 prose-code:text-orange-800 prose-code:px-2 prose-code:py-1 prose-code:rounded-md
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-table:border-collapse prose-th:bg-orange-100 prose-th:border prose-th:border-orange-200 prose-th:p-3
            prose-td:border prose-td:border-orange-100 prose-td:p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {itinerary.renderedMarkdown}
            </ReactMarkdown>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="p-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/30 sticky top-28 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-orange-800">关键信息</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Cloud size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">天气概况</div>
                  <p className="text-xs text-gray-600 mt-1">{structured.weather_summary || '天气状况良好，适宜出行'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">强度评分</div>
                  <div className="mt-2 flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <div key={s} className={`h-1.5 w-6 rounded-full ${s <= (structured.planning_score?.intensity || 3) ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gray-200'}`} />
                    ))}
                    <span className="text-[10px] font-bold text-gray-500 ml-2 uppercase">
                      {structured.planning_score?.level || 'NORMAL'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-orange-100">
                <div className="text-sm font-bold mb-3 text-orange-800">经由 POI ({structured.enriched_pois?.length || 0})</div>
                <div className="space-y-2">
                  {structured.enriched_pois?.slice(0, 5).map((poi: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <MapPin size={12} className="text-orange-500" />
                      <span className="truncate">{poi.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">发布到灵感发现</h2>
            <p className="text-sm text-gray-600 mb-6">分享您的行程，为其他旅行者提供灵感</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder={itinerary.title}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">留空则使用行程标题</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  简介
                </label>
                <textarea
                  value={publishCaption}
                  onChange={(e) => setPublishCaption(e.target.value)}
                  placeholder="分享您的旅行心得、特别推荐或注意事项..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">留空则使用行程概览</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowPublishDialog(false);
                  setPublishTitle('');
                  setPublishCaption('');
                }}
                disabled={publishing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> 发布中...
                  </>
                ) : (
                  <>
                    <Send size={18} /> 发布
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDetailPage;
