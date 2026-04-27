import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface MapViewerProps {
  waypoints: any[];
}

const MapViewer: React.FC<MapViewerProps> = ({ waypoints }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE || ''; 
    if (securityCode) {
      (window as any)._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY || '7ea3225d8b711f9b6a2171b47c266960',
      version: '2.0', 
      plugins: ['AMap.Polyline', 'AMap.Marker'],
    }).then((AMap) => {
      if (!mapRef.current) return;
      
      try {
        mapInstance.current = new AMap.Map(mapRef.current, {
          viewMode: '2D',
          zoom: 12,
          mapStyle: 'amap://styles/normal',
        });
        
        mapInstance.current.on('complete', () => {
          setLoading(false);
          setMapLoaded(true);
        });
      } catch (err) {
        setLoading(false);
      }
    }).catch(e => {
      setLoading(false);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !waypoints || waypoints.length === 0) return;

    mapInstance.current.clearMap();
    const path: any[] = [];
    const AMap = (window as any).AMap;

    waypoints.forEach((point, i) => {
      if (!point.location) return;
      const lnglat = point.location.split(',');
      const pos = new AMap.LngLat(parseFloat(lnglat[0]), parseFloat(lnglat[1]));
      path.push(pos);

      const marker = new AMap.Marker({
        position: pos,
        content: `
          <div style="
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            border: 2px solid white;
            font-weight: 800;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="background:rgba(255,255,255,0.2); width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px;">${i + 1}</span>
            ${point.name}
          </div>
        `,
        offset: new AMap.Pixel(0, -20),
        anchor: 'bottom-center'
      });
      mapInstance.current.add(marker);
    });

    if (path.length >= 2) {
      const polyline = new AMap.Polyline({
        path: path,
        strokeColor: "#2563eb",
        strokeWeight: 6,
        strokeOpacity: 0.9,
        lineJoin: 'round',
        showDir: true
      });
      mapInstance.current.add(polyline);
    }

    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.setFitView(null, false, [60, 60, 60, 60]);
      }
    }, 500);

  }, [waypoints, mapLoaded]);

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 relative bg-slate-50 group">
      <div ref={mapRef} className="w-full h-full transition-transform duration-500 group-hover:scale-[1.01]" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-blue-600 tracking-tighter">PREPARING YOUR JOURNEY...</p>
          </div>
        </div>
      )}

      {/* 状态标签 */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-lg px-4 py-2 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
              {i}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-800 leading-none">ROUTE ACTIVE</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{waypoints?.length || 0} WAYPOINTS</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 border border-white/20">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
        Live View
      </div>
    </div>
  );
};

export default MapViewer;
