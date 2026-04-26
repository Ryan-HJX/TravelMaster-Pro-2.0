import React from 'react';
import type { Itinerary } from '../services/api';

interface HistoryListProps {
  history: Itinerary[];
  onSelect: (itinerary: Itinerary) => void;
  onRemove: (id: number) => void;
}

/**
 * 历史记录列表组件：展示用户的历史行程并支持点击切换
 */
const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onRemove }) => {
  if (history.length === 0) {
    return (
      <div className="glass-panel rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2 tracking-tight">📜 历史行程</h3>
        <p className="text-gray-500 text-sm">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">📜 历史行程</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {history.map((item) => (
          <div key={item.id} className="relative flex group">
            <button
              onClick={() => onSelect(item)}
              className="flex-1 text-left p-3 pr-10 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800 truncate">
                {item.content.split('\n')[0] || `行程 #${item.id}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(item.createdAt).toLocaleString('zh-CN')}
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('确定要删除该行程吗？')) {
                  onRemove(item.id);
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除此行程"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
