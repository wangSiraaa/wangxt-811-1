const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');

router.get('/', (req, res) => {
  try {
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.query.planId) filters.planId = req.query.planId;
    const logs = maintenanceService.listAuditLogs(filters);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
