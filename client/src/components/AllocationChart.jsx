import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currency';
import './AllocationChart.css';

const COLORS = [
  '#4361EE', '#F72585', '#7209B7', '#3A0CA3', '#4CC9F0',
  '#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#073B4C'
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="alloc-tooltip">
      <div className="alloc-tooltip-name">{d.companyName || d.ticker}</div>
      <div className="alloc-tooltip-value">{formatCurrency(d.value, { compact: true })}</div>
      <div className="alloc-tooltip-pct">{formatPercent(d.percentage, 1)}</div>
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, outerRadius, percent, index, name }) => {
  if (percent < 0.05) return null; // hide tiny labels
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-secondary)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function AllocationChart({ allocation = [] }) {
  if (!allocation || allocation.length === 0) {
    return (
      <div className="alloc-empty">No allocation data available.</div>
    );
  }

  return (
    <div className="alloc-chart-wrap">
      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={allocation}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {allocation.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend / breakdown list */}
      <div className="alloc-legend">
        {allocation.slice(0, 8).map((item, i) => (
          <div key={item.ticker || i} className="alloc-legend-item">
            <span className="alloc-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="alloc-name">{item.ticker}</span>
            <span className="alloc-pct">{formatPercent(item.percentage, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
