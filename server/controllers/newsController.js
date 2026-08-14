const { getNews } = require('../services/newsService');

exports.getMarketNews = async (req, res) => {
  try {
    const { ticker, category } = req.query;
    const items = await getNews({ ticker, category });
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
