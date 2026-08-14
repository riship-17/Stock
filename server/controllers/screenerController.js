const { screen } = require('../services/screenerService');

exports.getScreener = async (req, res) => {
  try {
    const data = await screen(req.query || {});
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
