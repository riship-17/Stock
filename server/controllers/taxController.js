const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Holding = require('../models/Holding');
const { getCapitalGains } = require('../services/taxService');
const { getBulkQuotes } = require('../services/yahooFinanceService');
const { calcPortfolioSummary } = require('../services/analyticsService');

const ROUND = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const inr = (n) =>
  (n < 0 ? '-' : '') +
  '₹' +
  Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

exports.getCapitalGains = async (req, res) => {
  try {
    const { fy } = req.query;
    let data = await getCapitalGains(req.user.id);
    if (fy) {
      const [startYear] = String(fy).split('-');
      const start = new Date(`04-01-${startYear}`);
      const end = new Date(`03-31-${Number(startYear) + 1}`);
      end.setHours(23, 59, 59, 999);
      data = {
        ...data,
        matches: data.matches.filter(
          (m) => m.sellDate >= start && m.sellDate <= end
        ),
        fiscalYear: String(fy),
      };
      const stg = data.matches
        .filter((m) => m.term === 'short')
        .reduce((s, m) => s + m.gain, 0);
      const ltg = data.matches
        .filter((m) => m.term === 'long')
        .reduce((s, m) => s + m.gain, 0);
      data.summary = {
        ...data.summary,
        shortTermGain: ROUND(stg),
        longTermGain: ROUND(ltg),
        shortTermCount: data.matches.filter((m) => m.term === 'short').length,
        longTermCount: data.matches.filter((m) => m.term === 'long').length,
        totalRealizedGain: ROUND(stg + ltg),
      };
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStatementPdf = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email startingCash virtualCash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const [transactions, gains] = await Promise.all([
      Transaction.find({ userId: req.user.id }).sort({ date: -1 }).populate('portfolioId', 'name'),
      getCapitalGains(req.user.id),
    ]);

    const holdings = await Holding.find({ userId: req.user.id });
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const quotesMap = tickers.length ? await getBulkQuotes(tickers) : {};
    const summary = calcPortfolioSummary(holdings, quotesMap);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finvault-statement-${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc
      .fontSize(22)
      .fillColor('#F97316')
      .font('Helvetica-Bold')
      .text('FinVault', 50, 50);
    doc
      .fontSize(12)
      .fillColor('#6B7280')
      .font('Helvetica')
      .text('Paper Trading — Account Statement', 50, 78);

    doc.moveDown(1.2);
    doc
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(`Name: `, { continued: true })
      .font('Helvetica')
      .text(user.name);
    doc
      .font('Helvetica-Bold')
      .text(`Email: `, { continued: true })
      .font('Helvetica')
      .text(user.email);
    doc
      .font('Helvetica-Bold')
      .text(`Generated: `, { continued: true })
      .font('Helvetica')
      .text(new Date().toLocaleString('en-IN'));

    doc.moveDown(0.8);
    doc
      .fontSize(13)
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .text('Account Summary');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.moveDown(0.4);
    const acctLines = [
      ['Starting virtual cash', inr(user.startingCash)],
      ['Current virtual cash', inr(user.virtualCash)],
      ['Invested value (live)', inr(summary.totalCurrentValue || 0)],
      ['Realized gains (all-time)', inr(gains.summary.totalRealizedGain)],
      ['Total trades', String(transactions.length)],
    ];
    acctLines.forEach(([k, v]) => {
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#374151')
        .text(k, 50, doc.y, { width: 280 })
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text(v, 330, doc.y - 13, { width: 215, align: 'right' });
    });

    doc.moveDown(1.2);
    doc
      .fontSize(13)
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .text('Capital Gains');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.moveDown(0.4);
    [
      ['Short-term gains', inr(gains.summary.shortTermGain), `${gains.summary.shortTermCount} sells`],
      ['Long-term gains', inr(gains.summary.longTermGain), `${gains.summary.longTermCount} sells`],
      ['Total realized gain', inr(gains.summary.totalRealizedGain), ''],
    ].forEach(([k, v, n]) => {
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#374151')
        .text(k, 50, doc.y, { width: 220 })
        .font('Helvetica-Bold')
        .fillColor(gains.summary.shortTermGain >= 0 ? '#15803D' : '#DC2626')
        .text(v, 270, doc.y - 13, { width: 160, align: 'right' })
        .font('Helvetica')
        .fillColor('#9CA3AF')
        .fontSize(10)
        .text(n, 430, doc.y - 12, { width: 115, align: 'right' });
      doc.fontSize(11);
    });

    doc.moveDown(1.2);
    doc
      .fontSize(13)
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .text('Transaction History');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.moveDown(0.4);

    const rowY = doc.y;
    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .font('Helvetica-Bold')
      .text('Date', 50, rowY, { width: 80 })
      .text('Stock', 130, rowY, { width: 150 })
      .text('Type', 280, rowY, { width: 40 })
      .text('Qty', 322, rowY, { width: 50, align: 'right' })
      .text('Price', 372, rowY, { width: 70, align: 'right' })
      .text('Total', 442, rowY, { width: 100, align: 'right' });
    doc.moveDown(0.6);

    transactions.slice(0, 60).forEach((t) => {
      if (doc.y > 780) {
        doc.addPage();
      }
      const y = doc.y;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#374151')
        .text(new Date(t.date).toLocaleDateString('en-IN'), 50, y, { width: 80 })
        .text(`${t.companyName || t.ticker} (${t.ticker})`, 130, y, { width: 150, ellipsis: true })
        .fillColor(t.type === 'buy' ? '#15803D' : '#DC2626')
        .font('Helvetica-Bold')
        .text(t.type.toUpperCase(), 280, y, { width: 40 })
        .font('Helvetica')
        .fillColor('#374151')
        .text(String(t.quantity), 322, y, { width: 50, align: 'right' })
        .text(inr(t.price), 372, y, { width: 70, align: 'right' })
        .font('Helvetica-Bold')
        .text(inr(t.price * t.quantity), 442, y, { width: 100, align: 'right' });
      doc.moveDown(0.45);
    });

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .font('Helvetica-Oblique')
      .text(
        'This is a simulated paper-trading statement for educational purposes only. No real securities or money are involved.',
        { width: 495, align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('[Tax/PDF]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
