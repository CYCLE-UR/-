import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  delay,
  isValidEmail,
  isValidUrl,
  deepClone,
  generateId,
  getNestedValue,
  setNestedValue,
  debounce,
  throttle
} from '../js/utils.js'

describe('Utils - 工具函數', () => {
  describe('formatDate - 日期格式化', () => {
    it('應該正確格式化日期為 YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2025-12-10T14:30:45')
      const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss')
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
    })

    it('應該支持自定義格式', () => {
      const date = new Date('2025-12-10T14:30:45')
      const result = formatDate(date, 'DD/MM/YYYY')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('應該接受時間戳作為輸入', () => {
      const timestamp = 1733842245000
      const result = formatDate(timestamp, 'YYYY-MM-DD')
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('delay - 延遲函數', () => {
    it('應該延遲指定時間後解決', async () => {
      const start = Date.now()
      await delay(50)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(50)
    })
  })

  describe('isValidEmail - 電子郵件驗證', () => {
    it('應該驗證有效的電子郵件', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
    })

    it('應該拒絕無效的電子郵件', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidUrl - URL 驗證', () => {
    it('應該驗證有效的 URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('應該拒絕無效的 URL', () => {
      expect(isValidUrl('not a url')).toBe(false)
      expect(isValidUrl('example.com')).toBe(false)
    })
  })

  describe('deepClone - 深複製', () => {
    it('應該正確複製基本類型', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(true)).toBe(true)
    })

    it('應該正確複製對象', () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = deepClone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })

    it('應該正確複製數組', () => {
      const original = [1, 2, [3, 4]]
      const cloned = deepClone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[2]).not.toBe(original[2])
    })

    it('應該正確複製日期對象', () => {
      const original = new Date('2025-12-10')
      const cloned = deepClone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned instanceof Date).toBe(true)
    })
  })

  describe('generateId - ID 生成', () => {
    it('應該生成 UUID v4 格式的 ID', () => {
      const id = generateId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })

    it('應該生成唯一的 ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('getNestedValue - 獲取嵌套值', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30
        }
      }
    }

    it('應該獲取嵌套的值', () => {
      expect(getNestedValue(obj, 'user.profile.name')).toBe('John')
      expect(getNestedValue(obj, 'user.profile.age')).toBe(30)
    })

    it('應該在路徑不存在時返回默認值', () => {
      expect(getNestedValue(obj, 'user.missing.value', 'default')).toBe('default')
    })

    it('應該處理無效路徑', () => {
      expect(getNestedValue(null, 'any.path', 'fallback')).toBe('fallback')
    })
  })

  describe('setNestedValue - 設置嵌套值', () => {
    it('應該設置嵌套的值', () => {
      const obj = {}
      setNestedValue(obj, 'user.profile.name', 'Alice')
      expect(obj.user.profile.name).toBe('Alice')
    })

    it('應該修改現有的嵌套值', () => {
      const obj = { user: { name: 'Bob' } }
      setNestedValue(obj, 'user.name', 'Charlie')
      expect(obj.user.name).toBe('Charlie')
    })
  })

  describe('debounce - 防抖', () => {
    it('應該在延遲後只執行一次函數', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 50)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      await delay(100)
      expect(mockFn).toHaveBeenCalledOnce()
    })
  })

  describe('throttle - 節流', () => {
    it('應該在時間限制內只執行一次函數', async () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 50)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledOnce()

      await delay(100)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})
