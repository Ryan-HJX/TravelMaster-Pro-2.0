import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Map as MapIcon, Route, Wallet, Cloud, 
  Share2, Download, Star, MapPin, Calendar, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTask, getItinerary, type TaskResponse, type ItineraryResponse } from '../services/api';
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
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'finance'>('map');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
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
            setTimeout(fetchData, 3000);
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
        <p className="text-gray-600 mb-8 text-center max-w-sm">
          正在从历史库中调取或调用高德/盈米进行实时分析...
        </p>
        <div className="w-full max-w-md h-2 bg-orange-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 15 }}
            className="h-full premium-gradient"
          />
        </div>
        <div className="mt-4 text-xs font-mono text-gray-500 uppercase tracking-widest">STATUS: {taskStatus || 'FETCHING'}</div>
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
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-xl text-sm font-medium hover:bg-orange-50 text-orange-700 transition-all">
              <Share2 size={16} /> 分享
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-orange-200 transition-all">
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
    </div>
  );
};

export default ItineraryDetailPage;
