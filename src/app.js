const express = require('express');
const bodyParser = require('body-parser');

const plansRouter = require('./routes/plans');
const personnelRouter = require('./routes/personnel');
const equipmentRouter = require('./routes/equipment');
const auditLogsRouter = require('./routes/auditLogs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'railway-signal-maintenance-api', timestamp: new Date().toISOString() });
});

app.use('/api/plans', plansRouter);
app.use('/api/personnel', personnelRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/audit-logs', auditLogsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`铁路信号设备检修计划 API 已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
