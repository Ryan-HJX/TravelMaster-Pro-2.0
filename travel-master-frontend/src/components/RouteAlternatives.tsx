interface RouteOption {
  from_poi: string;
  to_poi: string;
  options: Array<{ mode: string; duration_minutes: number }>;
  recommended_mode: string;
  recommended_duration_minutes: number;
}

interface Props {
  routeOptions: RouteOption[];
}

const MODE_ICONS: Record<string, string> = {
  driving: '🚗',
  transit: '🚌',
  walking: '🚶',
  cycling: '🚲',
};

const MODE_LABELS: Record<string, string> = {
  driving: '驾车',
  transit: '公交',
  walking: '步行',
  cycling: '骑行',
};

export default function RouteAlternatives({ routeOptions }: Props) {
  if (!routeOptions || routeOptions.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>暂无路线数据</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🗺 路线方案比选</h3>
      {routeOptions.map((route, idx) => (
        <div
          key={idx}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{route.from_poi}</span>
            <span style={{ color: '#9ca3af' }}>→</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{route.to_poi}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {route.options.map((opt, oi) => {
              const isRecommended = opt.mode === route.recommended_mode;
              return (
                <div
                  key={oi}
                  style={{
                    flex: '1 1 120px',
                    border: isRecommended ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: isRecommended ? '#eff6ff' : '#fafafa',
                    position: 'relative',
                  }}
                >
                  {isRecommended && (
                    <span style={{
                      position: 'absolute', top: -8, right: 8,
                      background: '#3b82f6', color: '#fff', fontSize: 10,
                      padding: '1px 8px', borderRadius: 10,
                    }}>
                      推荐
                    </span>
                  )}
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{MODE_ICONS[opt.mode] || '🚀'}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{MODE_LABELS[opt.mode] || opt.mode}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{opt.duration_minutes} 分钟</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
