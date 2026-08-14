const express = require('express');
const router = express.Router();
const { getPortfolios, createPortfolio, updatePortfolio, deletePortfolio } = require('../controllers/portfolioController');
const { getHoldings } = require('../controllers/holdingController');

router.get('/', getPortfolios);
router.post('/', createPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);
router.get('/:id/holdings', getHoldings);

module.exports = router;
