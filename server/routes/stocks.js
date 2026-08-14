const express = require('express');
const router = express.Router();
const { getStockQuote, getStockHistory, validateStock, compareStocks, searchStock } = require('../controllers/stockController');

router.get('/compare', compareStocks);
router.get('/search', searchStock);
router.get('/:ticker/quote', getStockQuote);
router.get('/:ticker/history', getStockHistory);
router.get('/:ticker/validate', validateStock);

module.exports = router;
