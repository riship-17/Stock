const express = require('express');
const router = express.Router();
const { getScreener } = require('../controllers/screenerController');

router.get('/', getScreener);

module.exports = router;
