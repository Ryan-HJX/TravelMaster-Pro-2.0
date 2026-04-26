import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ItineraryViewerProps {
  content: string;
}

/**
 * 行程单展示组件：使用 react-markdown 渲染 Markdown 格式的行程单
 */
const ItineraryViewer: React.FC<ItineraryViewerProps> = ({ content }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 您的行程单</h2>
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义表格样式
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-blue-50">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                {children}
              </td>
            ),
            // 自定义标题样式
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">{children}</h3>
            ),
            // 自定义列表样式
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 ml-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 ml-4">{children}</ol>
            ),
            // 自定义段落样式
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ItineraryViewer;
