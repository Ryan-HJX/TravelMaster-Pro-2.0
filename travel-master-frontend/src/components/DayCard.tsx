import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cloud, Sun, CloudRain, CloudSnow, Hotel, Banknote, Star, Bookmark } from 'lucide-react';
import TimelineItem from './TimelineItem';
import TransportConnector from './TransportConnector';

interface WeatherData {
  weather: string;
  temperature_high: string;
  temperature_low: string;
  is_outdoor_friendly: boolean;
  advice?: string;
}

interface DayItem {
  sequence_number: number;
  item_title: string;
  activity_type: string;
  address: string;
  start_time: string;
  end_time: string;
  transport?: {
    from_poi: string;
    to_poi: string;
    mode: string;
    duration_minutes: number;
  };
  notes?: string;
}

interface HotelRecommendation {
  name: string;
  address?: string;
  estimated_price?: string;
  star_rating?: string;
  highlights?: string;
  booking_tip?: string;
}

interface DayData {
  day_number: number;
  title: string;
  weather?: WeatherData;
  items: DayItem[];
  hotel?: HotelRecommendation;
}

interface Props {
  day: DayData;
  isActive?: boolean;
  onDayClick?: (dayNumber: number) => void;
}

function WeatherIcon({ weather }: { weather: string }) {
  const style = { color: 'var(--text-muted)' };
  if (weather.includes('雨')) return <CloudRain size={14} style={{ color: '#007AFF' }} />;
  if (weather.includes('雪')) return <CloudSnow size={14} style={{ color: '#8E8E93' }} />;
  if (weather.includes('云') || weather.includes('阴')) return <Cloud size={14} style={style} />;
  return <Sun size={14} style={{ color: '#FF9500' }} />;
}

export default function DayCard({ day, isActive, onDayClick }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      id={`day-${day.day_number}`}
      className="apple-card overflow-hidden transition-all duration-200"
      style={{
        borderColor: isActive ? 'var(--primary)' : undefined,
        boxShadow: isActive ? '0 0 0 1px var(--primary)' : undefined,
      }}
    >
      {/* Header */}
      <button
        onClick={() => {
          setExpanded(!expanded);
          onDayClick?.(day.day_number);
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{
              background: isActive ? 'var(--primary)' : 'var(--border-light)',
              color: isActive ? 'white' : 'var(--text-secondary)',
            }}
          >
            {day.day_number}
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
              {day.title || `第 ${day.day_number} 天`}
            </h3>
            {day.weather && (
              <div className="flex items-center gap-2 mt-1">
                <WeatherIcon weather={day.weather.weather} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {day.weather.weather} {day.weather.temperature_high}°/{day.weather.temperature_low}°
                </span>
                {day.weather.advice && (
                  <span className="text-[11px] ml-1" style={{ color: 'var(--text-muted)' }}>· {day.weather.advice}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-0">
              {day.items.map((item, idx) => (
                <React.Fragment key={item.sequence_number || idx}>
                  <TimelineItem item={item} isLast={idx === day.items.length - 1} />
                  {item.transport && idx < day.items.length - 1 && (
                    <TransportConnector transport={item.transport} />
                  )}
                </React.Fragment>
              ))}
              {day.items.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  暂无行程安排
                </div>
              )}

              {/* Hotel Recommendation */}
              {day.hotel && (
                <div className="mt-3 ml-[4.5rem] rounded-xl p-4" style={{ background: 'var(--primary-light)', border: '1px solid rgba(0,122,255,0.12)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Hotel size={16} style={{ color: 'var(--primary)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>住宿推荐</span>
                    {day.hotel.star_rating && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{day.hotel.star_rating}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{day.hotel.name}</p>
                  {day.hotel.address && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{day.hotel.address}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {day.hotel.estimated_price && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ color: 'var(--primary)', background: 'rgba(0,122,255,0.08)' }}>
                        <Banknote size={11} /> {day.hotel.estimated_price}
                      </span>
                    )}
                    {day.hotel.highlights && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Star size={11} style={{ color: '#FF9500' }} /> {day.hotel.highlights}
                      </span>
                    )}
                  </div>
                  {day.hotel.booking_tip && (
                    <p className="flex items-start gap-1.5 text-xs mt-2" style={{ color: 'var(--primary)' }}>
                      <Bookmark size={11} className="flex-shrink-0 mt-0.5" />
                      {day.hotel.booking_tip}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
