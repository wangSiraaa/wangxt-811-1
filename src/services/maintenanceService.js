const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

class MaintenanceService {
  createPlan(planData) {
    const { title, team, equipmentIds, personnelIds, plannedStartTime, plannedEndTime, workContent, reviewItems } = planData;

    if (!title || !team || !equipmentIds || !equipmentIds.length || !personnelIds || !personnelIds.length) {
      throw new Error('缺少必要字段：标题、工区、设备、人员为必填项');
    }

    for (const equipId of equipmentIds) {
      const equip = db.getEquipment(equipId);
      if (!equip) {
        throw new Error(`设备 ${equipId} 不存在`);
      }
    }

    const formattedReviewItems = (reviewItems || []).map(item => ({
      id: item.id || uuidv4(),
      content: item.content,
      completed: false
    }));

    const plan = db.createPlan({
      title,
      team,
      equipmentIds,
      personnelIds,
      plannedStartTime,
      plannedEndTime,
      workContent,
      reviewItems: formattedReviewItems,
      blockPoint: null,
      blockPointApproved: false
    });

    return plan;
  }

  verifyPersonnelQualification(personnelIds) {
    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const pid of personnelIds) {
      const person = db.getPersonnel(pid);
      if (!person) {
        results.push({ id: pid, valid: false, reason: '人员不存在' });
        continue;
      }

      const isExpired = person.qualificationExpiryDate < today;
      results.push({
        id: pid,
        name: person.name,
        valid: !isExpired,
        qualification: person.qualification,
        qualificationExpiryDate: person.qualificationExpiryDate,
        reason: isExpired ? '资质已过期' : '资质有效'
      });
    }

    return results;
  }

  assignBlockPoint(planId, blockPointInfo) {
    const plan = db.getPlan(planId);
    if (!plan) {
      throw new Error('检修计划不存在');
    }
    if (plan.status !== 'DRAFT') {
      throw new Error('仅草稿状态可分配封锁点');
    }

    const updated = db.updatePlan(planId, {
      blockPoint: blockPointInfo,
      blockPointApproved: false,
      status: 'PENDING_BLOCK_APPROVAL'
    });

    db.addAuditLog('BLOCK_POINT_ASSIGNED', { planId, blockPointInfo });
    return updated;
  }

  approveBlockPoint(planId, approved, approver) {
    const plan = db.getPlan(planId);
    if (!plan) {
      throw new Error('检修计划不存在');
    }
    if (plan.status !== 'PENDING_BLOCK_APPROVAL') {
      throw new Error('当前状态不可审核封锁点');
    }

    const newStatus = approved ? 'BLOCK_APPROVED' : 'DRAFT';
    const updated = db.updatePlan(planId, {
      blockPointApproved: approved,
      status: newStatus
    });

    db.addAuditLog('BLOCK_POINT_APPROVED', { planId, approved, approver });
    return updated;
  }

  confirmStart(planId, confirmer) {
    const plan = db.getPlan(planId);
    if (!plan) {
      throw new Error('检修计划不存在');
    }

    if (!plan.blockPoint || !plan.blockPointApproved) {
      throw new Error('没有封锁点或封锁点未审核，不能开工');
    }

    const qualificationResults = this.verifyPersonnelQualification(plan.personnelIds);
    const invalidPersonnel = qualificationResults.filter(r => !r.valid);
    if (invalidPersonnel.length > 0) {
      const names = invalidPersonnel.map(p => `${p.name}(${p.reason})`).join(', ');
      throw new Error(`人员资质校验不通过：${names}`);
    }

    const updated = db.updatePlan(planId, {
      status: 'IN_PROGRESS',
      actualStartTime: new Date().toISOString(),
      startConfirmer: confirmer
    });

    db.addAuditLog('WORK_STARTED', { planId, confirmer });
    return updated;
  }

  completeReviewItem(planId, reviewItemId) {
    const plan = db.getPlan(planId);
    if (!plan) {
      throw new Error('检修计划不存在');
    }
    if (plan.status !== 'IN_PROGRESS') {
      throw new Error('仅进行中状态可完成复核项');
    }

    const reviewItems = plan.reviewItems || [];
    const itemIndex = reviewItems.findIndex(item => item.id === reviewItemId);
    if (itemIndex === -1) {
      throw new Error('复核项不存在');
    }

    reviewItems[itemIndex].completed = true;
    const updated = db.updatePlan(planId, { reviewItems });

    db.addAuditLog('REVIEW_ITEM_COMPLETED', { planId, reviewItemId });
    return updated;
  }

  closeOut(planId, closer, closeOutRemarks) {
    const plan = db.getPlan(planId);
    if (!plan) {
      throw new Error('检修计划不存在');
    }
    if (plan.status !== 'IN_PROGRESS') {
      throw new Error('仅进行中状态可销记');
    }

    const incompleteItems = (plan.reviewItems || []).filter(item => !item.completed);
    if (incompleteItems.length > 0) {
      const contents = incompleteItems.map(i => i.content).join(', ');
      throw new Error(`销记前必须完成所有复核项，未完成：${contents}`);
    }

    const updated = db.updatePlan(planId, {
      status: 'CLOSED',
      actualEndTime: new Date().toISOString(),
      closeOutRemarks,
      closer
    });

    db.addAuditLog('PLAN_CLOSED', { planId, closer, closeOutRemarks });
    return updated;
  }

  getPlan(planId) {
    const plan = db.getPlan(planId);
    if (!plan) return null;

    const personnelDetails = plan.personnelIds.map(id => db.getPersonnel(id)).filter(Boolean);
    const equipmentDetails = plan.equipmentIds.map(id => db.getEquipment(id)).filter(Boolean);
    const qualificationCheck = this.verifyPersonnelQualification(plan.personnelIds);

    return {
      ...plan,
      personnelDetails,
      equipmentDetails,
      qualificationCheck
    };
  }

  listPlans(filters) {
    return db.listPlans(filters);
  }

  listPersonnel() {
    return db.listPersonnel();
  }

  listEquipment() {
    return db.listEquipment();
  }

  listAuditLogs(filters) {
    return db.listAuditLogs(filters);
  }
}

module.exports = new MaintenanceService();
