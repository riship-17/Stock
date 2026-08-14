const express = require('express');
const router = express.Router();
const { getMarketNews } = require('../controllers/newsController');

router.get('/', getMarketNews);

module.exports = router;
