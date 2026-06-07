const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');

router.post('/', (req, res) => {
  try {
    const plan = maintenanceService.createPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.team) filters.team = req.query.team;
    const plans = maintenanceService.listPlans(filters);
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const plan = maintenanceService.getPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '检修计划不存在' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/verify-qualification', (req, res) => {
  try {
    const plan = maintenanceService.getPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '检修计划不存在' });
    }
    const results = maintenanceService.verifyPersonnelQualification(plan.personnelIds);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/assign-blockpoint', (req, res) => {
  try {
    const plan = maintenanceService.assignBlockPoint(req.params.id, req.body);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/approve-blockpoint', (req, res) => {
  try {
    const { approved, approver } = req.body;
    const plan = maintenanceService.approveBlockPoint(req.params.id, approved, approver);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/confirm-start', (req, res) => {
  try {
    const { confirmer } = req.body;
    const plan = maintenanceService.confirmStart(req.params.id, confirmer);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/review-items/:itemId/complete', (req, res) => {
  try {
    const plan = maintenanceService.completeReviewItem(req.params.id, req.params.itemId);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/closeout', (req, res) => {
  try {
    const { closer, remarks } = req.body;
    const plan = maintenanceService.closeOut(req.params.id, closer, remarks);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
