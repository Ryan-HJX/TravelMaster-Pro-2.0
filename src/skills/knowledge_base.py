CITY_KNOWLEDGE: dict[str, list[dict[str, object]]] = {
    "北京": [
        {"name": "故宫博物院", "address": "北京市东城区景山前街4号", "location": "116.397477,39.918058", "tags": ["culture", "history"]},
        {"name": "天坛公园", "address": "北京市东城区天坛东里甲1号", "location": "116.410886,39.881949", "tags": ["culture", "park"]},
        {"name": "什刹海", "address": "北京市西城区羊房胡同23号", "location": "116.387407,39.948703", "tags": ["nightlife", "food"]},
        {"name": "颐和园", "address": "北京市海淀区新建宫门路19号", "location": "116.273019,39.99981", "tags": ["park", "culture"]},
        {"name": "八达岭长城", "address": "北京市延庆区军都山关沟古道北口", "location": "116.020075,40.356311", "tags": ["outdoor", "history"]},
    ],
    "上海": [
        {"name": "外滩", "address": "上海市黄浦区中山东一路", "location": "121.490317,31.241701", "tags": ["citywalk", "nightlife"]},
        {"name": "豫园", "address": "上海市黄浦区福佑路168号", "location": "121.492229,31.22719", "tags": ["culture", "food"]},
        {"name": "上海博物馆", "address": "上海市黄浦区人民大道201号", "location": "121.475157,31.230285", "tags": ["museum", "culture"]},
        {"name": "武康路", "address": "上海市徐汇区武康路", "location": "121.438264,31.205406", "tags": ["citywalk", "photo"]},
        {"name": "迪士尼乐园", "address": "上海市浦东新区川沙新镇黄赵路310号", "location": "121.665913,31.141038", "tags": ["family", "themepark"]},
    ],
    "成都": [
        {"name": "宽窄巷子", "address": "成都市青羊区长顺街127号", "location": "104.055111,30.667616", "tags": ["food", "culture"]},
        {"name": "杜甫草堂", "address": "成都市青羊区青华路37号", "location": "104.028578,30.662222", "tags": ["culture", "history"]},
        {"name": "人民公园", "address": "成都市青羊区祠堂街9号", "location": "104.057881,30.661899", "tags": ["park", "tea"]},
        {"name": "锦里古街", "address": "成都市武侯区武侯祠大街231号", "location": "104.049375,30.648694", "tags": ["food", "nightlife"]},
        {"name": "熊猫基地", "address": "成都市成华区外北熊猫大道1375号", "location": "104.148655,30.741961", "tags": ["family", "nature"]},
    ],
    "杭州": [
        {"name": "西湖", "address": "杭州市西湖区龙井路1号", "location": "120.153576,30.243201", "tags": ["nature", "citywalk"]},
        {"name": "灵隐寺", "address": "杭州市西湖区法云弄1号", "location": "120.104119,30.246791", "tags": ["culture", "history"]},
        {"name": "河坊街", "address": "杭州市上城区河坊街", "location": "120.170065,30.241793", "tags": ["food", "shopping"]},
        {"name": "西溪湿地", "address": "杭州市西湖区天目山路518号", "location": "120.063617,30.269773", "tags": ["nature", "photo"]},
        {"name": "龙井村", "address": "杭州市西湖区龙井村", "location": "120.131882,30.229907", "tags": ["tea", "nature"]},
    ],
}

DEFAULT_TEMPLATE_LIBRARY = {
    "culture": ["博物馆/古建/历史街区优先", "安排安静早餐和夜景收尾"],
    "food": ["每天下午预留小吃/咖啡时间", "优先本地高口碑餐厅"],
    "nature": ["上午安排自然景区，下午轻量活动", "加入观景和休息点"],
    "family": ["控制单日步行强度", "加入适合拍照和互动的场景"],
    "citywalk": ["优先串联步行街区", "晚间加入夜景和特色餐饮"],
}
