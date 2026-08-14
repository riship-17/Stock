const Alert = require('../models/Alert');
const { getBulkQuotes } = require('../services/yahooFinanceService');

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    if (alerts.length === 0) return res.json({ success: true, data: [] });

    const tickers = [...new Set(alerts.filter((a) => a.active).map((a) => a.ticker))];
    let quotesMap = {};
    if (tickers.length > 0) quotesMap = await getBulkQuotes(tickers);

    const enriched = alerts.map((a) => {
      const q = quotesMap[a.ticker];
      let triggered = a.triggeredAt != null;
      if (a.active && q && q.regularMarketPrice) {
        const px = q.regularMarketPrice;
        if (
          (a.condition === 'above' && px >= a.targetPrice) ||
          (a.condition === 'below' && px <= a.targetPrice)
        ) {
          triggered = true;
        }
      }
      return {
        ...a.toObject(),
        currentPrice: q && q.regularMarketPrice ? q.regularMarketPrice : null,
        live: q && q.regularMarketPrice ? true : false,
        justTriggered:
          triggered &&
          a.triggeredAt == null,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { ticker, condition, targetPrice, channel, note } = req.body;
    if (!ticker || !condition || targetPrice == null) {
      return res.status(400).json({
        success: false,
        error: 'ticker, condition and targetPrice are required',
      });
    }
    if (!['above', 'below'].includes(condition)) {
      return res.status(400).json({ success: false, error: 'condition must be above or below' });
    }

    let companyName = req.body.companyName || '';
    if (!companyName) {
      try {
        const { validateTicker } = require('../services/yahooFinanceService');
        const v = await validateTicker(ticker);
        if (v.valid) companyName = v.shortName || ticker.toUpperCase();
      } catch (_) {
        companyName = ticker.toUpperCase();
      }
    }

    const alert = await Alert.create({
      userId: req.user.id,
      ticker: ticker.toUpperCase(),
      companyName,
      condition,
      targetPrice: parseFloat(targetPrice),
      channel: channel === 'email' ? 'email' : 'inapp',
      note: note || '',
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    alert.active = !alert.active;
    if (alert.active) alert.triggeredAt = null;
    await alert.save();
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.evaluateAlerts = async (req, res) => {
  try {
    const activeAlerts = await Alert.find({ userId: req.user.id, active: true });
    if (activeAlerts.length === 0) {
      return res.json({ success: true, data: { triggered: [], evaluated: 0 } });
    }

    const tickers = [...new Set(activeAlerts.map((a) => a.ticker))];
    const quotesMap = await getBulkQuotes(tickers);

    const triggered = [];
    for (const a of activeAlerts) {
      const q = quotesMap[a.ticker];
      if (!q || !q.regularMarketPrice) continue;
      const px = q.regularMarketPrice;
      const hit =
        (a.condition === 'above' && px >= a.targetPrice) ||
        (a.condition === 'below' && px <= a.targetPrice);
      if (hit) {
        triggered.push({
          _id: a._id,
          ticker: a.ticker,
          companyName: a.companyName,
          condition: a.condition,
          targetPrice: a.targetPrice,
          currentPrice: px,
        });
        if (a.triggeredAt == null) {
          a.triggeredAt = new Date();
          await a.save();
        }
      }
    }

    res.json({
      success: true,
      data: { triggered, evaluated: activeAlerts.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
