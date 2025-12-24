/**
 * 用戶權限管理模塊
 * 支持多角色、多權限的權限控制系統
 */

/**
 * 內置角色定義
 */
export const ROLES = {
  ADMIN: 'admin',              // 管理員 - 完全控制
  MANAGER: 'manager',          // 經理 - 管理用戶和任務
  USER: 'user',                // 用戶 - 管理自己的任務
  GUEST: 'guest'               // 訪客 - 僅查看
}

/**
 * 權限定義
 */
export const PERMISSIONS = {
  // 用戶管理
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 任務管理
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_EXECUTE: 'task:execute',

  // 統計和報告
  STATS_VIEW: 'stats:view',
  STATS_EXPORT: 'stats:export',

  // 系統管理
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_BACKUP: 'system:backup'
}

/**
 * 預定義的角色權限映射
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_EXECUTE,
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.STATS_EXPORT,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_BACKUP
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_EXECUTE,
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.STATS_EXPORT
  ],
  [ROLES.USER]: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_EXECUTE,
    PERMISSIONS.STATS_VIEW
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.STATS_VIEW
  ]
}

/**
 * 創建權限管理器實例
 * @returns {Object} 權限管理器
 */
export function createPermissionManager() {
  const users = new Map()
  const customRoles = new Map()

  return {
    /**
     * 註冊用戶
     * @param {string} userId - 用戶 ID
     * @param {string} role - 角色
     * @param {Array<string>} customPermissions - 自定義權限
     */
    registerUser: (userId, role = ROLES.USER, customPermissions = []) => {
      const permissions = new Set([
        ...ROLE_PERMISSIONS[role] || [],
        ...customPermissions
      ])

      users.set(userId, {
        userId,
        role,
        permissions: Array.from(permissions),
        createdAt: new Date().toISOString(),
        lastLogin: null,
        metadata: {}
      })
    },

    /**
     * 檢查用戶是否擁有權限
     * @param {string} userId - 用戶 ID
     * @param {string} permission - 權限名稱
     * @returns {boolean}
     */
    hasPermission: (userId, permission) => {
      const user = users.get(userId)
      if (!user) return false
      return user.permissions.includes(permission)
    },

    /**
     * 檢查用戶是否擁有任何指定權限
     * @param {string} userId - 用戶 ID
     * @param {Array<string>} permissions - 權限列表
     * @returns {boolean}
     */
    hasAnyPermission: (userId, permissions) => {
      const user = users.get(userId)
      if (!user) return false
      return permissions.some(p => user.permissions.includes(p))
    },

    /**
     * 檢查用戶是否擁有所有指定權限
     * @param {string} userId - 用戶 ID
     * @param {Array<string>} permissions - 權限列表
     * @returns {boolean}
     */
    hasAllPermissions: (userId, permissions) => {
      const user = users.get(userId)
      if (!user) return false
      return permissions.every(p => user.permissions.includes(p))
    },

    /**
     * 獲取用戶信息
     * @param {string} userId - 用戶 ID
     * @returns {Object}
     */
    getUser: (userId) => {
      const user = users.get(userId)
      return user ? { ...user } : null
    },

    /**
     * 更新用戶角色
     * @param {string} userId - 用戶 ID
     * @param {string} newRole - 新角色
     */
    updateUserRole: (userId, newRole) => {
      const user = users.get(userId)
      if (!user) {
        throw new Error(`用戶 ${userId} 不存在`)
      }

      if (!ROLE_PERMISSIONS[newRole]) {
        throw new Error(`角色 ${newRole} 不存在`)
      }

      user.role = newRole
      user.permissions = [...ROLE_PERMISSIONS[newRole]]
    },

    /**
     * 添加用戶權限
     * @param {string} userId - 用戶 ID
     * @param {string|Array<string>} permissions - 權限或權限列表
     */
    grantPermissions: (userId, permissions) => {
      const user = users.get(userId)
      if (!user) {
        throw new Error(`用戶 ${userId} 不存在`)
      }

      const permList = Array.isArray(permissions) ? permissions : [permissions]
      const permSet = new Set(user.permissions)

      permList.forEach(p => permSet.add(p))
      user.permissions = Array.from(permSet)
    },

    /**
     * 撤銷用戶權限
     * @param {string} userId - 用戶 ID
     * @param {string|Array<string>} permissions - 權限或權限列表
     */
    revokePermissions: (userId, permissions) => {
      const user = users.get(userId)
      if (!user) {
        throw new Error(`用戶 ${userId} 不存在`)
      }

      const permList = Array.isArray(permissions) ? permissions : [permissions]
      const permSet = new Set(user.permissions)

      permList.forEach(p => permSet.delete(p))
      user.permissions = Array.from(permSet)
    },

    /**
     * 創建自定義角色
     * @param {string} roleName - 角色名稱
     * @param {Array<string>} permissions - 權限列表
     */
    createCustomRole: (roleName, permissions = []) => {
      if (ROLE_PERMISSIONS[roleName]) {
        throw new Error(`角色 ${roleName} 已存在`)
      }

      customRoles.set(roleName, {
        name: roleName,
        permissions,
        createdAt: new Date().toISOString()
      })

      ROLE_PERMISSIONS[roleName] = permissions
    },

    /**
     * 獲取角色信息
     * @param {string} roleName - 角色名稱
     * @returns {Object}
     */
    getRole: (roleName) => {
      const role = customRoles.get(roleName)
      return role ? { ...role } : {
        name: roleName,
        permissions: ROLE_PERMISSIONS[roleName] || [],
        builtin: true
      }
    },

    /**
     * 列出所有角色
     * @returns {Array<Object>}
     */
    listRoles: () => {
      const builtInRoles = Object.keys(ROLE_PERMISSIONS).map(name => ({
        name,
        permissions: ROLE_PERMISSIONS[name],
        builtin: true
      }))

      const customRolesList = Array.from(customRoles.values()).map(role => ({
        ...role,
        builtin: false
      }))

      return [...builtInRoles, ...customRolesList]
    },

    /**
     * 列出所有用戶
     * @returns {Array<Object>}
     */
    listUsers: () => {
      return Array.from(users.values()).map(user => ({ ...user }))
    },

    /**
     * 刪除用戶
     * @param {string} userId - 用戶 ID
     */
    deleteUser: (userId) => {
      users.delete(userId)
    },

    /**
     * 更新用戶最後登錄時間
     * @param {string} userId - 用戶 ID
     */
    updateLastLogin: (userId) => {
      const user = users.get(userId)
      if (user) {
        user.lastLogin = new Date().toISOString()
      }
    },

    /**
     * 設置用戶元數據
     * @param {string} userId - 用戶 ID
     * @param {Object} metadata - 元數據
     */
    setUserMetadata: (userId, metadata) => {
      const user = users.get(userId)
      if (user) {
        user.metadata = { ...user.metadata, ...metadata }
      }
    }
  }
}

/**
 * 創建任務級別的權限檢查器
 * @param {Object} permissionManager - 權限管理器
 * @returns {Object} 任務權限檢查器
 */
export function createTaskPermissionChecker(permissionManager) {
  return {
    /**
     * 檢查用戶是否可以創建任務
     * @param {string} userId - 用戶 ID
     * @returns {boolean}
     */
    canCreateTask: (userId) => {
      return permissionManager.hasPermission(userId, PERMISSIONS.TASK_CREATE)
    },

    /**
     * 檢查用戶是否可以讀取任務
     * @param {string} userId - 用戶 ID
     * @param {Object} task - 任務對象
     * @returns {boolean}
     */
    canReadTask: (userId, task) => {
      if (permissionManager.hasPermission(userId, PERMISSIONS.TASK_READ)) {
        // 如果是自己的任務或有管理員權限，允許讀取
        return task.userId === userId || permissionManager.hasPermission(userId, PERMISSIONS.SYSTEM_CONFIG)
      }
      return false
    },

    /**
     * 檢查用戶是否可以編輯任務
     * @param {string} userId - 用戶 ID
     * @param {Object} task - 任務對象
     * @returns {boolean}
     */
    canUpdateTask: (userId, task) => {
      if (!permissionManager.hasPermission(userId, PERMISSIONS.TASK_UPDATE)) {
        return false
      }
      // 只能編輯自己的任務或有管理員權限
      return task.userId === userId || permissionManager.hasPermission(userId, PERMISSIONS.SYSTEM_CONFIG)
    },

    /**
     * 檢查用戶是否可以刪除任務
     * @param {string} userId - 用戶 ID
     * @param {Object} task - 任務對象
     * @returns {boolean}
     */
    canDeleteTask: (userId, task) => {
      if (!permissionManager.hasPermission(userId, PERMISSIONS.TASK_DELETE)) {
        return false
      }
      return task.userId === userId || permissionManager.hasPermission(userId, PERMISSIONS.SYSTEM_CONFIG)
    },

    /**
     * 檢查用戶是否可以執行任務
     * @param {string} userId - 用戶 ID
     * @param {Object} task - 任務對象
     * @returns {boolean}
     */
    canExecuteTask: (userId, task) => {
      if (!permissionManager.hasPermission(userId, PERMISSIONS.TASK_EXECUTE)) {
        return false
      }
      return task.userId === userId || permissionManager.hasPermission(userId, PERMISSIONS.SYSTEM_CONFIG)
    },

    /**
     * 過濾用戶可見的任務列表
     * @param {string} userId - 用戶 ID
     * @param {Array<Object>} tasks - 任務列表
     * @returns {Array<Object>}
     */
    filterVisibleTasks: (userId, tasks) => {
      const isAdmin = permissionManager.hasPermission(userId, PERMISSIONS.SYSTEM_CONFIG)
      const canRead = permissionManager.hasPermission(userId, PERMISSIONS.TASK_READ)

      if (!canRead) {
        return []
      }

      if (isAdmin) {
        return tasks
      }

      // 普通用戶只能看到自己的任務
      return tasks.filter(task => task.userId === userId)
    }
  }
}

/**
 * 創建操作審計日誌
 * @returns {Object} 審計日誌管理器
 */
export function createAuditLogger() {
  const logs = []

  return {
    /**
     * 記錄操作
     * @param {string} userId - 用戶 ID
     * @param {string} action - 操作名稱
     * @param {Object} details - 操作詳情
     */
    log: (userId, action, details = {}) => {
      logs.push({
        timestamp: new Date().toISOString(),
        userId,
        action,
        details,
        ipAddress: details.ipAddress || 'unknown'
      })
    },

    /**
     * 獲取用戶的操作日誌
     * @param {string} userId - 用戶 ID
     * @param {Object} options - 過濾選項
     * @returns {Array<Object>}
     */
    getUserLogs: (userId, options = {}) => {
      let result = logs.filter(log => log.userId === userId)

      if (options.action) {
        result = result.filter(log => log.action === options.action)
      }

      if (options.since) {
        const since = new Date(options.since)
        result = result.filter(log => new Date(log.timestamp) >= since)
      }

      return result
    },

    /**
     * 獲取所有操作日誌
     * @returns {Array<Object>}
     */
    getAllLogs: () => {
      return [...logs]
    },

    /**
     * 清除過期的日誌
     * @param {number} daysOld - 多少天前的日誌
     */
    clearOldLogs: (daysOld = 30) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      logs.splice(0, logs.length, ...logs.filter(
        log => new Date(log.timestamp) >= cutoffDate
      ))
    }
  }
}

/**
 * 生成權限報告
 * @param {Object} permissionManager - 權限管理器
 * @returns {Object} 權限報告
 */
export function generatePermissionReport(permissionManager) {
  const users = permissionManager.listUsers()
  const roles = permissionManager.listRoles()

  const usersByRole = {}
  roles.forEach(role => {
    usersByRole[role.name] = users.filter(u => u.role === role.name).length
  })

  return {
    generatedAt: new Date().toISOString(),
    totalUsers: users.length,
    totalRoles: roles.length,
    usersByRole,
    roles: roles.map(role => ({
      name: role.name,
      permissions: role.permissions,
      builtin: role.builtin
    })),
    users: users.map(user => ({
      userId: user.userId,
      role: user.role,
      permissionCount: user.permissions.length,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }))
  }
}
