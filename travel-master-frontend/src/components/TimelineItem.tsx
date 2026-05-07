import React, { useState } from 'react';
import { Landmark, UtensilsCrossed, Bus, ShoppingBag, Hotel, Coffee, MapPin, Banknote, Star, Lightbulb, ChevronDown } from 'lucide-react';

interface TimelineItemData {
  sequence_number: number;
  item_title: string;
  activity_type: string;
  address: string;
  start_time: string;
  end_time: string;
  notes?: string;
  estimated_price?: string;
  highlights?: string;
  tips?: string;
}

interface Props {
  item: TimelineItemData;
  isLast?: boolean;
}

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  sightseeing: { icon: Landmark, label: '景点' },
  restaurant: { icon: UtensilsCrossed, label: '餐饮' },
  transport: { icon: Bus, label: '交通' },
  shopping: { icon: ShoppingBag, label: '购物' },
  hotel: { icon: Hotel, label: '住宿' },
  cafe: { icon: Coffee, label: '咖啡' },
};

export default function TimelineItem({ item, isLast }: Props) {
  const config = ACTIVITY_CONFIG[item.activity_type] || ACTIVITY_CONFIG.sightseeing;
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Left: time + dot */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {item.start_time}
        </span>
        <div className="w-2.5 h-2.5 rounded-full mt-2 z-10" style={{ background: 'var(--primary)', boxShadow: '0 0 0 3px white' }} />
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.end_time}</div>
      </div>

      {/* Right: card */}
      <div className="flex-1 pb-1">
        <div className="apple-card p-4 hover:shadow-apple-md transition-all">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border-light)' }}>
              <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-main)' }}>{item.item_title}</h4>
                {item.estimated_price && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                    <Banknote size={11} />
                    {item.estimated_price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{item.address}</span>
              </div>

              {/* Highlights */}
              {item.highlights && (
                <div className="flex items-start gap-1.5 mt-2.5 text-xs rounded-lg px-3 py-2" style={{ color: 'var(--text-secondary)', background: 'var(--border-light)' }}>
                  <Star size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#FF9500' }} />
                  <span>{item.highlights}</span>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <p className="text-xs mt-2 leading-relaxed rounded-lg px-3 py-2" style={{ color: 'var(--text-secondary)', background: 'var(--border-light)' }}>
                  {item.notes}
                </p>
              )}

              {/* Tips (collapsible) */}
              {item.tips && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2 text-xs transition-colors"
                  style={{ color: 'var(--primary)' }}
                >
                  <Lightbulb size={11} />
                  <span>实用贴士</span>
                  <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              )}
              {expanded && item.tips && (
                <p className="text-xs rounded-lg px-3 py-2 mt-1" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                  {item.tips}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
