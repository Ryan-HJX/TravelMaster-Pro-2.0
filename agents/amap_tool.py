"""
高德地图 POI 搜索与校验工具。

调用高德 Web 服务 API 获取真实的地理位置信息，用于消除 LLM 幻觉。
"""
import os
import httpx
from typing import Optional, Dict

from config.settings import settings

async def verify_poi_amap(keyword: str, city: str = "") -> Optional[Dict]:
    """
    调用高德 Web API 搜索 POI。
    如果找到了该地点，返回包含经纬度和规范名称的字典；否则返回 None。
    """
    # 优先从 settings 获取最新的 Key（支持从 .env 实时读取）
    api_key = settings.AMAP_API_KEY

    if not api_key or api_key == "your_amap_web_service_api_key_here":
        print("⚠️ 错误: 未在 .env 中检测到有效的 AMAP_API_KEY，地点校验将全部失效！")
        return None

    url = "https://restapi.amap.com/v3/place/text"
    params = {
        "key": api_key,
        "keywords": keyword,
        "city": city,
        "offset": 1, # 我们只需要最匹配的1个
        "page": 1,
        "extensions": "base"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=5.0)
            data = response.json()
            
            if data.get("status") == "1" and data.get("count") != "0" and len(data.get("pois", [])) > 0:
                poi = data["pois"][0]
                
                # 极致严格校验：返回的 POI 必须属于目标城市
                # 高德返回的 cityname 或 adname 必须包含目标城市关键字
                poi_city = poi.get("cityname", "")
                poi_ad = poi.get("adname", "")
                
                if city:
                    # 只要城市名不在 cityname 和 adname 中，就判定为跨城误报
                    if city not in poi_city and city not in poi_ad:
                        print(f"  ❌ 跨城误报过滤: 搜到 {poi_city}{poi_ad}，但目标是 {city}。已丢弃。")
                        return None
                
                # 严格校验：过滤掉明显不相关的类型（比如汽修、洗车、公共厕所等）
                poi_type = poi.get("type", "")
                forbidden_types = ["汽车维修", "汽车服务", "公共厕所", "生活服务", "路口"]
                for ft in forbidden_types:
                    if ft in poi_type:
                        print(f"  ⚠️ 类型冲突 ({poi_type}): {poi.get('name')} 疑似非旅游/餐饮地点。已忽略。")
                        return None

                return {
                    "name": poi.get("name", keyword),
                    "address": poi.get("address", "具体地址请参考导航"),
                    "location": poi.get("location", ""),
                    "type": poi_type
                }
    except Exception as e:
        print(f"高德 API 请求失败: {e}")
        
    return None
