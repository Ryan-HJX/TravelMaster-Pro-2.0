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
  externalActiveDay?: number;
  onDayChange?: (day: number) => void;
}

const DAY_COLORS = ['#3b82f6', '#6366f1', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ItineraryMapView({ pois, days, planningScore, amapKey, externalActiveDay, onDayChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(externalActiveDay || 1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Sync with external activeDay
  useEffect(() => {
    if (externalActiveDay && externalActiveDay !== activeDay) {
      setActiveDay(externalActiveDay);
    }
  }, [externalActiveDay]);

  // Load AMap JS API
  useEffect(() => {
    if ((window as any).AMap) {
      setMapLoaded(true);
      return;
    }
    (window as any)._AMapSecurityConfig = {
      securityJsCode: 'c392c3008986a41f69206d2890638682',
    };
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
    script.onload = () => setMapLoaded(true);
    script.onerror = (e) => console.error(">>> [MAP] AMap Script failed:", e);
    document.head.appendChild(script);
  }, [amapKey]);

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const AMap = (window as any).AMap;
    const allItems = days.flatMap(d => d.items).filter(i => i.longitude && i.latitude);
    const center = allItems.length > 0 ? [allItems[0].longitude, allItems[0].latitude] : [116.397, 39.908];
    try {
      mapInstance.current = new AMap.Map(mapRef.current, {
        zoom: 12,
        center,
        mapStyle: 'amap://styles/whitesmoke',
      });
    } catch (e) {
      console.error(">>> [MAP] Failed to create map:", e);
    }
  }, [mapLoaded, days]);

  // Update markers when activeDay changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const AMap = (window as any).AMap;
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    const dayData = days.find((d) => d.day_number === activeDay);
    if (!dayData) return;

    const color = DAY_COLORS[(activeDay - 1) % DAY_COLORS.length];
    const validPoints: any[] = [];

    dayData.items.forEach((item, idx) => {
      if (!item.longitude || !item.latitude) return;
      const position = [item.longitude, item.latitude];
      validPoints.push(new AMap.LngLat(item.longitude, item.latitude));

      const marker = new AMap.Marker({
        position,
        title: item.item_title,
        label: {
          content: `<span style="background:${color};color:#fff;padding:2px 7px;border-radius:10px;font-size:12px;font-weight:600">${idx + 1}</span>`,
          direction: 'top',
          offset: [0, -5],
        },
      });

      // Click to show info window
      marker.on('click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindowRef.current = new AMap.InfoWindow({
          content: `
            <div style="padding:8px 12px;min-width:160px">
              <div style="font-weight:600;font-size:14px;margin-bottom:4px">${item.item_title}</div>
              <div style="font-size:12px;color:#6b7280">📍 ${item.address}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">⏰ ${item.start_time}-${item.end_time}</div>
              ${item.notes ? `<div style="font-size:11px;color:#9ca3af;margin-top:4px">${item.notes}</div>` : ''}
            </div>
          `,
          offset: new AMap.Pixel(0, -30),
        });
        infoWindowRef.open(mapInstance.current, marker.getPosition());
      });

      marker.setMap(mapInstance.current);
      markersRef.current.push(marker);
    });

    // Draw polyline
    if (validPoints.length >= 2) {
      const polyline = new AMap.Polyline({
        path: validPoints,
        strokeColor: color,
        strokeWeight: 4,
        strokeOpacity: 0.7,
        lineJoin: 'round',
        showDir: true,
        borderWeight: 1,
        borderColor: '#ffffff',
      });
      polyline.setMap(mapInstance.current);
      markersRef.current.push(polyline);
    }

    // Fit view
    if (validPoints.length > 0) {
      mapInstance.current.setFitView(markersRef.current, false, [60, 60, 60, 60]);
    }
  }, [activeDay, days, mapLoaded]);

  const handleDaySwitch = (day: number) => {
    setActiveDay(day);
    onDayChange?.(day);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day tabs */}
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-gray-100 overflow-x-auto">
        {days.map((d) => {
          const color = DAY_COLORS[(d.day_number - 1) % DAY_COLORS.length];
          return (
            <button
              key={d.day_number}
              onClick={() => handleDaySwitch(d.day_number)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDay === d.day_number
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={activeDay === d.day_number ? { background: color } : undefined}
            >
              Day {d.day_number}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">地图加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
