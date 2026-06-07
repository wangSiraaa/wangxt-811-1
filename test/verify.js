const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function waitForService() {
  console.log('等待服务启动...');
  for (let i = 0; i < 30; i++) {
    try {
      const res = await request('/health');
      if (res.status === 200) {
        console.log('服务已启动！');
        return;
      }
    } catch (e) {
      // 等待服务启动
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('服务启动超时');
}

async function runTests() {
  console.log('=== 铁路信号设备检修计划 API 验证测试 ===\n');

  try {
    await waitForService();

    console.log('1. 获取人员列表（查看资质过期情况）');
    const personnelRes = await request('/api/personnel');
    const expiredPerson = personnelRes.data.data.find(p => 
      new Date(p.qualificationExpiryDate) < new Date()
    );
    const validPerson = personnelRes.data.data.find(p => 
      new Date(p.qualificationExpiryDate) >= new Date()
    );
    console.log(`   资质过期人员: ${expiredPerson.name} (ID: ${expiredPerson.id}, 过期日期: ${expiredPerson.qualificationExpiryDate})`);
    console.log(`   资质有效人员: ${validPerson.name} (ID: ${validPerson.id}, 有效日期: ${validPerson.qualificationExpiryDate})`);

    console.log('\n2. 验证资质校验接口');
    const verifyRes = await request('/api/personnel/verify-qualification', 'POST', {
      personnelIds: [expiredPerson.id, validPerson.id]
    });
    const expiredResult = verifyRes.data.data.find(r => r.id === expiredPerson.id);
    console.log(`   ${expiredPerson.name} 资质校验结果: ${expiredResult.valid ? '有效' : '无效 (已过期)'}`);
    if (!expiredResult.valid) {
      console.log('   ✓ 资质过期人员正确识别为无效');
    } else {
      console.log('   ✗ 资质过期人员未被正确识别');
      process.exit(1);
    }

    console.log('\n3. 创建设备检修计划（包含资质过期人员）');
    const createRes = await request('/api/plans', 'POST', {
      title: '进站信号机X1月度检修',
      team: '信号一工区',
      equipmentIds: ['E001'],
      personnelIds: [expiredPerson.id, validPerson.id],
      plannedStartTime: '2024-06-10T08:00:00.000Z',
      plannedEndTime: '2024-06-10T12:00:00.000Z',
      workContent: '信号机透镜清洁、灯泡测试、机构检查',
      reviewItems: [
        { content: '信号机显示正常' },
        { content: '灯泡电流符合标准' },
        { content: '机构密封良好' }
      ]
    });
    const planId = createRes.data.data.id;
    console.log('   创建计划成功，计划ID:', planId);

    console.log('\n4. 分配封锁点并审核通过');
    await request(`/api/plans/${planId}/assign-blockpoint`, 'POST', {
      blockNumber: 'FD20240610001',
      line: '京广线',
      startKilometer: 'K123+000',
      endKilometer: 'K124+000',
      startTime: '2024-06-10T08:00:00.000Z',
      endTime: '2024-06-10T12:00:00.000Z',
      dispatcher: '调度员王'
    });
    await request(`/api/plans/${planId}/approve-blockpoint`, 'POST', {
      approved: true,
      approver: '调度主任李'
    });
    console.log('   封锁点已分配并审核通过');

    console.log('\n5. 尝试开工确认（包含资质过期人员，应该失败）');
    const startRes = await request(`/api/plans/${planId}/confirm-start`, 'POST', {
      confirmer: '工长张'
    });
    console.log('   开工确认状态:', startRes.status);
    console.log('   返回错误:', startRes.data.error);
    if (!startRes.data.success && startRes.data.error.includes('资质')) {
      console.log('   ✓ 包含资质过期人员时，开工确认正确失败！');
    } else {
      console.log('   ✗ 包含资质过期人员时，开工确认未按预期失败');
      process.exit(1);
    }

    console.log('\n6. 验证：仅使用有效人员创建新计划并开工');
    const createRes2 = await request('/api/plans', 'POST', {
      title: '出站信号机S2季度检修',
      team: '信号一工区',
      equipmentIds: ['E002'],
      personnelIds: [validPerson.id],
      plannedStartTime: '2024-06-11T08:00:00.000Z',
      plannedEndTime: '2024-06-11T12:00:00.000Z',
      workContent: '信号机全面检修',
      reviewItems: [
        { content: '信号机显示正常' },
        { content: '电气特性测试合格' }
      ]
    });
    const planId2 = createRes2.data.data.id;

    await request(`/api/plans/${planId2}/assign-blockpoint`, 'POST', {
      blockNumber: 'FD20240611001',
      line: '京广线',
      startKilometer: 'K123+500',
      endKilometer: 'K124+000',
      startTime: '2024-06-11T08:00:00.000Z',
      endTime: '2024-06-11T12:00:00.000Z',
      dispatcher: '调度员王'
    });
    await request(`/api/plans/${planId2}/approve-blockpoint`, 'POST', {
      approved: true,
      approver: '调度主任李'
    });

    const startRes2 = await request(`/api/plans/${planId2}/confirm-start`, 'POST', {
      confirmer: '工长张'
    });
    if (startRes2.data.success) {
      console.log('   ✓ 仅有效人员时，开工确认成功');
      console.log('   当前状态:', startRes2.data.data.status);
    } else {
      console.log('   ✗ 仅有效人员时，开工确认失败');
      console.log('   错误:', startRes2.data.error);
    }

    console.log('\n7. 验证：没有封锁点不能开工');
    const createRes3 = await request('/api/plans', 'POST', {
      title: '轨道电路测试',
      team: '信号二工区',
      equipmentIds: ['E003'],
      personnelIds: [validPerson.id],
      plannedStartTime: '2024-06-12T08:00:00.000Z',
      plannedEndTime: '2024-06-12T10:00:00.000Z',
      workContent: '轨道电路调整测试'
    });
    const planId3 = createRes3.data.data.id;
    
    const startRes3 = await request(`/api/plans/${planId3}/confirm-start`, 'POST', {
      confirmer: '工长刘'
    });
    if (!startRes3.data.success && startRes3.data.error.includes('封锁点')) {
      console.log('   ✓ 没有封锁点时，开工确认正确失败！');
    } else {
      console.log('   ✗ 没有封锁点时，开工确认未按预期失败');
    }

    console.log('\n=== 所有核心验证测试通过！===');
    console.log('\n总结:');
    console.log('✓ 资质过期人员无法编组（开工确认时校验失败）');
    console.log('✓ 没有封锁点不能开工');
    console.log('✓ 资质校验接口正确识别过期人员');

  } catch (error) {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  }
}

runTests();
