import React from 'react';
import { Plane, TrainFront, Clock, ArrowRight, Banknote, Lightbulb } from 'lucide-react';

interface InterCityTransport {
  mode: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  duration_hours: number;
  price_estimate: number;
  carrier: string;
  flight_number: string;
  booking_tips: string;
}

interface TransportPlan {
  outbound?: InterCityTransport | null;
  return_trip?: InterCityTransport | null;
  total_cost: number;
  recommendations: string[];
}

interface Props {
  transportPlan: TransportPlan;
}

function TransportSegment({ label, data }: { label: string; data: InterCityTransport }) {
  const isFlight = data.mode === 'flight';
  const ModeIcon = isFlight ? Plane : TrainFront;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border-light)' }}>
          <ModeIcon size={20} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text-main)' }}>
            <span>{data.departure_city}</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
            <span>{data.arrival_city}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.flight_number && <span className="font-medium">{data.carrier} {data.flight_number}</span>}
            {data.duration_hours > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock size={11} />
                {data.duration_hours}h
              </span>
            )}
            {data.price_estimate > 0 && (
              <span className="flex items-center gap-0.5">
                <Banknote size={11} />
                ~{data.price_estimate}元
              </span>
            )}
          </div>
          {data.departure_time && data.arrival_time && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {data.departure_time} → {data.arrival_time}
            </div>
          )}
          {data.booking_tips && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{data.booking_tips}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransportPlanCard({ transportPlan }: Props) {
  if (!transportPlan || (!transportPlan.outbound && !transportPlan.return_trip)) return null;

  return (
    <div className="apple-card overflow-hidden">
      <div className="p-5 space-y-4">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>大交通方案</h3>

        <div className="flex gap-6 flex-wrap">
          {transportPlan.outbound && (
            <TransportSegment label="去程" data={transportPlan.outbound} />
          )}
          {transportPlan.return_trip && (
            <TransportSegment label="返程" data={transportPlan.return_trip} />
          )}
        </div>

        {transportPlan.total_cost > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>往返预估</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>~{transportPlan.total_cost} 元</span>
          </div>
        )}

        {transportPlan.recommendations.length > 0 && (
          <div className="space-y-1.5">
            {transportPlan.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Lightbulb size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#FF9500' }} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
