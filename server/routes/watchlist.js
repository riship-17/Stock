const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist, convertToBuy } = require('../controllers/watchlistController');

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:id', removeFromWatchlist);
router.post('/:id/buy', convertToBuy);

module.exports = router;
