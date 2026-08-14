const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  deleteAlert,
  toggleAlert,
  evaluateAlerts,
} = require('../controllers/alertController');

router.get('/', getAlerts);
router.post('/', createAlert);
router.post('/evaluate', evaluateAlerts);
router.delete('/:id', deleteAlert);
router.put('/:id/toggle', toggleAlert);

module.exports = router;
