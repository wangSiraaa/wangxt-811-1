const fs=require("fs");const p="src/models/database.js";let c=fs.readFileSync(p,"utf8");c=c.replace(/  \}

  createPlan/,`    this.users.set("admin",{username:"admin",password:"admin123",role:"管理员",name:"系统管理员"});this.users.set("dispatcher",{username:"dispatcher",password:"dispatcher123",role:"调度员",name:"调度员王"});this.users.set("worker",{username:"worker",password:"worker123",role:"信号工",name:"工长张"});
  }

  createPlan`);c=c.replace("const plan = this.plans.get(id);
    if (!plan) return null;
    const updated","const plan = this.plans.get(id);
    if (!plan) return null;
    const oldStatus = plan.status;
    const updated");c=c.replace("this.addAuditLog(\"PLAN_UPDATED\", { planId: id, updates });
    return updated;","this.addAuditLog(\"PLAN_UPDATED\", { planId: id, updates });
    if (updates.status && updates.status !== oldStatus) { this.notifySubscribers(id, oldStatus, updates.status); }
    return updated;");const extra=`

  addSubscription(planId, subscriber) { const key=planId+"-"+subscriber.userId; const s={id:require("uuid").v4(),planId,userId:subscriber.userId,userName:subscriber.userName,subscribedAt:new Date().toISOString()}; this.subscriptions.set(key,s); this.addAuditLog("SUBSCRIPTION_ADDED",{planId,subscriber}); return s; }
  removeSubscription(planId,userId) { const key=planId+"-"+userId; const d=this.subscriptions.delete(key); if(d) this.addAuditLog("SUBSCRIPTION_REMOVED",{planId,userId}); return d; }
  listSubscriptions(planId) { return Array.from(this.subscriptions.values()).filter(s=>s.planId===planId).sort((a,b)=>new Date(b.subscribedAt)-new Date(a.subscribedAt)); }
  listSubscriptionsByUser(userId) { return Array.from(this.subscriptions.values()).filter(s=>s.userId===userId).sort((a,b)=>new Date(b.subscribedAt)-new Date(a.subscribedAt)); }
  notifySubscribers(planId,oldStatus,newStatus) { const subs=this.listSubscriptions(planId); for(const sub of subs) { const n={id:require("uuid").v4(),planId,userId:sub.userId,userName:sub.userName,oldStatus,newStatus,timestamp:new Date().toISOString(),read:false}; this.notifications.push(n); this.addAuditLog("STATUS_NOTIFICATION_SENT",{planId,userId:sub.userId,oldStatus,newStatus}); } }
  listNotifications(userId) { return this.notifications.filter(n=>n.userId===userId).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)); }
  markNotificationRead(nid) { const n=this.notifications.find(x=>x.id===nid); if(n) n.read=true; return n; }
  getUser(username) { return this.users.get(username); }
  listUsers() { return Array.from(this.users.values()).map(u=>({username:u.username,role:u.role,name:u.name})); }`;c=c.replace("module.exports = new InMemoryDatabase();",extra+"
module.exports = new InMemoryDatabase();");fs.writeFileSync(p,c);console.log("done");
