import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Map as MapIcon, Route, Wallet, Cloud,
  Share2, Download, Star, MapPin, Calendar, Clock, CheckCircle2, Loader2, Send, List,
  Hotel, Banknote, Bookmark
} from 'lucide-react';
import { getTask, getItinerary, publishItinerary, unpublishItinerary, type TaskResponse, type ItineraryResponse, type ProgressStep } from '../services/api';
import ItineraryMapView from '../components/ItineraryMapView';
import DayCard from '../components/DayCard';
import BudgetOverviewCard from '../components/BudgetOverviewCard';
import TransportPlanCard from '../components/TransportPlanCard';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;

const DEFAULT_STEPS: ProgressStep[] = [
  { stepId: 'intent_parser', stepName: '意图解析', description: '正在深度解析您的旅行意图...', status: 'pending' },
  { stepId: 'geo_grounding', stepName: '地理校准', description: '正在通过高德地图进行地理位置校准...', status: 'pending' },
  { stepId: 'poi_selector', stepName: '景点筛选', description: '正在筛选目的地附近的精品景点和餐厅...', status: 'pending' },
  { stepId: 'route_optimizer', stepName: '路线规划', description: '正在为您规划最合理的交通路线...', status: 'pending' },
  { stepId: 'weather_adjuster', stepName: '天气调整', description: '正在结合目的地天气情况调整行程...', status: 'pending' },
  { stepId: 'scoring', stepName: '质量评估', description: '正在对行程质量进行多维度评估打分...', status: 'pending' },
  { stepId: 'finance_advisor', stepName: '资金建议', description: '正在结合盈米金融能力为您生成资金建议...', status: 'pending' },
  { stepId: 'transport_planner', stepName: '大交通规划', description: '正在为您规划往返大交通方案...', status: 'pending' },
  { stepId: 'renderer', stepName: '行程渲染', description: '正在为您绘制精美的旅行地图与文档...', status: 'pending' },
];

if (typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  };
}

const ItineraryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [taskProgress, setTaskProgress] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(1);

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishCaption, setPublishCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  const navigate = useNavigate();

  const isPublished = !!itinerary?.publishedAt;

  const handlePublish = async () => {
    if (!itinerary?.itineraryId) return;
    setPublishing(true);
    try {
      await publishItinerary(itinerary.itineraryId, {
        title: publishTitle || itinerary.title,
        caption: publishCaption
      });
      alert('发布成功！');
      setShowPublishDialog(false);
      setPublishTitle('');
      setPublishCaption('');
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      console.error('Publish failed:', err);
      alert('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!itinerary?.itineraryId || !isPublished) return;
    if (!window.confirm('确定要从灵感发现中撤回吗？')) return;
    setUnpublishing(true);
    try {
      await unpublishItinerary(itinerary.itineraryId);
      alert('已撤回发布！');
      window.location.reload();
    } catch (err) {
      console.error('Unpublish failed:', err);
      alert('撤回失败，请稍后重试');
    } finally {
      setUnpublishing(false);
    }
  };

  const handleExportPDF = () => {
    if (!itinerary) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF');
      return;
    }
    const content = `
      <!DOCTYPE html>
      <html>
      <head><title>${itinerary.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1D1D1F; border-bottom: 1px solid #E5E5EA; padding-bottom: 10px; }
        h2 { color: #1D1D1F; margin-top: 30px; }
        .summary { background: #F5F5F7; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .meta { color: #86868B; font-size: 14px; margin-bottom: 20px; }
      </style></head>
      <body>
        <h1>${itinerary.title}</h1>
        <div class="meta">生成时间: ${new Date().toLocaleDateString('zh-CN')}</div>
        <div class="summary"><h2>行程概览</h2><p>${itinerary.summary}</p></div>
        <h2>详细行程</h2>
        <div>${itinerary.renderedMarkdown.replace(/\n/g, '<br>')}</div>
      </body></html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleShare = async () => {
    if (!itinerary) return;
    const shareData = { title: itinerary.title, text: itinerary.summary, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('行程链接已复制到剪贴板！');
    } catch {
      prompt('复制以下链接分享行程：', window.location.href);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    // SSE stream for real-time progress from Python worker
    const aiBase = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000';
    try {
      eventSource = new EventSource(`${aiBase}/api/v1/tasks/${id}/progress/stream`);
      eventSource.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'completed' || data.overallProgress >= 100) {
            // Progress done — poll Java backend for final result
            eventSource?.close();
            pollForResult();
          } else if (data.status !== 'not_found' && data.steps) {
            setTaskProgress(data);
          }
        } catch { /* ignore parse errors */ }
      };
      eventSource.onerror = () => {
        // SSE failed — fall back to polling
        eventSource?.close();
        if (!cancelled) pollForResult();
      };
    } catch {
      // EventSource not supported or URL error — fall back to polling
      pollForResult();
    }

    // Also do an initial task check (in case it's already completed)
    const checkInitial = async () => {
      try {
        const task = await getTask(id);
        if (cancelled) return;
        if (task.status === 'COMPLETED' && task.itinerary) {
          setItinerary(task.itinerary);
          setLoading(false);
          eventSource?.close();
        } else if (task.status === 'FAILED') {
          setTaskStatus('FAILED');
          setLoading(false);
          eventSource?.close();
        }
      } catch {
        // Task might not exist in Java yet — try direct itinerary fetch
        try {
          const data = await getItinerary(id);
          if (!cancelled) {
            setItinerary(data);
            setLoading(false);
            eventSource?.close();
          }
        } catch { /* not found yet */ }
      }
    };
    checkInitial();

    function pollForResult() {
      if (cancelled) return;
      let delay = 3000;
      const maxDelay = 10000;
      const doPoll = async () => {
        if (cancelled) return;
        try {
          const task = await getTask(id);
          if (cancelled) return;
          if (task.status === 'COMPLETED' && task.itinerary) {
            setItinerary(task.itinerary);
            setLoading(false);
          } else if (task.status === 'FAILED') {
            setTaskStatus('FAILED');
            setLoading(false);
          } else {
            if (task.progress) setTaskProgress(task.progress);
            delay = Math.min(Math.floor(delay * 1.3), maxDelay);
            pollTimer = setTimeout(doPoll, delay);
          }
        } catch {
          try {
            const data = await getItinerary(id);
            if (!cancelled) { setItinerary(data); setLoading(false); }
          } catch {
            if (!cancelled) { setLoading(false); setTaskStatus('NOT_FOUND'); }
          }
        }
      };
      doPoll();
    }

    return () => {
      cancelled = true;
      eventSource?.close();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [id]);

  // Loading State
  if (loading && !itinerary) {
    const steps = taskProgress?.steps?.length ? taskProgress.steps : DEFAULT_STEPS;
    const completedSteps = steps.filter((s: ProgressStep) => s.status === 'completed').length;
    const totalSteps = steps.length;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg-main)' }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'var(--primary)' }}
        >
          <MapIcon size={32} color="white" />
        </motion.div>
        <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-main)' }}>AI 正在处理您的请求</h2>
        <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
          {taskProgress?.currentStep ? (
            <span style={{ color: 'var(--primary)' }}>{taskProgress.currentStep}</span>
          ) : (
            '正在分析您的需求...'
          )}
        </p>

        <div className="w-full max-w-sm h-1 rounded-full overflow-hidden mb-5" style={{ background: 'var(--border-color)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${taskProgress?.overallProgress || 0}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: 'var(--primary)' }}
          />
        </div>

        <div className="w-full max-w-md space-y-1.5 mb-5">
          {steps.map((step: ProgressStep, index: number) => (
            <motion.div
              key={step.stepId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: step.status === 'processing' ? 'var(--primary-light)' : step.status === 'completed' ? 'var(--border-light)' : 'transparent',
                opacity: step.status === 'pending' ? 0.5 : 1,
              }}
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' ? <CheckCircle2 size={18} style={{ color: '#34C759' }} /> :
                 step.status === 'processing' ? <Loader2 size={18} style={{ color: 'var(--primary)' }} className="animate-spin" /> :
                 <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid var(--border-color)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: step.status === 'processing' ? 'var(--primary)' : 'var(--text-main)' }}>
                  {step.stepName}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{step.description}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {completedSteps}/{totalSteps}
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-main)' }}>内容加载失败</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>找不到指定的行程</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 apple-btn-primary text-sm">返回首页</button>
      </div>
    );
  }

  // Parse structured data
  const structured = JSON.parse(itinerary.structuredContent || '{}');

  if (!structured.finance_summary && itinerary.financeSummary) {
    try { structured.finance_summary = JSON.parse(itinerary.financeSummary); } catch {}
  }

  const days = structured.days || [];
  const enrichedPois = structured.enriched_pois || [];
  const hotels = days.filter((d: any) => d.hotel).map((d: any) => ({ ...d.hotel, day_number: d.day_number }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b px-6 py-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>{itinerary.title}</h1>
              <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={11} /> {days.length} 天 ·
                <Star size={11} /> {structured.planning_score?.score || 95} 分
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <button onClick={handleUnpublish} disabled={unpublishing}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                {unpublishing ? <><Loader2 size={14} className="animate-spin" /> 撤回中...</> : '撤回发布'}
              </button>
            ) : (
              <button onClick={() => setShowPublishDialog(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{ background: '#FF3B30', color: 'white' }}>
                <Send size={14} /> 发布
              </button>
            )}
            <button onClick={handleShare}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
              <Share2 size={14} /> 分享
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 apple-btn-primary text-xs">
              <Download size={14} /> 导出
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-20 pb-12 max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 min-w-0 space-y-4">
            <BudgetOverviewCard
              days={days.length}
              title={itinerary.title}
              summary={itinerary.summary}
              planningScore={structured.planning_score}
              financeSummary={structured.finance_summary}
            />

            {structured.transport_plan && (
              <TransportPlanCard transportPlan={structured.transport_plan} />
            )}

            {/* Route alternatives */}
            {structured.route_options?.length > 0 && (
              <details className="apple-card overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: 'var(--text-main)' }}>
                  <Route size={16} style={{ color: 'var(--primary)' }} />
                  交通路线比选 ({structured.route_options.length} 条)
                  <span className="ml-auto text-xs group-open:rotate-180 transition-transform" style={{ color: 'var(--text-muted)' }}>▼</span>
                </summary>
                <div className="px-5 pb-5 space-y-2">
                  {structured.route_options.map((route: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl" style={{ background: 'var(--border-light)' }}>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
                        <span>{route.from_poi}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span>{route.to_poi}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {route.options?.map((opt: any, oi: number) => (
                          <div key={oi} className="px-2.5 py-1 rounded-lg text-xs"
                            style={{
                              background: opt.mode === route.recommended_mode ? 'var(--primary-light)' : 'var(--card-bg)',
                              color: opt.mode === route.recommended_mode ? 'var(--primary)' : 'var(--text-muted)',
                              border: `1px solid ${opt.mode === route.recommended_mode ? 'rgba(0,122,255,0.2)' : 'var(--border-color)'}`,
                              fontWeight: opt.mode === route.recommended_mode ? 600 : 400,
                            }}>
                            {opt.mode} · {opt.duration_minutes}min
                            {opt.mode === route.recommended_mode && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Day Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <List size={16} style={{ color: 'var(--primary)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>每日行程</h2>
              </div>
              {days.map((day: any) => (
                <DayCard
                  key={day.day_number}
                  day={day}
                  isActive={activeDay === day.day_number}
                  onDayClick={setActiveDay}
                />
              ))}
            </div>

            {/* Risk Tips */}
            {itinerary.riskTips && (
              <div className="apple-card p-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: '#92400E' }}>注意事项</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#A16207' }}>{itinerary.riskTips}</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-[400px] flex-shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Map */}
              <div className="apple-card overflow-hidden" style={{ height: 480 }}>
                <ItineraryMapView
                  pois={enrichedPois}
                  days={days}
                  planningScore={structured.planning_score || { level: 'normal', reasoning: '', daily_poi_avg: 0, total_transport_minutes: 0 }}
                  amapKey={AMAP_KEY}
                  externalActiveDay={activeDay}
                  onDayChange={setActiveDay}
                />
              </div>

              {/* Weather */}
              {structured.weather_forecast?.length > 0 && (
                <div className="apple-card p-4">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <Cloud size={14} style={{ color: 'var(--primary)' }} /> 天气概况
                  </h3>
                  <div className="space-y-2">
                    {structured.weather_forecast.map((w: any) => (
                      <div key={w.day_number} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Day {w.day_number}</span>
                        <span className="font-medium" style={{ color: 'var(--text-main)' }}>{w.weather}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{w.temperature_high}°/{w.temperature_low}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotels */}
              {hotels.length > 0 && (
                <div className="apple-card p-4">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <Hotel size={14} style={{ color: 'var(--primary)' }} /> 住宿推荐
                  </h3>
                  <div className="space-y-2.5">
                    {hotels.map((hotel: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--primary-light)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium" style={{ color: 'var(--primary)' }}>Day {hotel.day_number}</span>
                          {hotel.star_rating && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--primary)' }}>{hotel.star_rating}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{hotel.name}</p>
                        {hotel.estimated_price && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: 'var(--primary)' }}>
                            <Banknote size={11} /> {hotel.estimated_price}
                          </span>
                        )}
                        {hotel.highlights && (
                          <p className="text-xs mt-1 flex items-start gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Star size={11} style={{ color: '#FF9500' }} className="flex-shrink-0 mt-0.5" /> {hotel.highlights}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* POI list */}
              {enrichedPois.length > 0 && (
                <div className="apple-card p-4">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} /> 途经 POI ({enrichedPois.length})
                  </h3>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {enrichedPois.map((poi: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <span className="font-medium" style={{ color: 'var(--text-main)' }}>{poi.name}</span>
                          {poi.category && <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>· {poi.category}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="apple-card max-w-lg w-full p-6"
          >
            <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-main)' }}>发布到灵感发现</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>分享您的行程，为其他旅行者提供灵感</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>标题</label>
                <input type="text" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder={itinerary.title}
                  className="w-full px-4 py-3 apple-input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>简介</label>
                <textarea value={publishCaption} onChange={(e) => setPublishCaption(e.target.value)}
                  placeholder="分享您的旅行心得..." rows={3}
                  className="w-full px-4 py-3 apple-input text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowPublishDialog(false); setPublishTitle(''); setPublishCaption(''); }}
                disabled={publishing}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                取消
              </button>
              <button onClick={handlePublish} disabled={publishing}
                className="flex-1 px-4 py-2.5 apple-btn-primary text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {publishing ? <><Loader2 size={16} className="animate-spin" /> 发布中...</> : <><Send size={16} /> 发布</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDetailPage;
