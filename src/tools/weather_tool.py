import aiohttp
from src.config.settings import Settings

settings = Settings()

async def get_weather_amap(city_name: str):
    """
    通过高德地图 API 获取城市天气预报。
    """
    api_key = settings.AMAP_API_KEY
    if not api_key:
        return "未配置高德 API Key，无法获取真实天气。"

    # 1. 获取城市 adcode
    geo_url = f"https://restapi.amap.com/v3/geocode/geo?address={city_name}&key={api_key}"
    async with aiohttp.ClientSession() as session:
        async with session.get(geo_url) as resp:
            geo_data = await resp.json()
            if geo_data["status"] == "1" and geo_data["geocodes"]:
                adcode = geo_data["geocodes"][0]["adcode"]
            else:
                return f"未能识别城市 {city_name} 的编码。"

        # 2. 获取预报天气 (extensions=all)
        weather_url = f"https://restapi.amap.com/v3/weather/weatherInfo?city={adcode}&key={api_key}&extensions=all"
        async with session.get(weather_url) as resp:
            w_data = await resp.json()
            if w_data["status"] == "1" and w_data["forecasts"]:
                forecast = w_data["forecasts"][0]
                # 转换为 Markdown 表格格式
                table = "| 日期 | 天气 | 气温 | 风向 |\n| :--- | :--- | :--- | :--- |\n"
                for cast in forecast["casts"]: # 获取高德返回的所有预报天数
                    table += f"| {cast['date']} | {cast['dayweather']} | {cast['nighttemp']}-{cast['daytemp']}℃ | {cast['daywind']}风 |\n"
                return table
            else:
                return "高德天气接口调用失败。"
