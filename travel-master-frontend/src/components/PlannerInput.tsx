import React, { useState, useEffect } from 'react';

interface PlannerInputProps {
  onGenerate: (query: string, userId: string) => void;
  loading: boolean;
}

/**
 * 行程规划输入组件：接收用户的旅行需求
 */
const PlannerInput: React.FC<PlannerInputProps> = ({ onGenerate, loading }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interests, setInterests] = useState('');
  const [extraQuery, setExtraQuery] = useState('');
  
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('travel_user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
  });

  // 获取今天的日期字符串 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 组合标准化查询
    let finalQuery = '';
    if (destination) finalQuery += `目的地：${destination}。`;
    if (startDate && endDate) finalQuery += `旅行时间：从 ${startDate} 到 ${endDate}。`;
    else if (startDate) finalQuery += `开始时间：${startDate}。`;
    
    if (interests) finalQuery += `兴趣爱好：${interests}。`;
    if (extraQuery) finalQuery += `\n其他要求：${extraQuery}`;

    if (!finalQuery.trim()) return;

    // 将 userId 存入 localStorage 以便刷新后恢复
    localStorage.setItem('travel_user_id', userId);
    onGenerate(finalQuery.trim(), userId);
  };

  return (
    <div className="glass-panel rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 transition-all duration-300 hover:shadow-blue-500/10">
      <div className="flex items-center mb-6">
        <div className="bg-blue-600 p-2 rounded-lg mr-4 shadow-lg shadow-blue-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight m-0">开始规划您的旅行</h2>
          <p className="text-gray-500 text-sm mt-1">告诉 Agent 您的想法，它将为您量身定制行程</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 用户 ID 栏 - 极致紧凑 */}
        <div className="flex items-center space-x-3 opacity-60 hover:opacity-100 transition-opacity">
          <label htmlFor="userId" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            ID:
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 bg-transparent px-0 py-0 text-xs border-none focus:ring-0 outline-none text-gray-500 font-mono"
            placeholder="User ID"
          />
        </div>

        {/* 目的地 - 紧凑型设计 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <span className="mr-1.5">📍</span> 目的地
            </label>
            <div className="flex gap-1.5">
              {['内江', '成都', '重庆', '北京'].map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setDestination(city)}
                  className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="想去哪里？"
            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            disabled={loading}
          />
        </div>

        {/* 旅行时间 - 解决溢出问题 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center">
            <span className="mr-1.5">📅</span> 旅行时间
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold pointer-events-none uppercase">从</span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate('');
                }}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                disabled={loading}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold pointer-events-none uppercase">至</span>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* 兴趣爱好 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700 flex items-center">
              <span className="mr-1.5">🎨</span> 兴趣爱好
            </label>
            <div className="flex gap-1.5">
              {['美食', '历史', '自然'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setInterests(prev => prev ? `${prev}, ${tag}` : tag)}
                  className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="地道美食、历史古迹..."
            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            disabled={loading}
          />
        </div>

        {/* 自由输入 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center">
            <span className="mr-1.5">✍️</span> 其他需求
          </label>
          <textarea
            value={extraQuery}
            onChange={(e) => setExtraQuery(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
            placeholder="补充需求（如预算、随行人员）"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!destination && !extraQuery)}
          className={`w-full py-3.5 px-6 rounded-xl text-white font-bold text-base shadow-lg transition-all duration-300 transform active:scale-95 ${
            loading || (!destination && !extraQuery)
              ? 'bg-gray-200 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:shadow-blue-500/25'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在为您定制行程...
            </span>
          ) : (
            '开启智能之旅'
          )}
        </button>
      </form>
    </div>
  );
};

export default PlannerInput;
