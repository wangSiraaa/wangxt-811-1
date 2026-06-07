const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');

router.get('/', (req, res) => {
  try {
    const equipment = maintenanceService.listEquipment();
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
