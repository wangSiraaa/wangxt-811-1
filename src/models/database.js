const { v4: uuidv4 } = require('uuid');

class InMemoryDatabase {
  constructor() {
    this.plans = new Map();
    this.personnel = new Map();
    this.equipment = new Map();
    this.auditLogs = [];
    this._initSeedData();
  }

  _initSeedData() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.personnel.set('P001', {
      id: 'P001',
      name: '张三',
      qualification: '信号工高级',
      qualificationExpiryDate: nextMonth.toISOString().split('T')[0],
      team: '信号一工区'
    });

    this.personnel.set('P002', {
      id: 'P002',
      name: '李四',
      qualification: '信号工中级',
      qualificationExpiryDate: lastMonth.toISOString().split('T')[0],
      team: '信号一工区'
    });

    this.personnel.set('P003', {
      id: 'P003',
      name: '王五',
      qualification: '信号工初级',
      qualificationExpiryDate: nextMonth.toISOString().split('T')[0],
      team: '信号二工区'
    });

    this.equipment.set('E001', {
      id: 'E001',
      name: '进站信号机X1',
      type: '信号机',
      location: 'K123+456',
      status: '正常'
    });

    this.equipment.set('E002', {
      id: 'E002',
      name: '出站信号机S2',
      type: '信号机',
      location: 'K123+789',
      status: '正常'
    });

    this.equipment.set('E003', {
      id: 'E003',
      name: '轨道电路1G',
      type: '轨道电路',
      location: 'K123+000至K124+000',
      status: '正常'
    });
  }

  createPlan(planData) {
    const id = uuidv4();
    const plan = {
      id,
      ...planData,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.plans.set(id, plan);
    this.addAuditLog('PLAN_CREATED', { planId: id, planData });
    return plan;
  }

  getPlan(id) {
    return this.plans.get(id);
  }

  updatePlan(id, updates) {
    const plan = this.plans.get(id);
    if (!plan) return null;
    const updated = { ...plan, ...updates, updatedAt: new Date().toISOString() };
    this.plans.set(id, updated);
    this.addAuditLog('PLAN_UPDATED', { planId: id, updates });
    return updated;
  }

  listPlans(filters = {}) {
    let result = Array.from(this.plans.values());
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.team) {
      result = result.filter(p => p.team === filters.team);
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPersonnel(id) {
    return this.personnel.get(id);
  }

  listPersonnel() {
    return Array.from(this.personnel.values());
  }

  getEquipment(id) {
    return this.equipment.get(id);
  }

  listEquipment() {
    return Array.from(this.equipment.values());
  }

  addAuditLog(action, details) {
    this.auditLogs.push({
      id: uuidv4(),
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  listAuditLogs(filters = {}) {
    let result = [...this.auditLogs];
    if (filters.action) {
      result = result.filter(l => l.action === filters.action);
    }
    if (filters.planId) {
      result = result.filter(l => l.details && l.details.planId === filters.planId);
    }
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

module.exports = new InMemoryDatabase();
