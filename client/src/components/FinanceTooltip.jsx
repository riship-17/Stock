import { useState } from 'react';

const TOOLTIPS = {
  volatility: 'Standard deviation of daily returns. Higher = more price swings. Annualized for comparability.',
  realizedGain: 'Profit/loss from stocks you have already sold. Taxable event in India.',
  unrealizedGain: 'Paper profit/loss on stocks you still hold. Not taxable until sold.',
  ltcg: 'Long Term Capital Gain — held > 1 year. Taxed at 10% above ₹1L in India.',
  stcg: 'Short Term Capital Gain — held ≤ 1 year. Taxed at 15% in India.',
  pe: 'Price-to-Earnings ratio. How much investors pay per ₹1 of earnings.',
  marketCap: 'Total market value of a company\'s outstanding shares.',
  avgVolume: 'Average number of shares traded per day over the selected period.',
  portfolioPnL: 'Difference between current value and total amount invested.',
  allocation: 'Percentage of your total portfolio value held in each stock.',
};

export default function FinanceTooltip({ term, children }) {
  const [visible, setVisible] = useState(false);
  const text = TOOLTIPS[term] || term;

  return (
    <span
      className="tooltip-wrapper"
      style={{ gap: '4px', display: 'inline-flex', alignItems: 'center' }}
    >
      {children}
      <span
        className="tooltip-trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label={`Explanation: ${text}`}
      >
        ?
      </span>
      {visible && <span className="tooltip-box" role="tooltip">{text}</span>}
    </span>
  );
}
