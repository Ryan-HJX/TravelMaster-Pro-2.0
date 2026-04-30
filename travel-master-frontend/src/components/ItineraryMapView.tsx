import { useEffect, useRef, useState } from 'react';

interface MapPOI {
  name: string;
  longitude: number;
  latitude: number;
  poi_type: string;
  address: string;
}

interface DayRoute {
  day_number: number;
  title: string;
  items: Array<{
    item_title: string;
    longitude: number;
    latitude: number;
    start_time: string;
    end_time: string;
    activity_type: string;
    address: string;
    transport?: { mode: string; duration_minutes: number };
    notes: string;
  }>;
  weather?: { weather: string; temperature_high: string; temperature_low: string; advice: string };
}

interface Props {
  pois: MapPOI[];
  days: DayRoute[];
  planningScore: { level: string; reasoning: string; daily_poi_avg: number; total_transport_minutes: number };
  amapKey: string;
}

const SCORE_COLORS: Record<string, string> = {
  relaxed: '#22c55e',
  normal: '#3b82f6',
  tight: '#f59e0b',
  infeasible: '#ef4444',
};

const SCORE_LABELS: Record<string, string> = {
  relaxed: '轻松',
  normal: '适中',
  tight: '紧凑',
  infeasible: '不可执行',
};

export default function ItineraryMapView({ pois, days, planningScore, amapKey }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load AMap JS API
  useEffect(() => {
    if ((window as any).AMap) {
      setMapLoaded(true);
      return;
    }
    // AMap v2.0 Security Config
    (window as any)._AMapSecurityConfig = {
      securityJsCode: 'c392c3008986a41f69206d2890638682', // Placeholder or matching key
    };
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
    script.onload = () => {
      console.log(">>> [MAP] AMap Script loaded successfully");
      setMapLoaded(true);
    };
    script.onerror = (e) => console.error(">>> [MAP] AMap Script failed to load:", e);
    document.head.appendChild(script);
  }, [amapKey]);

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const AMap = (window as any).AMap;
    console.log(">>> [MAP] Initializing with POIs:", pois.length);
    if (pois.length > 0) {
      console.log(">>> [MAP] First POI:", pois[0].name, pois[0].longitude, pois[0].latitude);
    }
    const center = pois.length > 0 && pois[0].longitude ? [pois[0].longitude, pois[0].latitude] : [116.397, 39.908];
    try {
      mapInstance.current = new AMap.Map(mapRef.current, {
        zoom: 12,
        center,
        mapStyle: 'amap://styles/whitesmoke',
      });
    } catch (e) {
      console.error(">>> [MAP] Failed to create map instance:", e);
    }
  }, [mapLoaded, pois]);

  // Update markers when activeDay changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const AMap = (window as any).AMap;
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    const dayData = days.find((d) => d.day_number === activeDay);
    if (!dayData) return;

    // Collect valid points for polyline
    const validPoints: any[] = [];

    dayData.items.forEach((item, idx) => {
      if (!item.longitude || !item.latitude) return;
      
      const position = [item.longitude, item.latitude];
      validPoints.push(new AMap.LngLat(item.longitude, item.latitude));
      
      const marker = new AMap.Marker({
        position: position,
        title: item.item_title,
        label: { content: `<span style="background:#3b82f6;color:#fff;padding:2px 6px;border-radius:10px;font-size:12px">${idx + 1}</span>`, direction: 'top' },
      });
      marker.setMap(mapInstance.current);
      markersRef.current.push(marker);
    });

    // Draw polyline connecting all points
    if (validPoints.length >= 2) {
      const polyline = new AMap.Polyline({
        path: validPoints,
        strokeColor: "#3b82f6",
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineJoin: 'round',
        showDir: true,
        borderWeight: 1,
        borderColor: '#ffffff',
      });
      polyline.setMap(mapInstance.current);
      markersRef.current.push(polyline);
    }

    if (dayData.items.length > 0) {
      const first = dayData.items[0];
      if (first.longitude && first.latitude) {
        mapInstance.current.setCenter([first.longitude, first.latitude]);
      }
    }
  }, [activeDay, days, mapLoaded]);

  const currentDay = days.find((d) => d.day_number === activeDay);
  const scoreColor = SCORE_COLORS[planningScore.level] || '#6b7280';

  return (
    <div style={{ display: 'flex', gap: 16, height: 600 }}>
      {/* Map Container */}
      <div style={{ flex: 2, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        {/* Fallback Map (visible if JS API fails) */}
        {!mapLoaded && pois.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ 
              width: '200px', 
              height: '200px', 
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              marginBottom: 16 
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>📍 {pois[0].name}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: '300px' }}>
              地图加载中... 请检查网络连接或稍后重试
            </p>
            <div style={{ marginTop: 16, padding: '8px 16px', background: '#eff6ff', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>📍 行程地点</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                {pois.slice(0, 3).map((poi, idx) => (
                  <div key={idx}>{idx + 1}. {poi.name}</div>
                ))}
                {pois.length > 3 && <div>... 共 {pois.length} 个地点</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Score badge */}
        <div style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}40`, borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: scoreColor, color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
              {SCORE_LABELS[planningScore.level] || planningScore.level}
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>可执行性评分</span>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{planningScore.reasoning}</p>
        </div>

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {days.map((d) => (
            <button
              key={d.day_number}
              onClick={() => setActiveDay(d.day_number)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: activeDay === d.day_number ? '#3b82f6' : '#f3f4f6',
                color: activeDay === d.day_number ? '#fff' : '#374151',
              }}
            >
              Day {d.day_number}
            </button>
          ))}
        </div>

        {/* Weather card */}
        {currentDay?.weather && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
            <span>🌤 {currentDay.weather.weather}</span>
            <span style={{ marginLeft: 8, color: '#6b7280' }}>
              {currentDay.weather.temperature_high}/{currentDay.weather.temperature_low}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{currentDay.weather.advice}</p>
          </div>
        )}

        {/* Items list */}
        {currentDay?.items.map((item, idx) => (
          <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {idx + 1}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item.item_title}</span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>
              ⏰ {item.start_time}-{item.end_time} | 📍 {item.address}
            </p>
            {item.transport && (
              <p style={{ fontSize: 12, color: '#3b82f6', margin: '2px 0' }}>
                🚌 {item.transport.mode} · {item.transport.duration_minutes}分钟
              </p>
            )}
            {item.notes && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0' }}>{item.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
