import React, { useState } from 'react';

interface PlannerInputProps {
  onGenerate: (query: string, userId: string) => void;
  loading: boolean;
}

/**
 * 行程规划输入组件：接收用户的旅行需求
 */
const PlannerInput: React.FC<PlannerInputProps> = ({ onGenerate, loading }) => {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('travel_user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // 将 userId 存入 localStorage 以便刷新后恢复
    localStorage.setItem('travel_user_id', userId);
    onGenerate(query, userId);
  };

  return (
    <div className="glass-panel rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight">✈️ 开始规划您的旅行</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            用户 ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入您的用户ID"
          />
        </div>
        
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
            旅行需求
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例如：我想去北京玩三天，喜欢历史和美食..."
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
            loading || !query.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在规划中...
            </span>
          ) : (
            '开始规划'
          )}
        </button>
      </form>
    </div>
  );
};

export default PlannerInput;
