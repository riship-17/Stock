import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateHelpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--text-primary)', color: 'white',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>
        {formatDate(label)}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16 }}>
        {formatCurrency(payload[0].value, { compact: true })}
      </div>
    </div>
  );
};

export default function PortfolioTrendChart({ data = [] }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Not enough historical data to show trend.
      </div>
    );
  }

  const firstVal = data[0]?.value;
  const lastVal = data[data.length - 1]?.value;
  const isPositive = lastVal >= firstVal;
  const color = isPositive ? 'var(--gain)' : 'var(--loss)';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v, { month: 'short', year: '2-digit' })}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false} tickLine={false}
          width={50}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#trend-gradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
