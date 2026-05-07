import React from 'react';
import { Calendar, Wallet, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PlanningScore {
  level: string;
  daily_poi_avg?: number;
  total_transport_minutes?: number;
  total_walking_km?: number;
  reasoning?: string;
}

interface FinanceSummary {
  budget_analysis?: {
    total_budget: string;
    daily_average?: string;
    budget_level: string;
  };
  cash_reserve?: {
    recommended_amount: string;
    reasoning: string;
  };
  risk_notice?: string;
}

interface Props {
  days: number;
  title: string;
  summary: string;
  planningScore?: PlanningScore;
  financeSummary?: FinanceSummary | null;
}

const LEVEL_CONFIG: Record<string, { label: string; percent: number }> = {
  relaxed: { label: '轻松', percent: 30 },
  normal: { label: '适中', percent: 60 },
  tight: { label: '紧凑', percent: 85 },
  infeasible: { label: '不可行', percent: 100 },
};

export default function BudgetOverviewCard({ days, title, summary, planningScore, financeSummary }: Props) {
  const level = LEVEL_CONFIG[planningScore?.level || 'normal'] || LEVEL_CONFIG.normal;

  return (
    <div className="apple-card overflow-hidden">
      <div className="p-6 space-y-5">
        {/* Title & Summary */}
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{title}</h2>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{summary}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} className="mb-1.5" />
            <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{days}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>天行程</span>
          </div>
          {financeSummary?.budget_analysis ? (
            <>
              <div className="flex flex-col items-center p-3.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
                <Wallet size={18} style={{ color: 'var(--primary)' }} className="mb-1.5" />
                <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{financeSummary.budget_analysis.total_budget}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>总预算</span>
              </div>
              <div className="flex flex-col items-center p-3.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} className="mb-1.5" />
                <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{financeSummary.budget_analysis.daily_average}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>日均</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center p-3.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{planningScore?.total_transport_minutes || 0}min</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>总交通</span>
              </div>
              <div className="flex flex-col items-center p-3.5 rounded-xl" style={{ background: 'var(--border-light)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{planningScore?.total_walking_km?.toFixed(1) || 0}km</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>步行距离</span>
              </div>
            </>
          )}
        </div>

        {/* Planning score */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--border-light)' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>行程强度：{level.label}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{level.percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${level.percent}%`, background: 'var(--primary)' }}
              />
            </div>
            {planningScore?.reasoning && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{planningScore.reasoning}</p>
            )}
          </div>
        </div>

        {/* Risk notice */}
        {financeSummary?.risk_notice && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>{financeSummary.risk_notice}</p>
          </div>
        )}
      </div>
    </div>
  );
}
