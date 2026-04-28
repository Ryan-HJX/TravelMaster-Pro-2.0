interface FinanceSummary {
  budget_analysis?: {
    total_budget: string;
    daily_average?: string;
    budget_level: string;
  };
  cash_reserve?: {
    recommended_amount: string;
    emergency_buffer?: string;
    reasoning: string;
  };
  liquidity_alerts?: Array<{
    type: string;
    reminder: string;
    deadline?: string;
  }>;
  risk_notice?: string;
  data_source?: string;
}

interface Props {
  financeSummary: FinanceSummary | null;
}

export default function TravelBudgetAdvisor({ financeSummary }: Props) {
  if (!financeSummary) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
        <p>暂无资金建议数据</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>AI 规划时会自动生成资金安排建议</p>
      </div>
    );
  }

  const { budget_analysis, cash_reserve, liquidity_alerts, risk_notice, data_source } = financeSummary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>💰 出行资金安排</h3>

      {/* Budget Analysis */}
      {budget_analysis && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>📊 预算分析</div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <div>
              <span style={{ color: '#6b7280' }}>总预算: </span>
              <span style={{ fontWeight: 600 }}>{budget_analysis.total_budget}</span>
            </div>
            {budget_analysis.daily_average && (
              <div>
                <span style={{ color: '#6b7280' }}>日均: </span>
                <span style={{ fontWeight: 600 }}>{budget_analysis.daily_average}</span>
              </div>
            )}
            <div>
              <span style={{ color: '#6b7280' }}>级别: </span>
              <span style={{ fontWeight: 600 }}>{budget_analysis.budget_level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Reserve */}
      {cash_reserve && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>🏦 现金预留建议</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            建议预留: <span style={{ fontWeight: 600, color: '#16a34a' }}>{cash_reserve.recommended_amount}</span>
          </div>
          {cash_reserve.emergency_buffer && (
            <div style={{ fontSize: 13, marginBottom: 4 }}>
              应急金额: <span style={{ fontWeight: 600 }}>{cash_reserve.emergency_buffer}</span>
            </div>
          )}
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{cash_reserve.reasoning}</p>
        </div>
      )}

      {/* Liquidity Alerts */}
      {liquidity_alerts && liquidity_alerts.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>⏰ 赎回时点提醒</div>
          {liquidity_alerts.map((alert, idx) => (
            <div key={idx} style={{ fontSize: 13, marginBottom: 6, paddingLeft: 12, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontWeight: 600 }}>{alert.type}</div>
              <div style={{ color: '#6b7280' }}>{alert.reminder}</div>
              {alert.deadline && <div style={{ color: '#ea580c', fontSize: 12 }}>截止: {alert.deadline}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Risk Notice */}
      {risk_notice && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#991b1b' }}>
          ⚠️ {risk_notice}
        </div>
      )}

      {/* Data Source */}
      {data_source && (
        <div style={{ textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>
          数据来源: {data_source}
        </div>
      )}
    </div>
  );
}
