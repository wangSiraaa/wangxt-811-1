const fs = require('fs');
const p = 'src/models/database.js';
let c = fs.readFileSync(p, 'utf8');

const methods = `
  addSubscription(planId, subscriber) {
    const key = planId + "-" + subscriber.userId;
    const subscription = {
      id: uuidv4(),
      planId,
      userId: subscriber.userId,
      userName: subscriber.userName,
      subscribedAt: new Date().toISOString()
    };
    this.subscriptions.set(key, subscription);
    this.addAuditLog("SUBSCRIPTION_ADDED", { planId, subscriber });
    return subscription;
  }

  removeSubscription(planId, userId) {
    const key = planId + "-" + userId;
    const deleted = this.subscriptions.delete(key);
    if (deleted) {
      this.addAuditLog("SUBSCRIPTION_REMOVED", { planId, userId });
    }
    return deleted;
  }

  listSubscriptions(planId) {
    return Array.from(this.subscriptions.values())
      .filter(s => s.planId === planId)
      .sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
  }

  listSubscriptionsByUser(userId) {
    return Array.from(this.subscriptions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
  }

  notifySubscribers(planId, oldStatus, newStatus) {
    const subscribers = this.listSubscriptions(planId);
    for (const sub of subscribers) {
      const notification = {
        id: uuidv4(),
        planId,
        userId: sub.userId,
        userName: sub.userName,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        read: false
      };
      this.notifications.push(notification);
      this.addAuditLog("STATUS_NOTIFICATION_SENT", {
        planId,
        userId: sub.userId,
        oldStatus,
        newStatus
      });
    }
  }

  listNotifications(userId) {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  markNotificationRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    return notification;
  }

  getUser(username) {
    return this.users.get(username);
  }

  listUsers() {
    return Array.from(this.users.values()).map(u => ({
      username: u.username,
      role: u.role,
      name: u.name
    }));
  }
`;

c = c.replace(/\}\s*\n\s*module\.exports/, methods + '\n}\n\nmodule.exports');
fs.writeFileSync(p, c);
console.log('Methods added successfully');
