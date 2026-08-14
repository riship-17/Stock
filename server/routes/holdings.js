const express = require('express');
const router = express.Router();
const { addHolding, updateHolding, deleteHolding } = require('../controllers/holdingController');

router.post('/', addHolding);
router.put('/:id', updateHolding);
router.delete('/:id', deleteHolding);

module.exports = router;
