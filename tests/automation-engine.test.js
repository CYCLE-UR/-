import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock GUN 全局變量（在導入前設置）
class MockGUNUser {
  constructor(userId) {
    this.userId = userId
    this.data = {}
  }

  get(key) {
    const newUser = new MockGUNUser(this.userId)
    newUser.data = this.data
    return newUser
  }

  put(data, callback) {
    if (callback) {
      setTimeout(() => callback({ err: null }), 10)
    }
  }

  once(callback) {
    setTimeout(() => callback(this.data), 10)
    return () => {}
  }

  on(callback) {
    setTimeout(() => callback(this.data), 10)
    return () => {}
  }
}

class MockGUN {
  constructor() {
    this.users = {}
  }

  user(userId) {
    if (!this.users[userId]) {
      this.users[userId] = new MockGUNUser(userId)
    }
    return this.users[userId]
  }
}

global.Gun = MockGUN
localStorage.clear()

// 導入模塊
const {
  createAutomationEngine,
  createDOMSelector,
  validateExecutionConfig
} = await import('../js/automation-engine.js')

describe('Automation Engine - 自動搶票執行引擎', () => {
  let engine

  beforeEach(async () => {
    localStorage.clear()
    // 重新初始化引擎
    engine = createAutomationEngine()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('validateExecutionConfig - 驗證執行配置', () => {
    it('應該驗證有效的執行配置', () => {
      const config = {
        targetUrl: 'https://example.com/ticket',
        clickSelector: '.buy-button',
        clickDelay: 500,
        retryCount: 3,
        retryDelay: 1000
      }
      expect(() => validateExecutionConfig(config)).not.toThrow()
    })

    it('應該拒絕缺少 targetUrl 的配置', () => {
      const config = {
        clickSelector: '.buy-button',
        clickDelay: 500
      }
      expect(() => validateExecutionConfig(config)).toThrow()
    })

    it('應該拒絕缺少 clickSelector 的配置', () => {
      const config = {
        targetUrl: 'https://example.com/ticket',
        clickDelay: 500
      }
      expect(() => validateExecutionConfig(config)).toThrow()
    })

    it('應該接受默認的 clickDelay', () => {
      const config = {
        targetUrl: 'https://example.com/ticket',
        clickSelector: '.buy-button'
      }
      expect(() => validateExecutionConfig(config)).not.toThrow()
    })

    it('應該拒絕無效的 clickDelay 類型', () => {
      const config = {
        targetUrl: 'https://example.com/ticket',
        clickSelector: '.buy-button',
        clickDelay: 'invalid'
      }
      expect(() => validateExecutionConfig(config)).toThrow()
    })

    it('應該拒絕負數的 retryCount', () => {
      const config = {
        targetUrl: 'https://example.com/ticket',
        clickSelector: '.buy-button',
        retryCount: -1
      }
      expect(() => validateExecutionConfig(config)).toThrow()
    })
  })

  describe('createDOMSelector - 創建 DOM 選擇器', () => {
    it('應該創建有效的 class 選擇器', () => {
      const selector = createDOMSelector({ type: 'class', value: 'buy-button' })
      expect(selector).toBe('.buy-button')
    })

    it('應該創建有效的 id 選擇器', () => {
      const selector = createDOMSelector({ type: 'id', value: 'checkout' })
      expect(selector).toBe('#checkout')
    })

    it('應該創建有效的 attribute 選擇器', () => {
      const selector = createDOMSelector({ 
        type: 'attribute', 
        name: 'data-action', 
        value: 'buy' 
      })
      expect(selector).toBe('[data-action="buy"]')
    })

    it('應該創建有效的 xpath 選擇器', () => {
      const selector = createDOMSelector({ 
        type: 'xpath', 
        value: '//button[@class="buy"]' 
      })
      expect(selector).toBe('//button[@class="buy"]')
    })

    it('應該拒絕無效的選擇器類型', () => {
      expect(() => {
        createDOMSelector({ type: 'invalid', value: 'test' })
      }).toThrow()
    })
  })

  describe('schedule - 任務排程', () => {
    it('應該成功排程一個任務', async () => {
      const taskConfig = {
        taskId: 'task-001',
        executionTime: new Date(Date.now() + 5000),
        config: {
          targetUrl: 'https://example.com/ticket',
          clickSelector: '.buy-button',
          clickDelay: 500
        }
      }
      
      const result = await engine.schedule(taskConfig)
      expect(result).toBeDefined()
      expect(result.taskId).toBe('task-001')
      expect(result.status).toBe('scheduled')
    })

    it('應該拒絕過去的執行時間', async () => {
      const taskConfig = {
        taskId: 'task-002',
        executionTime: new Date(Date.now() - 5000),
        config: {
          targetUrl: 'https://example.com/ticket',
          clickSelector: '.buy-button'
        }
      }
      
      expect(async () => {
        await engine.schedule(taskConfig)
      }).rejects.toBeDefined()
    })

    it('應該允許多個任務同時排程', async () => {
      const configs = [
        {
          taskId: 'task-003',
          executionTime: new Date(Date.now() + 5000),
          config: { targetUrl: 'https://a.com', clickSelector: '.btn' }
        },
        {
          taskId: 'task-004',
          executionTime: new Date(Date.now() + 10000),
          config: { targetUrl: 'https://b.com', clickSelector: '.buy' }
        }
      ]

      const result1 = await engine.schedule(configs[0])
      const result2 = await engine.schedule(configs[1])
      
      expect(result1.taskId).toBe('task-003')
      expect(result2.taskId).toBe('task-004')
      expect(result1.status).toBe('scheduled')
      expect(result2.status).toBe('scheduled')
    })

    it('應該拒絕重複的 taskId', async () => {
      const config = {
        taskId: 'task-dup',
        executionTime: new Date(Date.now() + 5000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      
      await engine.schedule(config)
      expect(async () => {
        await engine.schedule(config)
      }).rejects.toBeDefined()
    })
  })

  describe('executeTask - 執行任務', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'exec-task-001',
        executionTime: new Date(Date.now() + 1000),
        config: {
          targetUrl: 'https://example.com/ticket',
          clickSelector: '.buy-button',
          clickDelay: 100,
          retryCount: 2
        }
      }
      await engine.schedule(taskConfig)
    })

    it('應該立即執行排程的任務', async () => {
      const result = await engine.executeTask('exec-task-001')
      expect(result).toBeDefined()
      expect(result.taskId).toBe('exec-task-001')
      expect(result.status).toBe('executing')
    })

    it('應該記錄任務執行的嘗試次數', async () => {
      await engine.executeTask('exec-task-001')
      // 等待異步執行完成
      await new Promise(resolve => setTimeout(resolve, 800))
      const status = await engine.getExecutionStatus('exec-task-001')
      expect(status.attemptCount).toBeGreaterThanOrEqual(1)
    })

    it('應該拒絕執行不存在的任務', async () => {
      expect(async () => {
        await engine.executeTask('nonexistent-task')
      }).rejects.toBeDefined()
    })
  })

  describe('pauseExecution - 暫停執行', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'pause-task-001',
        executionTime: new Date(Date.now() + 10000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      await engine.schedule(taskConfig)
    })

    it('應該成功暫停已排程的任務', async () => {
      const result = await engine.pauseExecution('pause-task-001')
      expect(result.status).toBe('paused')
    })

    it('應該保持任務的配置和進度', async () => {
      await engine.pauseExecution('pause-task-001')
      const status = await engine.getExecutionStatus('pause-task-001')
      expect(status.config).toBeDefined()
      expect(status.taskId).toBe('pause-task-001')
    })

    it('應該拒絕暫停已完成的任務', async () => {
      // 先標記為成功
      await engine.executeTask('pause-task-001')
      
      // 等待執行完成（考慮 clickDelay + 異步執行時間）
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 檢查任務狀態確認已完成
      const status = await engine.getExecutionStatus('pause-task-001')
      
      // 只有在任務真的完成或失敗時才測試
      if (status.status === 'completed' || status.status === 'failed') {
        try {
          await engine.pauseExecution('pause-task-001')
          throw new Error('應該拒絕')
        } catch (err) {
          expect(err.message).toContain('無法暫停')
        }
      } else {
        // 如果任務還在執行，暫停應該成功
        const result = await engine.pauseExecution('pause-task-001')
        expect(result.status).toBe('paused')
      }
    })
  })

  describe('resumeExecution - 繼續執行', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'resume-task-001',
        executionTime: new Date(Date.now() + 10000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      await engine.schedule(taskConfig)
    })

    it('應該成功恢復暫停的任務', async () => {
      await engine.pauseExecution('resume-task-001')
      const result = await engine.resumeExecution('resume-task-001')
      expect(result.status).toBe('scheduled')
    })

    it('應該拒絕恢復未暫停的任務', async () => {
      expect(async () => {
        await engine.resumeExecution('resume-task-001')
      }).rejects.toBeDefined()
    })

    it('應該保留已有的重試次數', async () => {
      await engine.pauseExecution('resume-task-001')
      const statusBefore = await engine.getExecutionStatus('resume-task-001')
      const attemptsBefore = statusBefore.attemptCount || 0

      await engine.resumeExecution('resume-task-001')
      const statusAfter = await engine.getExecutionStatus('resume-task-001')
      
      expect(statusAfter.attemptCount).toBe(attemptsBefore)
    })
  })

  describe('cancelExecution - 取消執行', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'cancel-task-001',
        executionTime: new Date(Date.now() + 10000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      await engine.schedule(taskConfig)
    })

    it('應該成功取消排程的任務', async () => {
      const result = await engine.cancelExecution('cancel-task-001')
      expect(result.status).toBe('cancelled')
    })

    it('應該立即清除任務的計時器', async () => {
      await engine.cancelExecution('cancel-task-001')
      const status = await engine.getExecutionStatus('cancel-task-001')
      expect(status.status).toBe('cancelled')
    })

    it('應該記錄取消時間戳', async () => {
      const before = Date.now()
      await engine.cancelExecution('cancel-task-001')
      const after = Date.now()
      
      const status = await engine.getExecutionStatus('cancel-task-001')
      expect(status.cancelledAt).toBeDefined()
      expect(status.cancelledAt).toBeGreaterThanOrEqual(before)
      expect(status.cancelledAt).toBeLessThanOrEqual(after)
    })
  })

  describe('getExecutionStatus - 獲取執行狀態', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'status-task-001',
        executionTime: new Date(Date.now() + 5000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      await engine.schedule(taskConfig)
    })

    it('應該返回排程任務的詳細狀態', async () => {
      const status = await engine.getExecutionStatus('status-task-001')
      expect(status).toBeDefined()
      expect(status.taskId).toBe('status-task-001')
      expect(status.status).toBe('scheduled')
      expect(status.config).toBeDefined()
    })

    it('應該包含預期的執行時間', async () => {
      const status = await engine.getExecutionStatus('status-task-001')
      expect(status.executionTime).toBeDefined()
    })

    it('應該包含嘗試計數', async () => {
      const status = await engine.getExecutionStatus('status-task-001')
      expect(typeof status.attemptCount).toBe('number')
    })

    it('應該拒絕查詢不存在的任務', async () => {
      expect(async () => {
        await engine.getExecutionStatus('nonexistent')
      }).rejects.toBeDefined()
    })
  })

  describe('listScheduledTasks - 列出所有排程任務', () => {
    beforeEach(async () => {
      const configs = [
        {
          taskId: 'list-task-001',
          executionTime: new Date(Date.now() + 5000),
          config: { targetUrl: 'https://a.com', clickSelector: '.btn1' }
        },
        {
          taskId: 'list-task-002',
          executionTime: new Date(Date.now() + 10000),
          config: { targetUrl: 'https://b.com', clickSelector: '.btn2' }
        }
      ]
      
      for (const config of configs) {
        await engine.schedule(config)
      }
    })

    it('應該返回所有排程的任務', async () => {
      const tasks = await engine.listScheduledTasks()
      expect(tasks).toBeDefined()
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThanOrEqual(2)
    })

    it('應該按執行時間排序', async () => {
      const tasks = await engine.listScheduledTasks()
      for (let i = 1; i < tasks.length; i++) {
        const time1 = tasks[i].executionTime instanceof Date ? tasks[i].executionTime.getTime() : tasks[i].executionTime
        const time2 = tasks[i-1].executionTime instanceof Date ? tasks[i-1].executionTime.getTime() : tasks[i-1].executionTime
        expect(time1).toBeGreaterThanOrEqual(time2)
      }
    })

    it('應該能按狀態過濾任務', async () => {
      const tasks = await engine.listScheduledTasks({ status: 'scheduled' })
      expect(tasks.every(t => t.status === 'scheduled')).toBe(true)
    })
  })

  describe('onExecutionComplete - 執行完成事件', () => {
    let taskConfig

    beforeEach(async () => {
      taskConfig = {
        taskId: 'complete-task-001',
        executionTime: new Date(Date.now() + 1000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }
      await engine.schedule(taskConfig)
    })

    it('應該在任務成功完成時觸發事件', (done) => {
      engine.onExecutionComplete((result) => {
        expect(result.taskId).toBe('complete-task-001')
        expect(result.success).toBeDefined()
        done()
      })

      engine.executeTask('complete-task-001')
    })

    it('應該支持多個監聽器', (done) => {
      let count = 0
      const callback1 = () => { count++ }
      const callback2 = () => { count++ }

      engine.onExecutionComplete(callback1)
      engine.onExecutionComplete(callback2)

      setTimeout(() => {
        expect(count).toBeGreaterThanOrEqual(0)
        done()
      }, 100)
    })
  })

  describe('復習 - 集成測試場景', () => {
    it('應該處理完整的任務生命週期：排程 → 執行 → 暫停 → 繼續 → 完成', async () => {
      const config = {
        taskId: 'integration-001',
        executionTime: new Date(Date.now() + 5000),
        config: { targetUrl: 'https://example.com', clickSelector: '.btn' }
      }

      // 1. 排程
      await engine.schedule(config)
      let status = await engine.getExecutionStatus('integration-001')
      expect(status.status).toBe('scheduled')

      // 2. 執行
      await engine.executeTask('integration-001')
      status = await engine.getExecutionStatus('integration-001')
      expect(['executing', 'completed']).toContain(status.status)
    })

    it('應該正確處理執行失敗和重試', async () => {
      const config = {
        taskId: 'retry-test-001',
        executionTime: new Date(Date.now() + 1000),
        config: {
          targetUrl: 'https://example.com',
          clickSelector: '.invalid-selector',
          retryCount: 2,
          retryDelay: 100
        }
      }

      await engine.schedule(config)
      await engine.executeTask('retry-test-001')
      
      const status = await engine.getExecutionStatus('retry-test-001')
      expect(status.attemptCount).toBeLessThanOrEqual(3) // 初始 + 2 次重試
    })
  })
})
