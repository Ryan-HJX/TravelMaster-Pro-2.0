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

// 省份全名 → 省内城市列表（用于从城市名推导省份）
const MUNICIPALITIES = ['北京市', '天津市', '上海市', '重庆市'];
const CITY_TO_PROVINCE: Record<string, string> = {
  // 河北省
  '石家庄市': '河北省', '唐山市': '河北省', '秦皇岛市': '河北省', '邯郸市': '河北省',
  '邢台市': '河北省', '保定市': '河北省', '张家口市': '河北省', '承德市': '河北省',
  '沧州市': '河北省', '廊坊市': '河北省', '衡水市': '河北省',
  // 山西省
  '太原市': '山西省', '大同市': '山西省', '阳泉市': '山西省', '长治市': '山西省',
  '晋城市': '山西省', '朔州市': '山西省', '晋中市': '山西省', '运城市': '山西省',
  '忻州市': '山西省', '临汾市': '山西省', '吕梁市': '山西省',
  // 内蒙古
  '呼和浩特市': '内蒙古自治区', '包头市': '内蒙古自治区', '乌海市': '内蒙古自治区',
  '赤峰市': '内蒙古自治区', '通辽市': '内蒙古自治区', '鄂尔多斯市': '内蒙古自治区',
  '呼伦贝尔市': '内蒙古自治区', '巴彦淖尔市': '内蒙古自治区', '乌兰察布市': '内蒙古自治区',
  // 辽宁省
  '沈阳市': '辽宁省', '大连市': '辽宁省', '鞍山市': '辽宁省', '抚顺市': '辽宁省',
  '本溪市': '辽宁省', '丹东市': '辽宁省', '锦州市': '辽宁省', '营口市': '辽宁省',
  '阜新市': '辽宁省', '辽阳市': '辽宁省', '盘锦市': '辽宁省', '铁岭市': '辽宁省',
  '朝阳市': '辽宁省', '葫芦岛市': '辽宁省',
  // 吉林省
  '长春市': '吉林省', '吉林市': '吉林省', '四平市': '吉林省', '辽源市': '吉林省',
  '通化市': '吉林省', '白山市': '吉林省', '松原市': '吉林省', '白城市': '吉林省',
  // 黑龙江省
  '哈尔滨市': '黑龙江省', '齐齐哈尔市': '黑龙江省', '鸡西市': '黑龙江省',
  '鹤岗市': '黑龙江省', '双鸭山市': '黑龙江省', '大庆市': '黑龙江省',
  '伊春市': '黑龙江省', '佳木斯市': '黑龙江省', '七台河市': '黑龙江省',
  '牡丹江市': '黑龙江省', '黑河市': '黑龙江省', '绥化市': '黑龙江省',
  // 江苏省
  '南京市': '江苏省', '无锡市': '江苏省', '徐州市': '江苏省', '常州市': '江苏省',
  '苏州市': '江苏省', '南通市': '江苏省', '连云港市': '江苏省', '淮安市': '江苏省',
  '盐城市': '江苏省', '扬州市': '江苏省', '镇江市': '江苏省', '泰州市': '江苏省', '宿迁市': '江苏省',
  // 浙江省
  '杭州市': '浙江省', '宁波市': '浙江省', '温州市': '浙江省', '嘉兴市': '浙江省',
  '湖州市': '浙江省', '绍兴市': '浙江省', '金华市': '浙江省', '衢州市': '浙江省',
  '舟山市': '浙江省', '台州市': '浙江省', '丽水市': '浙江省',
  // 安徽省
  '合肥市': '安徽省', '芜湖市': '安徽省', '蚌埠市': '安徽省', '淮南市': '安徽省',
  '马鞍山市': '安徽省', '淮北市': '安徽省', '铜陵市': '安徽省', '安庆市': '安徽省',
  '黄山市': '安徽省', '滁州市': '安徽省', '阜阳市': '安徽省', '宿州市': '安徽省',
  '六安市': '安徽省', '亳州市': '安徽省', '池州市': '安徽省', '宣城市': '安徽省',
  // 福建省
  '福州市': '福建省', '厦门市': '福建省', '莆田市': '福建省', '三明市': '福建省',
  '泉州市': '福建省', '漳州市': '福建省', '南平市': '福建省', '龙岩市': '福建省', '宁德市': '福建省',
  // 江西省
  '南昌市': '江西省', '景德镇市': '江西省', '萍乡市': '江西省', '九江市': '江西省',
  '新余市': '江西省', '鹰潭市': '江西省', '赣州市': '江西省', '吉安市': '江西省',
  '宜春市': '江西省', '抚州市': '江西省', '上饶市': '江西省',
  // 山东省
  '济南市': '山东省', '青岛市': '山东省', '淄博市': '山东省', '枣庄市': '山东省',
  '东营市': '山东省', '烟台市': '山东省', '潍坊市': '山东省', '济宁市': '山东省',
  '泰安市': '山东省', '威海市': '山东省', '日照市': '山东省', '临沂市': '山东省',
  '德州市': '山东省', '聊城市': '山东省', '滨州市': '山东省', '菏泽市': '山东省',
  // 河南省
  '郑州市': '河南省', '开封市': '河南省', '洛阳市': '河南省', '平顶山市': '河南省',
  '安阳市': '河南省', '鹤壁市': '河南省', '新乡市': '河南省', '焦作市': '河南省',
  '濮阳市': '河南省', '许昌市': '河南省', '漯河市': '河南省', '三门峡市': '河南省',
  '南阳市': '河南省', '商丘市': '河南省', '信阳市': '河南省', '周口市': '河南省', '驻马店市': '河南省',
  // 湖北省
  '武汉市': '湖北省', '黄石市': '湖北省', '十堰市': '湖北省', '宜昌市': '湖北省',
  '襄阳市': '湖北省', '鄂州市': '湖北省', '荆门市': '湖北省', '孝感市': '湖北省',
  '荆州市': '湖北省', '黄冈市': '湖北省', '咸宁市': '湖北省', '随州市': '湖北省', '恩施市': '湖北省',
  // 湖南省
  '长沙市': '湖南省', '株洲市': '湖南省', '湘潭市': '湖南省', '衡阳市': '湖南省',
  '邵阳市': '湖南省', '岳阳市': '湖南省', '常德市': '湖南省', '张家界市': '湖南省',
  '益阳市': '湖南省', '郴州市': '湖南省', '永州市': '湖南省', '怀化市': '湖南省',
  '娄底市': '湖南省', '湘西市': '湖南省',
  // 广东省
  '广州市': '广东省', '深圳市': '广东省', '珠海市': '广东省', '汕头市': '广东省',
  '佛山市': '广东省', '韶关市': '广东省', '湛江市': '广东省', '肇庆市': '广东省',
  '江门市': '广东省', '茂名市': '广东省', '惠州市': '广东省', '梅州市': '广东省',
  '汕尾市': '广东省', '河源市': '广东省', '阳江市': '广东省', '清远市': '广东省',
  '东莞市': '广东省', '中山市': '广东省', '潮州市': '广东省', '揭阳市': '广东省', '云浮市': '广东省',
  // 海南省
  '海口市': '海南省', '三亚市': '海南省', '三沙市': '海南省', '儋州市': '海南省',
  // 四川省
  '成都市': '四川省', '自贡市': '四川省', '攀枝花市': '四川省', '泸州市': '四川省',
  '德阳市': '四川省', '绵阳市': '四川省', '广元市': '四川省', '遂宁市': '四川省',
  '内江市': '四川省', '乐山市': '四川省', '南充市': '四川省', '眉山市': '四川省',
  '宜宾市': '四川省', '广安市': '四川省', '达州市': '四川省', '雅安市': '四川省',
  '巴中市': '四川省', '资阳市': '四川省',
  // 贵州省
  '贵阳市': '贵州省', '六盘水市': '贵州省', '遵义市': '贵州省', '安顺市': '贵州省',
  '毕节市': '贵州省', '铜仁市': '贵州省',
  // 云南省
  '昆明市': '云南省', '曲靖市': '云南省', '玉溪市': '云南省', '保山市': '云南省',
  '昭通市': '云南省', '丽江市': '云南省', '普洱市': '云南省', '临沧市': '云南省',
  // 陕西省
  '西安市': '陕西省', '铜川市': '陕西省', '宝鸡市': '陕西省', '咸阳市': '陕西省',
  '渭南市': '陕西省', '延安市': '陕西省', '汉中市': '陕西省', '榆林市': '陕西省',
  '安康市': '陕西省', '商洛市': '陕西省',
  // 甘肃省
  '兰州市': '甘肃省', '嘉峪关市': '甘肃省', '金昌市': '甘肃省', '白银市': '甘肃省',
  '天水市': '甘肃省', '武威市': '甘肃省', '张掖市': '甘肃省', '平凉市': '甘肃省',
  '酒泉市': '甘肃省', '庆阳市': '甘肃省', '定西市': '甘肃省', '陇南市': '甘肃省',
  // 青海省
  '西宁市': '青海省', '海东市': '青海省',
  // 台湾省
  '台北市': '台湾省', '高雄市': '台湾省', '台中市': '台湾省', '台南市': '台湾省',
  // 广西
  '南宁市': '广西壮族自治区', '柳州市': '广西壮族自治区', '桂林市': '广西壮族自治区',
  '梧州市': '广西壮族自治区', '北海市': '广西壮族自治区', '防城港市': '广西壮族自治区',
  '钦州市': '广西壮族自治区', '贵港市': '广西壮族自治区', '玉林市': '广西壮族自治区',
  '百色市': '广西壮族自治区', '贺州市': '广西壮族自治区', '河池市': '广西壮族自治区',
  '来宾市': '广西壮族自治区', '崇左市': '广西壮族自治区',
  // 宁夏
  '银川市': '宁夏回族自治区', '石嘴山市': '宁夏回族自治区', '吴忠市': '宁夏回族自治区',
  '固原市': '宁夏回族自治区', '中卫市': '宁夏回族自治区',
  // 新疆
  '乌鲁木齐市': '新疆维吾尔自治区', '克拉玛依市': '新疆维吾尔自治区',
  '吐鲁番市': '新疆维吾尔自治区', '哈密市': '新疆维吾尔自治区', '昌吉市': '新疆维吾尔自治区',
  '博乐市': '新疆维吾尔自治区', '库尔勒市': '新疆维吾尔自治区', '阿克苏市': '新疆维吾尔自治区',
  '喀什市': '新疆维吾尔自治区', '和田市': '新疆维吾尔自治区', '塔城市': '新疆维吾尔自治区',
  '阿勒泰市': '新疆维吾尔自治区', '伊宁市': '新疆维吾尔自治区',
  // 西藏
  '拉萨市': '西藏自治区', '日喀则市': '西藏自治区', '昌都市': '西藏自治区',
  '林芝市': '西藏自治区', '山南市': '西藏自治区', '那曲市': '西藏自治区',
  // 特别行政区
  '香港特别行政区': '香港特别行政区', '澳门特别行政区': '澳门特别行政区',
};

// 从混合数组（省份名+城市名）解析出已访问的省份列表
const resolveVisitedProvinces = (visited: string[]): string[] => {
  const set = new Set(visited);
  return PROVINCES_LIST.filter(province =>
    set.has(province) || Object.entries(CITY_TO_PROVINCE).some(([city, prov]) => prov === province && set.has(city))
  );
};

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
    const visitedProvinces = resolveVisitedProvinces(visitedCities);

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
  const resolvedVisited = resolveVisitedProvinces(visitedCities);
  const visitedCount = resolvedVisited.length;
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
                const isVisited = resolvedVisited.includes(province);
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
                // 遍历实际存储的项（城市名或省份名），逐个移除
                [...visitedCities].forEach(item => onCityToggle(item));
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
