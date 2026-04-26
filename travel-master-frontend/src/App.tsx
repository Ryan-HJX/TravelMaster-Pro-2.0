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
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="container mx-auto px-6 py-8 relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">🌍 TravelMaster</h1>
          <p className="text-blue-100/90 text-lg font-medium tracking-wide">AI 智能旅游规划 · 发现地道的美食与美景</p>
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
