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
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">🌍 TravelMaster - AI 智能旅游规划</h1>
          <p className="text-blue-100 mt-1">基于多 Agent 协作的行程生成系统</p>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入区和历史记录 */}
          <div className="lg:col-span-1 space-y-6">
            <PlannerInput onGenerate={generateItinerary} loading={loading} />
            <HistoryList history={history} onSelect={selectFromHistory} />
          </div>

          {/* 右侧：行程单展示区 */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                <strong>错误：</strong>{error}
              </div>
            )}

            {currentItinerary ? (
              <ItineraryViewer content={currentItinerary.itinerary} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">✈️</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  开始您的旅行规划
                </h2>
                <p className="text-gray-500">
                  在左侧输入您的旅行需求，AI 将为您生成详细的行程单
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
