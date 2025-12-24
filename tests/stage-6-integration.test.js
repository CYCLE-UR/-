/**
 * 導入/導出模塊測試
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  exportTasksAsJSON,
  exportTasksAsCSV,
  importTasksFromJSON,
  importTasksFromCSV,
  generateImportTemplate
} from './js/import-export.js'

describe('Import/Export Module', () => {
  let mockTasks

  beforeEach(() => {
    mockTasks = [
      {
        id: 'task1',
        name: '演唱會搶票',
        eventName: '某演唱會',
        eventDate: '2025-12-25',
        saleStartTime: '2025-12-24 10:00:00',
        status: 'pending',
        ticketConfig: { targetUrl: 'https://example.com', quantity: 2 }
      },
      {
        id: 'task2',
        name: '演唱會搶票 2',
        eventName: '另一個演唱會',
        eventDate: '2026-01-15',
        saleStartTime: '2026-01-14 14:00:00',
        status: 'running',
        ticketConfig: { targetUrl: 'https://example2.com', quantity: 1 }
      }
    ]
  })

  it('應該成功導出任務為 JSON', () => {
    const result = exportTasksAsJSON(mockTasks)
    expect(result.success).toBe(true)
    expect(result.message).toContain('成功導出')
  })

  it('應該成功導出任務為 CSV', () => {
    const result = exportTasksAsCSV(mockTasks)
    expect(result.success).toBe(true)
    expect(result.data).toContain('任務名稱')
  })

  it('應該成功導入 JSON 格式任務', () => {
    const jsonString = JSON.stringify({
      version: '1.0',
      tasks: mockTasks
    })
    const result = importTasksFromJSON(jsonString)
    expect(result.success).toBe(true)
    expect(result.tasks.length).toBe(2)
  })

  it('應該成功導入 CSV 格式任務', () => {
    const csvString = `任務名稱,事件名稱,事件日期,售票時間,狀態,優先級,購票數量,目標 URL
演唱會搶票,某演唱會,2025-12-25,2025-12-24 10:00:00,pending,5,2,https://example.com`

    const result = importTasksFromCSV(csvString)
    expect(result.success).toBe(true)
    expect(result.tasks.length).toBeGreaterThan(0)
  })

  it('應該驗證導入的任務', () => {
    const invalidJson = JSON.stringify({
      version: '1.0',
      tasks: [{ name: '' }] // 缺少必填字段
    })
    const result = importTasksFromJSON(invalidJson)
    expect(result.errors).toBeDefined()
  })

  it('應該生成導入模板', () => {
    const jsonTemplate = generateImportTemplate('json')
    expect(jsonTemplate.success).toBe(true)
    expect(jsonTemplate.data).toContain('version')

    const csvTemplate = generateImportTemplate('csv')
    expect(csvTemplate.success).toBe(true)
    expect(csvTemplate.data).toContain('任務名稱')
  })

  it('應該處理空任務列表', () => {
    const result = exportTasksAsJSON([])
    expect(result.success).toBe(false)
  })

  it('應該處理無效的 JSON', () => {
    const result = importTasksFromJSON('invalid json {')
    expect(result.success).toBe(false)
  })
})

/**
 * 批量操作模塊測試
 */
describe('Batch Operations Module', () => {
  const mockTasks = [
    { id: '1', name: 'Task 1', status: 'pending', priority: 5 },
    { id: '2', name: 'Task 2', status: 'pending', priority: 7 },
    { id: '3', name: 'Task 3', status: 'running', priority: 3 }
  ]

  it('應該過濾任務', () => {
    const { filterTasks } = await import('./js/batch-operations.js')
    const filtered = filterTasks(mockTasks, { status: 'pending' })
    expect(filtered.length).toBe(2)
  })

  it('應該排序任務', () => {
    const { sortTasks } = await import('./js/batch-operations.js')
    const sorted = sortTasks(mockTasks, 'priority', 'desc')
    expect(sorted[0].priority).toBe(7)
  })

  it('應該更新任務選擇', () => {
    const { updateTaskSelection } = await import('./js/batch-operations.js')
    let selected = []
    
    selected = updateTaskSelection(mockTasks, selected, 'select', '1')
    expect(selected).toContain('1')
    
    selected = updateTaskSelection(mockTasks, selected, 'selectAll')
    expect(selected.length).toBe(3)
  })
})

/**
 * 高級搜索模塊測試
 */
describe('Advanced Search Module', () => {
  const mockTasks = [
    { id: '1', name: '演唱會搶票', eventName: '張惠妹演唱會', status: 'pending' },
    { id: '2', name: '演唱會搶票 2', eventName: '周杰倫演唱會', status: 'running' }
  ]

  it('應該執行基本搜索', () => {
    const { advancedSearch } = await import('./js/advanced-search.js')
    const results = advancedSearch(mockTasks, {
      query: '演唱會',
      matchMode: 'contains'
    })
    expect(results.length).toBe(2)
  })

  it('應該執行複雜搜索', () => {
    const { complexSearch } = await import('./js/advanced-search.js')
    const results = complexSearch(mockTasks, {
      status: 'pending'
    })
    expect(results.length).toBe(1)
  })

  it('應該進行高級排序', () => {
    const { advancedSort } = await import('./js/advanced-search.js')
    const sorted = advancedSort(mockTasks, [
      { field: 'status', order: 'asc' }
    ])
    expect(sorted[0].status).toBe('pending')
  })

  it('應該分組任務', () => {
    const { groupTasks } = await import('./js/advanced-search.js')
    const grouped = groupTasks(mockTasks, 'status')
    expect(Object.keys(grouped).length).toBeGreaterThan(0)
  })

  it('應該統計任務信息', () => {
    const { statisticsTasks } = await import('./js/advanced-search.js')
    const stats = statisticsTasks(mockTasks)
    expect(stats.total).toBe(2)
  })
})

/**
 * 權限管理模塊測試
 */
describe('Permissions Module', () => {
  const { createPermissionManager, ROLES, PERMISSIONS } = await import('./js/permissions.js')

  it('應該創建權限管理器', () => {
    const manager = createPermissionManager()
    expect(manager).toBeDefined()
  })

  it('應該註冊用戶並檢查權限', () => {
    const manager = createPermissionManager()
    manager.registerUser('user1', ROLES.USER)
    
    expect(manager.hasPermission('user1', PERMISSIONS.TASK_CREATE)).toBe(true)
    expect(manager.hasPermission('user1', PERMISSIONS.SYSTEM_CONFIG)).toBe(false)
  })

  it('應該授予和撤銷權限', () => {
    const manager = createPermissionManager()
    manager.registerUser('user1', ROLES.USER)
    
    manager.grantPermissions('user1', PERMISSIONS.TASK_DELETE)
    expect(manager.hasPermission('user1', PERMISSIONS.TASK_DELETE)).toBe(true)
    
    manager.revokePermissions('user1', PERMISSIONS.TASK_DELETE)
    expect(manager.hasPermission('user1', PERMISSIONS.TASK_DELETE)).toBe(false)
  })

  it('應該支持多角色', () => {
    const manager = createPermissionManager()
    
    manager.registerUser('admin', ROLES.ADMIN)
    manager.registerUser('user', ROLES.USER)
    
    expect(manager.hasPermission('admin', PERMISSIONS.SYSTEM_CONFIG)).toBe(true)
    expect(manager.hasPermission('user', PERMISSIONS.SYSTEM_CONFIG)).toBe(false)
  })
})

/**
 * 性能優化模塊測試
 */
describe('Performance Optimization Module', () => {
  const { debounce, throttle, memoize } = await import('./js/performance-optimization.js')

  it('應該實現防抖', async () => {
    let callCount = 0
    const fn = debounce(() => { callCount++ }, 100)
    
    fn()
    fn()
    fn()
    
    expect(callCount).toBe(0)
    await new Promise(r => setTimeout(r, 150))
    expect(callCount).toBe(1)
  })

  it('應該實現節流', async () => {
    let callCount = 0
    const fn = throttle(() => { callCount++ }, 100)
    
    fn()
    fn()
    fn()
    
    expect(callCount).toBe(1)
    await new Promise(r => setTimeout(r, 150))
    expect(callCount).toBe(1)
  })

  it('應該實現快取', () => {
    let callCount = 0
    const fn = memoize((x) => {
      callCount++
      return x * 2
    })
    
    fn(5)
    fn(5)
    
    expect(callCount).toBe(1)
  })
})

/**
 * 虛擬滾動測試
 */
describe('Virtual Scroll Module', () => {
  const { createVirtualScroll } = await import('./js/virtual-scroll.js')

  it('應該創建虛擬滾動實例', () => {
    const items = Array(1000).fill(null).map((_, i) => ({ id: i }))
    const scroll = createVirtualScroll(items, { itemHeight: 60 })
    
    expect(scroll).toBeDefined()
    expect(scroll.getTotalHeight()).toBe(60000)
  })

  it('應該計算可見項目', () => {
    const items = Array(100).fill(null).map((_, i) => ({ id: i }))
    const scroll = createVirtualScroll(items, { itemHeight: 60, containerHeight: 600 })
    
    scroll.updateScroll(0)
    const visible = scroll.getVisibleItems()
    
    expect(visible.length).toBeGreaterThan(0)
    expect(visible.length).toBeLessThan(100)
  })
})

/**
 * 快取管理測試
 */
describe('Cache Manager Module', () => {
  const { createCacheManager } = await import('./js/cache-manager.js')

  it('應該存儲和檢索快取', () => {
    const cache = createCacheManager()
    cache.set('key1', { data: 'value' })
    
    expect(cache.get('key1')).toEqual({ data: 'value' })
  })

  it('應該支持 TTL', async () => {
    const cache = createCacheManager()
    cache.set('key1', 'value', { ttl: 100 })
    
    expect(cache.get('key1')).toBe('value')
    await new Promise(r => setTimeout(r, 150))
    expect(cache.get('key1')).toBeNull()
  })

  it('應該按標籤清除快取', () => {
    const cache = createCacheManager()
    cache.set('key1', 'value1', { tags: ['tasks'] })
    cache.set('key2', 'value2', { tags: ['users'] })
    
    cache.clearByTag('tasks')
    
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBe('value2')
  })

  it('應該生成統計信息', () => {
    const cache = createCacheManager()
    cache.set('key1', 'value')
    
    const stats = cache.getStats()
    expect(stats.size).toBe(1)
  })
})
