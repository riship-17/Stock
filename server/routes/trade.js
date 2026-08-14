const express = require('express');
const router = express.Router();
const { buy, sell, reset } = require('../controllers/tradeController');

router.post('/buy', buy);
router.post('/sell', sell);
router.post('/reset', reset);

module.exports = router;
