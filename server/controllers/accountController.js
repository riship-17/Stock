const { getAccountState } = require('../services/tradingService');

exports.getAccount = async (req, res) => {
  try {
    const account = await getAccountState(req.user.id);
    res.json({ success: true, data: account });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};
