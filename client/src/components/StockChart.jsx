import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
  ComposedChart, Bar, Cell,
} from 'recharts';
import { useStockHistory, useCompareStocks } from '../hooks/useStockData';
import { formatChartDate } from '../utils/dateHelpers';
import { formatCurrency, formatPercent } from '../utils/currency';
import { getCompareColor } from '../utils/calculations';
import { rsi as calcRsi, macd as calcMacd } from '../utils/indicators';
import { SkeletonChart } from './SkeletonLoader';
import CandlestickChart from './CandlestickChart';
import './StockChart.css';

const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

const CustomTooltip = ({ active, payload, label, range, isCompare }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{formatChartDate(label, range)}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="chart-tooltip-row" style={{ color: entry.color }}>
          <span className="chart-tooltip-name">{entry.name}</span>
          <span className="chart-tooltip-value">
            {isCompare
              ? formatPercent(entry.value, 2, true)
              : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

function SingleChart({ ticker, range }) {
  const { data, stats, loading, error } = useStockHistory(ticker, range);

  if (loading) return <SkeletonChart height={280} />;

  if (error || !data) {
    return (
      <div className="chart-error">
        {error || 'Chart data unavailable for this range.'}
      </div>
    );
  }

  const isPositive = stats?.periodChangePercent >= 0;
  const chartColor = isPositive ? 'var(--gain)' : 'var(--loss)';
  const gradientId = `grad-${ticker.replace(/[^a-z0-9]/gi, '')}`;

  const chartData = data.map((d) => ({
    date: d.date,
    price: d.close,
  }));

  return (
    <>
      {stats && (
        <div className="chart-stats">
          <div className="chart-stat">
            <span className="chart-stat-label">Range Change</span>
            <span className={`chart-stat-value ${isPositive ? 'gain-text' : 'loss-text'}`}>
              {formatPercent(stats.periodChangePercent)}
            </span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-label">Period High</span>
            <span className="chart-stat-value">{formatCurrency(stats.periodHigh)}</span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-label">Period Low</span>
            <span className="chart-stat-value">{formatCurrency(stats.periodLow)}</span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-label">Avg Volume</span>
            <span className="chart-stat-value">
              {stats.averageVolume ? (stats.averageVolume / 1e5).toFixed(2) + 'L' : '—'}
            </span>
          </div>
          {stats.annualizedVolatility && (
            <div className="chart-stat">
              <span className="chart-stat-label">Volatility (Ann.)</span>
              <span className="chart-stat-value">{stats.annualizedVolatility?.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatChartDate(v, range)}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={60}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip range={range} />} />
          <Area
            type="monotone"
            dataKey="price"
            name={ticker}
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: chartColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function CompareChart({ tickers, range }) {
  const { data, loading, error } = useCompareStocks(tickers, range);

  if (loading) return <SkeletonChart height={280} />;
  if (error) return <div className="chart-error">{error}</div>;

  const dateSet = new Map();
  data.forEach((stock) => {
    if (!stock.data) return;
    stock.data.forEach((point) => {
      const d = new Date(point.date).toISOString().split('T')[0];
      if (!dateSet.has(d)) dateSet.set(d, { date: d });
      dateSet.get(d)[stock.ticker] = point.normalizedClose;
    });
  });

  const chartData = Array.from(dateSet.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatChartDate(v, range)}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip range={range} isCompare />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
        />
        {data.map((stock, i) => (
          <Line
            key={stock.ticker}
            type="monotone"
            dataKey={stock.ticker}
            stroke={getCompareColor(i)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CandleView({ ticker, range, showMA20, showMA50, showRSI, showMACD }) {
  const { data, loading, error } = useStockHistory(ticker, range);

  if (loading) return <SkeletonChart height={320} />;
  if (error || !data) {
    return <div className="chart-error">{error || 'Candle data unavailable for this range.'}</div>;
  }

  const closes = data.map((d) => d.close);
  const rsiArr = calcRsi(closes, 14);
  const { macd, signal, histogram } = calcMacd(closes);

  const rsiData = data
    .map((d, i) => ({ date: d.date, rsi: rsiArr[i] }))
    .filter((p) => p.rsi != null);

  const macdData = data
    .map((d, i) => ({
      date: d.date,
      macd: macd[i],
      signal: signal[i],
      histogram: histogram[i],
    }))
    .filter((p) => p.macd != null && p.signal != null);

  return (
    <>
      <CandlestickChart data={data} showMA20={showMA20} showMA50={showMA50} />
      <div className="legend-row">
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#3B82F6' }} /> MA20</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: '#F59E0B' }} /> MA50</span>
      </div>

      {showRSI && rsiData.length > 0 && (
        <div className="indicator-pane">
          <div className="indicator-pane-title">RSI (14)</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={rsiData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={false} tickLine={false} height={0} />
              <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={32} axisLine={false} tickLine={false} />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22C55E" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" stroke="#7C3AED" dot={false} strokeWidth={1.6} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {showMACD && macdData.length > 0 && (
        <div className="indicator-pane">
          <div className="indicator-pane-title">MACD (12, 26, 9)</div>
          <ResponsiveContainer width="100%" height={110}>
            <ComposedChart data={macdData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={false} tickLine={false} height={0} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={42} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="histogram">
                {macdData.map((p, i) => (
                  <Cell key={i} fill={p.histogram >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#3B82F6" dot={false} strokeWidth={1.4} />
              <Line type="monotone" dataKey="signal" stroke="#F59E0B" dot={false} strokeWidth={1.4} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

export default function StockChart({ ticker, compareTickers = [] }) {
  const [range, setRange] = useState('3M');
  const [compareMode, setCompareMode] = useState(false);
  const [compareInput, setCompareInput] = useState('');
  const [compareList, setCompareList] = useState([]);
  const [chartType, setChartType] = useState('area');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  const addCompare = () => {
    const t = compareInput.trim().toUpperCase();
    if (t && !compareList.includes(t) && compareList.length < 2) {
      setCompareList((prev) => [...prev, t]);
      setCompareInput('');
    }
  };

  const removeCompare = (t) => setCompareList((prev) => prev.filter((x) => x !== t));

  return (
    <div className="stock-chart">
      <div className="stock-chart-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            {RANGES.map((r) => (
              <button
                key={r}
                className={`tab${range === r ? ' active' : ''}`}
                onClick={() => setRange(r)}
                id={`range-tab-${r}`}
              >
                {r}
              </button>
            ))}
          </div>
          {!compareMode && (
            <div className="tabs">
              <button
                className={`tab${chartType === 'area' ? ' active' : ''}`}
                onClick={() => setChartType('area')}
              >Area</button>
              <button
                className={`tab${chartType === 'candle' ? ' active' : ''}`}
                onClick={() => setChartType('candle')}
              >Candles</button>
            </div>
          )}
        </div>

        <button
          className={`btn btn-sm ${compareMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCompareMode((v) => !v)}
          id="compare-mode-btn"
        >
          ⇌ Compare
        </button>
      </div>

      {chartType === 'candle' && !compareMode && (
        <div className="indicator-bar">
          <button
            className={`chip${showMA20 ? ' active' : ''}`}
            onClick={() => setShowMA20((v) => !v)}
          >MA20</button>
          <button
            className={`chip${showMA50 ? ' active' : ''}`}
            onClick={() => setShowMA50((v) => !v)}
          >MA50</button>
          <button
            className={`chip${showRSI ? ' active' : ''}`}
            onClick={() => setShowRSI((v) => !v)}
          >RSI</button>
          <button
            className={`chip${showMACD ? ' active' : ''}`}
            onClick={() => setShowMACD((v) => !v)}
          >MACD</button>
        </div>
      )}

      {compareMode && (
        <div className="compare-bar">
          <div className="chip-row">
            <span className="badge badge-accent">{ticker}</span>
            {compareList.map((t) => (
              <span key={t} className="badge badge-neutral">
                {t}
                <button
                  onClick={() => removeCompare(t)}
                  style={{ marginLeft: 4, cursor: 'pointer', background: 'none', border: 'none', fontSize: 11 }}
                >✕</button>
              </span>
            ))}
          </div>
          {compareList.length < 2 && (
            <div className="compare-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="Add ticker (e.g. TCS.NS)"
                value={compareInput}
                onChange={(e) => setCompareInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addCompare()}
                style={{ height: 34, fontSize: 13 }}
                id="compare-ticker-input"
              />
              <button className="btn btn-secondary btn-sm" onClick={addCompare}>Add</button>
            </div>
          )}
        </div>
      )}

      <div className="stock-chart-area">
        {compareMode && compareList.length > 0 ? (
          <CompareChart tickers={[ticker, ...compareList]} range={range} />
        ) : chartType === 'candle' ? (
          <CandleView
            ticker={ticker}
            range={range}
            showMA20={showMA20}
            showMA50={showMA50}
            showRSI={showRSI}
            showMACD={showMACD}
          />
        ) : (
          <SingleChart ticker={ticker} range={range} />
        )}
      </div>
    </div>
  );
}
