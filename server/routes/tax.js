const express = require('express');
const router = express.Router();
const { getCapitalGains, getStatementPdf } = require('../controllers/taxController');

router.get('/capital-gains', getCapitalGains);
router.get('/statement.pdf', getStatementPdf);

module.exports = router;
