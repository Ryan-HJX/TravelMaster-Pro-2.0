import React from 'react';
import { Footprints, TrainFront, Car, Bike, Bus, Ship } from 'lucide-react';

interface TransportData {
  from_poi: string;
  to_poi: string;
  mode: string;
  duration_minutes: number;
}

interface Props {
  transport: TransportData;
}

const MODE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  walking: { icon: Footprints, label: '步行' },
  subway: { icon: TrainFront, label: '地铁' },
  bus: { icon: Bus, label: '公交' },
  taxi: { icon: Car, label: '打车' },
  driving: { icon: Car, label: '驾车' },
  bike: { icon: Bike, label: '骑行' },
  ferry: { icon: Ship, label: '轮渡' },
};

export default function TransportConnector({ transport }: Props) {
  const config = MODE_CONFIG[transport.mode] || { icon: Footprints, label: transport.mode };
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      {/* Left: dashed line */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        <div className="w-0 flex-1 border-l-2 border-dashed" style={{ borderColor: 'var(--border-color)' }} />
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)' }}>
          <Icon size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="w-0 flex-1 border-l-2 border-dashed" style={{ borderColor: 'var(--border-color)' }} />
      </div>

      {/* Right: transport label */}
      <div className="flex-1 flex items-center py-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--border-light)', border: '1px solid var(--border-color)' }}>
          <Icon size={13} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{config.label}</span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{transport.duration_minutes}分钟</span>
        </div>
      </div>
    </div>
  );
}
