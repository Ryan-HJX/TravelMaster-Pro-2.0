import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { X, Search, MapPin, Check } from 'lucide-react';

interface ChinaMapProps {
  visitedCities: string[];
  onCityToggle: (city: string) => void;
  onClose: () => void;
}

// 中国省份列表（用于省级足迹地图）- 共34个省级行政区
const PROVINCES_LIST = [
  // 4个直辖市
  '北京市', '天津市', '上海市', '重庆市',
  // 23个省
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '台湾省',
  // 5个自治区
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  // 2个特别行政区
  '香港特别行政区', '澳门特别行政区'
];

const ChinaMap: React.FC<ChinaMapProps> = ({ visitedCities, onCityToggle, onClose }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [mapLoading, setMapLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    setChartInstance(chart);

    // 加载中国地图GeoJSON数据（省级）
    const loadMapData = async () => {
      try {
        console.log('Loading China province map...');
        setMapLoading(true);
        
        // 尝试多个数据源
        const sources = [
          'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
          'https://geo.datav.aliyun.com/areas_v2/bound/100000_full.json',
        ];
        
        let geoJson = null;
        let loaded = false;
        
        for (const source of sources) {
          try {
            console.log(`Trying source: ${source}`);
            const response = await fetch(source);
            
            if (response.ok) {
              geoJson = await response.json();
              console.log(`✓ Map data loaded from ${source}, features:`, geoJson.features?.length);
              loaded = true;
              break;
            }
          } catch (err) {
            console.warn(`Failed to load from ${source}:`, err);
            continue;
          }
        }
        
        if (!loaded || !geoJson) {
          throw new Error('All map data sources failed');
        }
        
        // 注册地图
        echarts.registerMap('china', geoJson);
        console.log('✓ Map registered successfully');
        setMapLoaded(true);
        
        // 更新图表
        updateProvinceMap(chart);
        setMapLoading(false);
      } catch (err) {
        console.error('✗ Failed to load map data:', err);
        setMapLoading(false);
        // 显示错误信息
        chart.setOption({
          title: {
            text: '地图加载失败',
            subtext: '请检查网络连接或稍后重试',
            left: 'center',
            top: 'middle',
            textStyle: {
              fontSize: 18,
              color: '#666'
            },
            subtextStyle: {
              fontSize: 14,
              color: '#999'
            }
          },
          graphic: {
            type: 'text',
            left: 'center',
            top: '60%',
            style: {
              text: '💡 提示：您可以使用右侧列表标记省份',
              fontSize: 14,
              fill: '#999'
            }
          }
        });
      }
    };

    loadMapData();

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);

  // 更新省级地图
  const updateProvinceMap = (chart: echarts.ECharts) => {
    // 将城市转换为省份（去重）
    const visitedProvinces = Array.from(new Set(
      visitedCities.map(city => {
        // 从 CITIES_DATA 或直接从城市名推断省份
        // 这里简化处理：假设 visitedCities 存储的是省份名
        return city;
      })
    ));

    // 准备地图数据
    const mapData = PROVINCES_LIST.map(province => ({
      name: province,
      value: visitedProvinces.includes(province) ? 1 : 0
    }));

    const option = {
      backgroundColor: '#fff',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'map') {
            const province = params.name;
            const isVisited = visitedProvinces.includes(province);
            
            return `
              <div style="padding: 10px;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${province}</div>
                <div style="margin-top: 4px; padding: 4px 8px; border-radius: 4px; display: inline-block; ${
                  isVisited 
                    ? 'background: #fef3c7; color: #f97316; font-weight: bold;' 
                    : 'background: #f3f4f6; color: #999;'
                }">
                  ${isVisited ? '✓ 已访问' : '○ 未访问'}
                </div>
              </div>
            `;
          }
          return params.name;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#f97316',
        borderWidth: 2,
        borderRadius: 8,
        padding: 0,
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
      },
      visualMap: {
        show: false,
        min: 0,
        max: 1,
        inRange: {
          color: ['#e5e7eb', '#f97316'] // 灰色 -> 橙色
        }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        label: {
          show: true,
          fontSize: 10,
          color: '#666'
        },
        itemStyle: {
          areaColor: '#e5e7eb',
          borderColor: '#fff',
          borderWidth: 1,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 5
        },
        emphasis: {
          itemStyle: {
            areaColor: '#fdba74',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          },
          label: {
            show: true,
            color: '#fff',
            fontWeight: 'bold'
          }
        }
      },
      series: [
        {
          name: '省份访问情况',
          type: 'map',
          geoIndex: 0,
          data: mapData
        }
      ]
    };

    chart.setOption(option, true);

    // 点击事件 - 点击省份切换访问状态
    chart.off('click');
    chart.on('click', (params: any) => {
      if (params.seriesType === 'map' && params.name) {
        onCityToggle(params.name);
      }
    });
  };

  // 当visitedCities变化时更新图表
  useEffect(() => {
    if (chartInstance && mapLoaded) {
      updateProvinceMap(chartInstance);
    }
  }, [visitedCities.length, chartInstance, mapLoaded]);

  // 筛选省份
  const getFilteredProvinces = () => {
    if (!searchKeyword) return PROVINCES_LIST;
    return PROVINCES_LIST.filter(province =>
      province.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  };

  const filteredProvinces = getFilteredProvinces();
  const visitedCount = visitedCities.length;
  const totalCount = PROVINCES_LIST.length;
  const percentage = Math.round((visitedCount / totalCount) * 100 * 10) / 10;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Left Panel - Map */}
        <div className="flex-1 relative">
          {/* Loading Indicator */}
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">正在加载地图...</p>
              </div>
            </div>
          )}
          
          <div ref={chartRef} className="w-full h-full" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
          >
            <X size={20} className="text-gray-600" />
          </button>

          {/* Stats Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={20} className="text-orange-500" />
              <div>
                <div className="text-xs text-gray-500">探索进度</div>
                <div className="text-lg font-black text-gray-900">{percentage}%</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              已访问 <span className="font-bold text-orange-500">{visitedCount}</span> / {totalCount} 省份
            </div>
          </div>
        </div>

        {/* Right Panel - Province List */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <h3 className="text-lg font-bold mb-2">省份管理</h3>
            <p className="text-xs text-white/80">点击地图或列表标记去过的省份</p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索省份..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Province List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredProvinces.map(province => {
                const isVisited = visitedCities.includes(province);
                return (
                  <button
                    key={province}
                    onClick={() => onCityToggle(province)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isVisited
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{province}</div>
                    </div>
                    {isVisited && (
                      <div className="bg-white/20 rounded-full p-1 ml-2">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
            <button
              onClick={() => {
                // 清空所有已访问省份
                PROVINCES_LIST.forEach(province => {
                  if (visitedCities.includes(province)) {
                    onCityToggle(province);
                  }
                });
              }}
              disabled={visitedCities.length === 0}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              清空全部
            </button>
            <button
              onClick={() => {
                // 点亮所有未访问的省份
                PROVINCES_LIST.forEach(province => {
                  if (!visitedCities.includes(province)) {
                    onCityToggle(province);
                  }
                });
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
            >
              全部点亮
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChinaMap;
