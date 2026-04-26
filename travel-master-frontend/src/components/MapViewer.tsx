import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface Waypoint {
  name: string;
  address: string;
  location: string; // "lng,lat"
}

interface MapViewerProps {
  waypoints: Waypoint[];
}

const MapViewer: React.FC<MapViewerProps> = ({ waypoints }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // TODO: 生产环境中，最好将 key 和 securityJsCode 放在 .env 中
    // 这里出于演示直接写死或者在项目中配置
    // @ts-ignore
    window._AMapSecurityConfig = {
      securityJsCode: 'c580cfe2719c59bb32d10b71f78f104d', // 需要替换
    };

    AMapLoader.load({
      key: '7ea3225d8b711f9b6a2171b47c266960', // 需要替换
      version: '2.0',
      plugins: ['AMap.Driving'], // 引入驾车路线规划插件
    })
      .then((AMap) => {
        if (!mapInstance.current) {
          mapInstance.current = new AMap.Map(mapContainer.current, {
            zoom: 11,
            center: [116.397428, 39.90923], // 默认天安门
          });
        }

        const map = mapInstance.current;
        map.clearMap(); // 清除现有覆盖物

        if (!waypoints || waypoints.length === 0) return;

        // 解析经纬度
        const parsedPoints = waypoints
          .map((wp) => {
            const parts = wp.location.split(',');
            if (parts.length === 2) {
              return {
                lnglat: new AMap.LngLat(Number(parts[0]), Number(parts[1])),
                name: wp.name,
              };
            }
            return null;
          })
          .filter((p) => p !== null);

        if (parsedPoints.length === 0) return;

        // 添加 Marker
        const markers: any[] = [];
        parsedPoints.forEach((p, index) => {
          const isFood = p!.type && (p!.type.includes('餐饮') || p!.type.includes('美食') || p!.type.includes('餐厅'));
          const icon = isFood ? '🍴' : '🏛️';
          const marker = new AMap.Marker({
            map: map,
            position: p!.lnglat,
            title: p!.name,
            label: {
              content: `<div class="bg-indigo-600 text-white rounded-full px-2 py-0.5 flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-lg transform -translate-y-1 gap-1">
                <span>${index + 1}</span>
                <span>${icon}</span>
              </div>`,
              direction: 'top',
            },
          });
          markers.push(marker);
        });

        // 如果只有一个点
        if (parsedPoints.length === 1) {
          map.setCenter(parsedPoints[0]!.lnglat);
          map.setZoom(15);
        } else {
          // 绘制路线
          const driving = new AMap.Driving({
            map: map,
            hideMarkers: true, // 我们已经手动画了更漂亮的 Marker
            policy: AMap.DrivingPolicy.LEAST_TIME,
          });

          const start = parsedPoints[0]!.lnglat;
          const end = parsedPoints[parsedPoints.length - 1]!.lnglat;
          const via = parsedPoints.slice(1, parsedPoints.length - 1).map((p) => p!.lnglat);

          driving.search(start, end, { waypoints: via }, function (status: any, result: any) {
            if (status === 'complete') {
              console.log('✅ 路线规划成功');
              // 自动调整视野包含所有点和路线
              map.setFitView();
            } else {
              console.error('❌ 路线规划失败：' + (result.info || status));
              // 即使路线失败，也要保证点都显示出来
              map.setFitView(markers);
            }
          });
        }
      })
      .catch((e) => {
        console.error('高德地图加载失败', e);
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [waypoints]);

  return (
    <div className="glass-panel rounded-2xl shadow-lg p-4 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>🗺️</span> 路线规划概览
      </h3>
      {(!waypoints || waypoints.length === 0) ? (
        <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
          <p className="text-gray-500">暂无路线数据，请配置高德 Key 后重试</p>
        </div>
      ) : (
        <div
          ref={mapContainer}
          className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200"
        ></div>
      )}
    </div>
  );
};

export default MapViewer;
