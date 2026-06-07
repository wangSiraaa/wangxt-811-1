const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');

router.get('/', (req, res) => {
  try {
    const personnel = maintenanceService.listPersonnel();
    res.json({ success: true, data: personnel });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/verify-qualification', (req, res) => {
  try {
    const { personnelIds } = req.body;
    const results = maintenanceService.verifyPersonnelQualification(personnelIds);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
