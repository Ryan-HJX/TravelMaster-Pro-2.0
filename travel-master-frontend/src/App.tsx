import { useEffect } from 'react';
import PlannerInput from './components/PlannerInput';
import ItineraryViewer from './components/ItineraryViewer';
import HistoryList from './components/HistoryList';
import { useTravelPlanner } from './hooks/useTravelPlanner';

function App() {
  const {
    loading,
    error,
    currentItinerary,
    history,
    generateItinerary,
    fetchHistory,
    selectFromHistory,
    removeItinerary,
  } = useTravelPlanner();

  // 组件挂载时加载历史记录（优先从 localStorage 读取 userId）
  useEffect(() => {
    const storedUserId = localStorage.getItem('travel_user_id');
    if (storedUserId) {
      fetchHistory(storedUserId);
    }
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* 背景装饰：流光溢彩的微妙渐变 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-[100%] h-[200%] bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-[80%] h-[150%] bg-gradient-to-tr from-indigo-300 to-pink-300 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-8 py-10 relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-1">
              <span className="text-4xl">🌍</span>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter m-0 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900">
                TravelMaster
              </h1>
            </div>
            <p className="text-gray-500 text-lg lg:text-xl font-medium tracking-tight">
              <span className="text-blue-600 font-bold">AI</span> 智能旅游规划 · 发现地道的美食与美景
            </p>
          </div>
          
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-gray-400">
            <div className="flex flex-col items-end">
              <span className="text-gray-900 font-bold">Real-time Search</span>
              <span>集成 Tavily 高级检索</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-gray-900 font-bold">Smart Itinerary</span>
              <span>LangGraph 工作流引擎</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入区和历史记录 */}
          <div className="lg:col-span-1 space-y-6">
            <PlannerInput onGenerate={generateItinerary} loading={loading} />
            <HistoryList history={history} onSelect={selectFromHistory} onRemove={removeItinerary} />
          </div>

          {/* 右侧：行程单展示区 */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                <strong>错误：</strong>{error}
              </div>
            )}

            {currentItinerary ? (
              <ItineraryViewer content={currentItinerary.itinerary} waypoints={currentItinerary.waypoints} />
            ) : (
              <div className="glass-panel rounded-2xl shadow-xl p-16 text-center transition-all duration-300 hover:shadow-2xl">
                <div className="text-7xl mb-6 animate-bounce">✈️</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">
                  开启您的完美旅程
                </h2>
                <p className="text-gray-500 text-lg">
                  在左侧输入您的旅行需求，AI 将为您检索真实评价并生成专属行程单
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
