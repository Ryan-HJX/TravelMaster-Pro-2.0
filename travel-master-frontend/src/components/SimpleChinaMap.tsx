import React, { useState } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';

interface SimpleChinaMapProps {
  visitedCities: string[];
  onCityToggle: (city: string) => void;
  onClose: () => void;
}

// 简化的城市数据 - 按省份分组
const PROVINCES_CITIES: Record<string, string[]> = {
  '直辖市': ['北京市', '上海市', '天津市', '重庆市'],
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
  '西藏': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市']
};

const SimpleChinaMap: React.FC<SimpleChinaMapProps> = ({ visitedCities, onCityToggle, onClose }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('全部');

  // 获取所有城市列表
  const getAllCities = () => {
    return Object.values(PROVINCES_CITIES).flat();
  };

  // 获取筛选后的城市
  const getFilteredCities = () => {
    let cities: string[] = [];

    if (selectedProvince === '全部') {
      cities = getAllCities();
    } else {
      cities = PROVINCES_CITIES[selectedProvince] || [];
    }

    if (searchKeyword) {
      cities = cities.filter(city =>
        city.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    return cities;
  };

  const filteredCities = getFilteredCities();
  const visitedCount = visitedCities.length;
  const totalCount = getAllCities().length;
  const percentage = Math.round((visitedCount / totalCount) * 100 * 10) / 10;

  const provinces = ['全部', ...Object.keys(PROVINCES_CITIES)];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MapPin size={28} />
              我的足迹地图
            </h2>
            <p className="text-sm text-white/80 mt-1">点击城市标记您去过的地方</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">探索进度</div>
              <div className="text-2xl font-black text-orange-600">{percentage}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">已访问城市</div>
              <div className="text-2xl font-black text-gray-900">{visitedCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">总城市数</div>
              <div className="text-2xl font-black text-gray-900">{totalCount}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => visitedCities.forEach(city => onCityToggle(city))}
              disabled={visitedCount === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              清空全部
            </button>
            <button
              onClick={() => {
                getAllCities().forEach(city => {
                  if (!visitedCities.includes(city)) {
                    onCityToggle(city);
                  }
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
            >
              全部点亮
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索城市名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Province Filter */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none min-w-[150px]"
          >
            {provinces.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {/* City Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MapPin size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">没有找到匹配的城市</p>
              <p className="text-sm mt-2">试试其他搜索关键词或筛选条件</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredCities.map(city => {
                const isVisited = visitedCities.includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => onCityToggle(city)}
                    className={`relative p-3 rounded-xl transition-all group ${
                      isVisited
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{city.replace('市', '')}</div>
                    {isVisited && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
                        <Check size={12} className="text-orange-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>💡 提示: 点击城市卡片即可标记为已访问</span>
            <span>🎯 橙色 = 已访问 | 灰色 = 未访问</span>
          </div>
          <div>
            共 {filteredCities.length} 个城市显示
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChinaMap;
