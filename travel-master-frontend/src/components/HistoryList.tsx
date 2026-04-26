import React from 'react';
import type { Itinerary } from '../services/api';

interface HistoryListProps {
  history: Itinerary[];
  onSelect: (itinerary: Itinerary) => void;
}

/**
 * 历史记录列表组件：展示用户的历史行程并支持点击切换
 */
const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect }) => {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">📜 历史行程</h3>
        <p className="text-gray-500 text-sm">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">📜 历史行程</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="text-sm font-medium text-gray-800 truncate">
              {item.content.split('\n')[0] || `行程 #${item.id}`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(item.createdAt).toLocaleString('zh-CN')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
