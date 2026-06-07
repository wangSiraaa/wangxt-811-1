# 铁路信号设备检修计划 API

铁路信号设备检修计划管理系统，支持信号工区提交设备和检修计划、调度室审核封锁点、负责人确认人员和销记的全流程管理。

## 业务规则

1. **没有封锁点不能开工**：所有检修作业必须在获得封锁点并经审核通过后方可开始
2. **人员资质过期不得加入计划**：开工确认时会校验所有参与人员的资质有效期，过期人员无法参与作业
3. **销记前必须完成复核项**：销记时必须完成所有复核项，否则无法销记

## 技术栈

- Node.js + Express
- 内存数据库（演示用）
- Docker 容器化部署

## 快速开始

### 方式一：Docker Compose 启动

```bash
docker-compose up -d
```

服务启动后访问: http://localhost:3000

### 方式二：本地运行

```bash
npm install
npm start
```

### 运行验证测试

容器启动后，运行验证脚本确认资质过期人员无法编组：

```bash
npm test
```

或直接运行：

```bash
node test/verify.js
```

## API 接口

### 基础信息

- 健康检查: `GET /health`
- 所有接口返回格式: `{ success: boolean, data: any, error?: string }`

---

### 1. 检修计划管理

#### 创建检修计划

```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "进站信号机X1月度检修",
    "team": "信号一工区",
    "equipmentIds": ["E001"],
    "personnelIds": ["P001", "P003"],
    "plannedStartTime": "2024-06-10T08:00:00.000Z",
    "plannedEndTime": "2024-06-10T12:00:00.000Z",
    "workContent": "信号机透镜清洁、灯泡测试、机构检查",
    "reviewItems": [
      {"content": "信号机显示正常"},
      {"content": "灯泡电流符合标准"},
      {"content": "机构密封良好"}
    ]
  }'
```

#### 查询检修计划列表

```bash
# 查询所有计划
curl http://localhost:3000/api/plans

# 按状态筛选
curl "http://localhost:3000/api/plans?status=DRAFT"

# 按工区筛选
curl "http://localhost:3000/api/plans?team=信号一工区"
```

#### 查询单个检修计划详情

```bash
curl http://localhost:3000/api/plans/{planId}
```

---

### 2. 资质校验

#### 校验计划内人员资质

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/verify-qualification
```

#### 批量校验人员资质

```bash
curl -X POST http://localhost:3000/api/personnel/verify-qualification \
  -H "Content-Type: application/json" \
  -d '{
    "personnelIds": ["P001", "P002"]
  }'
```

---

### 3. 封锁点管理

#### 分配封锁点

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/assign-blockpoint \
  -H "Content-Type: application/json" \
  -d '{
    "blockNumber": "FD20240610001",
    "line": "京广线",
    "startKilometer": "K123+000",
    "endKilometer": "K124+000",
    "startTime": "2024-06-10T08:00:00.000Z",
    "endTime": "2024-06-10T12:00:00.000Z",
    "dispatcher": "调度员王"
  }'
```

#### 调度室审核封锁点

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/approve-blockpoint \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "approver": "调度主任李"
  }'
```

---

### 4. 开工确认

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/confirm-start \
  -H "Content-Type: application/json" \
  -d '{
    "confirmer": "工长张"
  }'
```

**注意**：
- 必须在封锁点审核通过后才能开工
- 系统会自动校验所有参与人员的资质有效期
- 包含资质过期人员时会返回错误

---

### 5. 复核项管理

#### 完成复核项

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/review-items/{itemId}/complete
```

---

### 6. 销记

```bash
curl -X POST http://localhost:3000/api/plans/{planId}/closeout \
  -H "Content-Type: application/json" \
  -d '{
    "closer": "负责人刘",
    "remarks": "检修完成，设备运行正常"
  }'
```

**注意**：销记前必须完成所有复核项

---

### 7. 人员管理

#### 获取人员列表

```bash
curl http://localhost:3000/api/personnel
```

**预置人员数据**:
- P001 张三 - 信号工高级（资质有效）
- P002 李四 - 信号工中级（**资质已过期**，用于验证测试）
- P003 王五 - 信号工初级（资质有效）

---

### 8. 设备管理

#### 获取设备列表

```bash
curl http://localhost:3000/api/equipment
```

**预置设备数据**:
- E001 进站信号机X1
- E002 出站信号机S2
- E003 轨道电路1G

---

### 9. 审计日志

#### 查询审计日志

```bash
# 查询所有日志
curl http://localhost:3000/api/audit-logs

# 按操作类型筛选
curl "http://localhost:3000/api/audit-logs?action=PLAN_CREATED"

# 按计划ID筛选
curl "http://localhost:3000/api/audit-logs?planId={planId}"
```

**审计事件类型**:
- `PLAN_CREATED` - 计划创建
- `PLAN_UPDATED` - 计划更新
- `BLOCK_POINT_ASSIGNED` - 封锁点分配
- `BLOCK_POINT_APPROVED` - 封锁点审核
- `WORK_STARTED` - 开工确认
- `REVIEW_ITEM_COMPLETED` - 复核项完成
- `PLAN_CLOSED` - 计划销记

---

## 计划状态流转

```
DRAFT (草稿)
    ↓ 分配封锁点
PENDING_BLOCK_APPROVAL (待审核封锁点)
    ↓ 审核通过
BLOCK_APPROVED (封锁点已审核)
    ↓ 开工确认
IN_PROGRESS (进行中)
    ↓ 完成所有复核项后销记
CLOSED (已销记)
```

## 验证场景

容器启动后运行 `npm test` 会自动验证以下场景：

1. ✓ **资质过期人员识别**：P002李四资质已过期，校验接口正确识别
2. ✓ **包含过期人员无法开工**：计划包含P002时，开工确认返回错误
3. ✓ **无封锁点不能开工**：未分配封锁点的计划无法开工
4. ✓ **有效人员可正常开工**：仅包含有效人员且有封锁点的计划可正常开工

## 项目结构

```
.
├── src/
│   ├── app.js                 # 应用入口
│   ├── models/
│   │   └── database.js        # 内存数据库
│   ├── services/
│   │   └── maintenanceService.js  # 业务逻辑层
│   └── routes/
│       ├── plans.js             # 检修计划路由
│       ├── personnel.js       # 人员管理路由
│       ├── equipment.js       # 设备管理路由
│       └── auditLogs.js     # 审计日志路由
├── test/
│   └── verify.js              # 验证测试脚本
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```
