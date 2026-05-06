import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, X, Search, Filter } from 'lucide-react';

// 中国主要地级市数据（按省份分组）
const PROVINCES_CITIES: Record<string, string[]> = {
  '北京': ['北京市'],
  '上海': ['上海市'],
  '天津': ['天津市'],
  '重庆': ['重庆市'],
  '广东': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
  '浙江': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
  '江苏': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  '四川': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市'],
  '湖北': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施市'],
  '湖南': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西市'],
  '河南': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
  '山东': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
  '福建': ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'],
  '安徽': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'],
  '江西': ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'],
  '河北': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
  '山西': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
  '陕西': ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'],
  '辽宁': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
  '吉林': ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市'],
  '黑龙江': ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市'],
  '云南': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市'],
  '贵州': ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市'],
  '甘肃': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市'],
  '青海': ['西宁市', '海东市'],
  '海南': ['海口市', '三亚市', '三沙市', '儋州市'],
  '台湾': ['台北市', '高雄市', '台中市', '台南市'],
  '广西': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
  '内蒙古': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市'],
  '宁夏': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  '新疆': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉市', '博乐市', '库尔勒市', '阿克苏市', '喀什市', '和田市', '塔城市', '阿勒泰市', '伊宁市'],
  '西藏': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市'],
  '香港': ['香港特别行政区'],
  '澳门': ['澳门特别行政区']
};

// 省份短名 → 全名映射
const SHORT_TO_FULL: Record<string, string> = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
  '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
  '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
  '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区',
};

// 省份全名 → 城市列表映射
const PROVINCE_TO_CITIES: Record<string, string[]> = {};
Object.entries(PROVINCES_CITIES).forEach(([shortName, cities]) => {
  const fullName = SHORT_TO_FULL[shortName];
  if (fullName) PROVINCE_TO_CITIES[fullName] = cities;
});
// 直辖市：省份名即城市名
['北京市', '天津市', '上海市', '重庆市'].forEach(p => {
  if (!PROVINCE_TO_CITIES[p]) PROVINCE_TO_CITIES[p] = [p];
});

// 统计已访问列表覆盖了多少个省份（供 DashboardPage 复用）
export const countVisitedProvinces = (visited: string[]) => {
  const set = new Set(visited);
  return Object.entries(PROVINCE_TO_CITIES).filter(
    ([province, cities]) => set.has(province) || cities.some(c => set.has(c))
  ).length;
};

// 热门旅游城市列表
const POPULAR_CITIES = [
  '北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市', '西安市', '重庆市',
  '南京市', '武汉市', '长沙市', '苏州市', '厦门市', '青岛市', '三亚市', '昆明市',
  '大理市', '丽江市', '桂林市', '贵阳市', '拉萨市', '乌鲁木齐市', '哈尔滨市'
];

interface CityMapProps {
  visitedCities?: string[];
  onCityToggle?: (city: string) => void;
}

const CityMap: React.FC<CityMapProps> = ({ visitedCities = [], onCityToggle }) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);
  const [currentVisitedCities, setCurrentVisitedCities] = useState<string[]>(visitedCities);

  // 同步外部传入的访问城市列表
  useEffect(() => {
    setCurrentVisitedCities(visitedCities);
  }, [visitedCities]);

  // 获取所有城市列表
  const getAllCities = () => {
    return Object.values(PROVINCES_CITIES).flat();
  };

  // 获取当前筛选后的城市列表
  const getFilteredCities = () => {
    let cities: string[] = [];

    if (selectedProvince === '全部') {
      cities = getAllCities();
    } else if (selectedProvince === '热门') {
      cities = POPULAR_CITIES;
    } else {
      cities = PROVINCES_CITIES[selectedProvince] || [];
    }

    // 搜索过滤
    if (searchKeyword) {
      cities = cities.filter(city =>
        city.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // 只显示已访问
    if (showVisitedOnly) {
      cities = cities.filter(city => isVisited(city));
    }

    return cities;
  };

  // 检查城市是否已访问（直接匹配城市名）
  const isVisited = (city: string) => currentVisitedCities.includes(city);

  // 切换城市访问状态 — 传城市名给父组件
  const handleToggleCity = (city: string) => {
    onCityToggle?.(city);
  };

  // 城市维度统计
  const totalCities = getAllCities().length;
  const visitedCityCount = currentVisitedCities.length;
  const percentage = Math.round((visitedCityCount / totalCities) * 100 * 10) / 10;

  const filteredCities = getFilteredCities();
  const provinces = ['全部', '热门', ...Object.keys(PROVINCES_CITIES)];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} />
            我的足迹地图
          </h3>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
            {visitedCityCount} / {totalCities} 城市
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>探索进度</span>
            <span className="font-black">{percentage}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索城市..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Province Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {provinces.map(province => (
            <button
              key={province}
              onClick={() => setSelectedProvince(province)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedProvince === province
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {province}
            </button>
          ))}
        </div>

        {/* Toggle Visited Only */}
        <button
          onClick={() => setShowVisitedOnly(!showVisitedOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all w-full ${
            showVisitedOnly
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Filter size={14} />
          {showVisitedOnly ? '显示全部城市' : '只显示已访问'}
        </button>
      </div>

      {/* City Grid */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {filteredCities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无城市</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {filteredCities.map(city => (
                <motion.button
                  key={city}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleToggleCity(city)}
                  className={`relative p-3 rounded-xl text-left transition-all group ${
                    isVisited(city)
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{city}</span>
                    {isVisited(city) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-white/20 rounded-full p-1"
                      >
                        <Check size={12} />
                      </motion.div>
                    )}
                  </div>
                  {!isVisited(city) && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-orange-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check size={14} />
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
        <button
          onClick={() => {
            [...currentVisitedCities].forEach(c => onCityToggle?.(c));
          }}
          disabled={currentVisitedCities.length === 0}
          className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X size={14} />
          清空全部
        </button>
        <button
          onClick={() => {
            getAllCities().forEach(city => {
              if (!currentVisitedCities.includes(city)) onCityToggle?.(city);
            });
          }}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Check size={14} />
          全部点亮
        </button>
      </div>
    </div>
  );
};

export default CityMap;
