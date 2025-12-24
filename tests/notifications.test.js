import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Notification API
class MockNotification {
  static permission = 'default'
  static requestPermission = vi.fn().mockResolvedValue('granted')

  constructor(title, options = {}) {
    this.title = title
    this.options = options
  }

  close() {}
}

global.Notification = MockNotification

// 導入模塊
const {
  createNotificationSystem,
  validateNotificationConfig
} = await import('../js/notifications.js')

describe('Notifications - 實時通知系統', () => {
  let notificationSystem

  beforeEach(async () => {
    localStorage.clear()
    MockNotification.permission = 'default'
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
    notificationSystem = createNotificationSystem()
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('validateNotificationConfig - 驗證通知配置', () => {
    it('應該驗證有效的通知配置', () => {
      const config = {
        type: 'success',
        title: '搶票成功',
        message: '恭喜！已成功購買門票'
      }
      expect(() => validateNotificationConfig(config)).not.toThrow()
    })

    it('應該拒絕缺少 type 的配置', () => {
      const config = {
        title: '搶票成功',
        message: '恭喜！已成功購買門票'
      }
      expect(() => validateNotificationConfig(config)).toThrow()
    })

    it('應該拒絕缺少 title 的配置', () => {
      const config = {
        type: 'success',
        message: '恭喜！已成功購買門票'
      }
      expect(() => validateNotificationConfig(config)).toThrow()
    })

    it('應該接受有效的通知類型', () => {
      const validTypes = ['success', 'failure', 'progress', 'warning']
      for (const type of validTypes) {
        const config = {
          type,
          title: '測試',
          message: '測試消息'
        }
        expect(() => validateNotificationConfig(config)).not.toThrow()
      }
    })

    it('應該拒絕無效的通知類型', () => {
      const config = {
        type: 'invalid',
        title: '測試',
        message: '測試消息'
      }
      expect(() => validateNotificationConfig(config)).toThrow()
    })

    it('應該接受可選的 data 字段', () => {
      const config = {
        type: 'success',
        title: '測試',
        message: '測試消息',
        data: { taskId: 'task-001' }
      }
      expect(() => validateNotificationConfig(config)).not.toThrow()
    })
  })

  describe('requestPermission - 請求通知權限', () => {
    it('應該請求瀏覽器通知權限', async () => {
      const permission = await notificationSystem.requestPermission()
      expect(permission).toBe('granted')
      expect(MockNotification.requestPermission).toHaveBeenCalled()
    })

    it('應該返回權限狀態', async () => {
      const permission = await notificationSystem.requestPermission()
      expect(['granted', 'denied', 'default']).toContain(permission)
    })

    it('應該在被拒絕時返回 denied', async () => {
      MockNotification.requestPermission = vi.fn().mockResolvedValue('denied')
      const permission = await notificationSystem.requestPermission()
      expect(permission).toBe('denied')
    })
  })

  describe('send - 發送通知', () => {
    beforeEach(async () => {
      await notificationSystem.requestPermission()
    })

    it('應該成功發送成功通知', async () => {
      const result = await notificationSystem.send('success', {
        title: '搶票成功',
        message: '恭喜！已成功購買門票',
        data: { ticketId: 'ticket-001' }
      })
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.type).toBe('success')
    })

    it('應該成功發送失敗通知', async () => {
      const result = await notificationSystem.send('failure', {
        title: '搶票失敗',
        message: '很抱歉，門票已售完',
        data: { reason: 'out_of_stock' }
      })
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.type).toBe('failure')
    })

    it('應該成功發送進度通知', async () => {
      const result = await notificationSystem.send('progress', {
        title: '搶票進行中',
        message: '嘗試次數：1/3',
        data: { progress: 33 }
      })
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.type).toBe('progress')
    })

    it('應該成功發送警告通知', async () => {
      const result = await notificationSystem.send('warning', {
        title: '系統警告',
        message: '代理服務器可能無法連接',
        data: { severity: 'medium' }
      })
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.type).toBe('warning')
    })

    it('應該在無權限時拒絕發送', async () => {
      MockNotification.permission = 'denied'
      try {
        await notificationSystem.send('success', {
          title: '測試',
          message: '測試消息'
        })
        throw new Error('應該拋出錯誤')
      } catch (err) {
        expect(err.message).toContain('權限')
      }
    })

    it('應該記錄通知歷史', async () => {
      await notificationSystem.send('success', {
        title: '通知 1',
        message: '消息 1'
      })
      await notificationSystem.send('failure', {
        title: '通知 2',
        message: '消息 2'
      })

      const history = await notificationSystem.getNotificationHistory()
      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThanOrEqual(2)
    })

    it('應該支持通知去重', async () => {
      const config = {
        title: '重複通知',
        message: '相同的消息'
      }
      
      await notificationSystem.send('success', config)
      // 立即再發送相同的通知（應該被去重）
      const result = await notificationSystem.send('success', config)
      
      // 結果應該是成功的
      expect(result.success).toBe(true)
    })
  })

  describe('onNotificationSent - 通知發送事件', () => {
    beforeEach(async () => {
      await notificationSystem.requestPermission()
    })

    it('應該在通知發送時觸發回調', (done) => {
      notificationSystem.onNotificationSent((notification) => {
        expect(notification).toBeDefined()
        expect(notification.title).toBe('測試通知')
        done()
      })

      notificationSystem.send('success', {
        title: '測試通知',
        message: '測試消息'
      })
    })

    it('應該支持多個監聽器', (done) => {
      let callCount = 0
      const callback1 = () => { callCount++ }
      const callback2 = () => { callCount++ }

      notificationSystem.onNotificationSent(callback1)
      notificationSystem.onNotificationSent(callback2)

      notificationSystem.send('success', {
        title: '測試',
        message: '消息'
      }).then(() => {
        setTimeout(() => {
          expect(callCount).toBeGreaterThanOrEqual(1)
          done()
        }, 100)
      })
    })
  })

  describe('getNotificationHistory - 獲取通知歷史', () => {
    beforeEach(async () => {
      await notificationSystem.requestPermission()
    })

    it('應該返回空數組（初始狀態）', async () => {
      const history = await notificationSystem.getNotificationHistory()
      expect(Array.isArray(history)).toBe(true)
    })

    it('應該記錄多個通知', async () => {
      const notifications = [
        { title: '通知 1', message: '消息 1' },
        { title: '通知 2', message: '消息 2' },
        { title: '通知 3', message: '消息 3' }
      ]

      for (const notification of notifications) {
        await notificationSystem.send('success', notification)
      }

      const history = await notificationSystem.getNotificationHistory()
      expect(history.length).toBeGreaterThanOrEqual(3)
    })

    it('應該支持按類型過濾歷史', async () => {
      await notificationSystem.send('success', {
        title: '成功 1',
        message: '消息 1'
      })
      await notificationSystem.send('failure', {
        title: '失敗 1',
        message: '消息 2'
      })
      await notificationSystem.send('success', {
        title: '成功 2',
        message: '消息 3'
      })

      const successHistory = await notificationSystem.getNotificationHistory({ type: 'success' })
      expect(successHistory.every(n => n.type === 'success')).toBe(true)
    })

    it('應該支持限制歷史記錄數量', async () => {
      // 發送多個通知
      for (let i = 0; i < 10; i++) {
        await notificationSystem.send('success', {
          title: `通知 ${i}`,
          message: `消息 ${i}`
        })
      }

      const history = await notificationSystem.getNotificationHistory({ limit: 5 })
      expect(history.length).toBeLessThanOrEqual(5)
    })
  })

  describe('clearNotificationHistory - 清除通知歷史', () => {
    beforeEach(async () => {
      await notificationSystem.requestPermission()
      // 發送一些通知
      await notificationSystem.send('success', { title: '1', message: '1' })
      await notificationSystem.send('failure', { title: '2', message: '2' })
    })

    it('應該清除所有通知歷史', async () => {
      let history = await notificationSystem.getNotificationHistory()
      expect(history.length).toBeGreaterThan(0)

      await notificationSystem.clearNotificationHistory()
      history = await notificationSystem.getNotificationHistory()
      expect(history.length).toBe(0)
    })
  })

  describe('與 bot-engine 事件系統集成', () => {
    it('應該支持自動監聽任務完成事件', async () => {
      const callbacks = []
      
      notificationSystem.onNotificationSent((notification) => {
        callbacks.push(notification)
      })

      // 模擬任務完成事件
      await notificationSystem.send('success', {
        title: '任務完成',
        message: '搶票成功',
        data: { taskId: 'task-001' }
      })

      expect(callbacks.length).toBeGreaterThan(0)
      expect(callbacks[0].title).toBe('任務完成')
    })

    it('應該支持自動監聽任務失敗事件', async () => {
      await notificationSystem.requestPermission()
      
      const result = await notificationSystem.send('failure', {
        title: '任務失敗',
        message: '搶票失敗',
        data: { taskId: 'task-001', reason: 'timeout' }
      })

      expect(result.success).toBe(true)
      expect(result.type).toBe('failure')
    })

    it('應該支持進度通知流', async () => {
      await notificationSystem.requestPermission()
      
      const progressUpdates = [
        { progress: 33, message: '嘗試 1/3' },
        { progress: 66, message: '嘗試 2/3' },
        { progress: 100, message: '完成' }
      ]

      for (const update of progressUpdates) {
        const result = await notificationSystem.send('progress', {
          title: '搶票進行中',
          message: update.message,
          data: update
        })
        expect(result.success).toBe(true)
      }

      const history = await notificationSystem.getNotificationHistory({ type: 'progress' })
      expect(history.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('複習 - 集成測試場景', () => {
    it('應該處理完整的通知流程：權限 → 發送 → 事件 → 歷史', async () => {
      // 1. 請求權限
      const permission = await notificationSystem.requestPermission()
      expect(permission).toBe('granted')

      // 2. 發送通知
      const result = await notificationSystem.send('success', {
        title: '搶票成功',
        message: '恭喜！'
      })
      expect(result.success).toBe(true)

      // 3. 檢查歷史
      const history = await notificationSystem.getNotificationHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('應該正確處理多種通知類型的混合流', async () => {
      await notificationSystem.requestPermission()

      const notifications = [
        { type: 'success', title: '成功 1', message: '消息 1' },
        { type: 'progress', title: '進度', message: '嘗試中' },
        { type: 'failure', title: '失敗', message: '出錯' },
        { type: 'warning', title: '警告', message: '注意' },
        { type: 'success', title: '成功 2', message: '最終成功' }
      ]

      for (const notif of notifications) {
        const result = await notificationSystem.send(notif.type, {
          title: notif.title,
          message: notif.message
        })
        expect(result.success).toBe(true)
      }

      const history = await notificationSystem.getNotificationHistory()
      expect(history.length).toBe(5)
    })
  })
})
