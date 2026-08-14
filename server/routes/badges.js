const express = require('express');
const router = express.Router();
const { getBadges, evaluateBadges } = require('../controllers/badgeController');

router.get('/', getBadges);
router.post('/evaluate', evaluateBadges);

module.exports = router;
