import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MapViewer from './MapViewer';

interface ItineraryViewerProps {
  content: string;
  waypoints?: any[];
}

/**
 * 行程单展示组件：使用 react-markdown 渲染 Markdown 格式的行程单
 */
const ItineraryViewer: React.FC<ItineraryViewerProps> = ({ content, waypoints }) => {
  // 尝试解析 Java 后端传来的 JSON 字符串
  let parsedWaypoints = waypoints;
  if (typeof waypoints === 'string') {
    try {
      parsedWaypoints = JSON.parse(waypoints);
    } catch (e) {
      console.error('Failed to parse waypoints', e);
      parsedWaypoints = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* 如果有途经点，显示高德地图路线规划 */}
      {parsedWaypoints && Array.isArray(parsedWaypoints) && parsedWaypoints.length > 0 && (
        <MapViewer waypoints={parsedWaypoints} />
      )}

      <div className="glass-panel rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-500 pl-4">📋 您的行程单</h2>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(content);
              alert('行程单已复制到剪贴板！');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            复制行程
          </button>
        </div>
        <div className="prose prose-blue max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 自定义表格样式
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-blue-50/50">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300">
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
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-l-4 border-blue-500 pl-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold text-gray-700 mt-6 mb-3">{children}</h3>
              ),
              // 自定义段落样式
              p: ({ children }) => (
                <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
              ),
              // 自定义链接样式，特别是高德地图链接渲染成按钮
              a: ({ node, href, children, ...props }) => {
                if (href && href.includes('amap.com')) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-sm hover:shadow transition-all duration-200 no-underline whitespace-nowrap"
                      {...props}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      导航
                    </a>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4 font-medium" {...props}>
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ItineraryViewer;
