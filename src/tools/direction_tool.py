import aiohttp
from src.config.settings import Settings

settings = Settings()

async def get_direction_amap(origin_loc: str, dest_loc: str):
    """
    通过高德地图 API 获取两点之间的驾驶路径规划信息。
    
    Args:
        origin_loc: 起点经纬度 "116.481028,39.989643"
        dest_loc: 终点经纬度 "116.434446,39.90816"
        
    Returns:
        dict: 包含距离(km)和耗时(分钟)
    """
    api_key = settings.AMAP_API_KEY
    if not api_key:
        return None

    url = f"https://restapi.amap.com/v3/direction/driving?origin={origin_loc}&destination={dest_loc}&key={api_key}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                data = await resp.json()
                if data["status"] == "1" and data["route"]["paths"]:
                    path = data["route"]["paths"][0]
                    distance_km = round(float(path["distance"]) / 1000, 1)
                    duration_min = round(float(path["duration"]) / 60)
                    return {
                        "distance": distance_km,
                        "duration": duration_min
                    }
    except Exception as e:
        print(f"⚠️ 路径规划调用失败: {e}")
    
    return None
