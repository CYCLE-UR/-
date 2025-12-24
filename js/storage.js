/**
 * GUN.js 數據存儲管理層
 * 提供用戶認證、數據 CRUD 操作和跨設備同步
 */

// GUN 數據庫實例
let gun = null
let currentUser = null

/**
 * 初始化 GUN.js 實例
 * @param {Object} options - 配置選項
 * @param {string} options.peersUrl - GUN 伺服器地址（可選）
 * @returns {Promise<void>}
 */
export async function initGUN(options = {}) {
  if (typeof Gun === 'undefined') {
    throw new Error('GUN.js 未加載，請檢查 CDN 鏈接')
  }

  const config = {
    peers: options.peersUrl ? [options.peersUrl] : []
  }

  gun = new Gun(config)
  
  // 從本地存儲恢復用戶會話
  const savedUserId = localStorage.getItem('gun_user_id')
  if (savedUserId) {
    try {
      await restoreUserSession(savedUserId)
    } catch (error) {
      console.warn('無法恢復用戶會話:', error)
    }
  }

  return Promise.resolve()
}

/**
 * 匿名登錄（創建臨時用戶）
 * @returns {Promise<Object>} 用戶對象
 */
export async function loginAnonymous() {
  if (!gun) {
    throw new Error('GUN 未初始化，請先調用 initGUN()')
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const user = {
    id: userId,
    createdAt: new Date().toISOString(),
    anonymous: true
  }

  currentUser = user
  localStorage.setItem('gun_user_id', userId)

  return user
}

/**
 * 恢復用戶會話
 * @param {string} userId - 用戶 ID
 * @returns {Promise<Object>} 用戶對象
 */
export async function restoreUserSession(userId) {
  const user = {
    id: userId,
    anonymous: true
  }

  currentUser = user
  return user
}

/**
 * 登出當前用戶
 * @returns {Promise<void>}
 */
export async function logout() {
  currentUser = null
  localStorage.removeItem('gun_user_id')
  return Promise.resolve()
}

/**
 * 獲取當前用戶
 * @returns {Object | null} 當前用戶對象或 null
 */
export function getCurrentUser() {
  return currentUser
}

/**
 * 檢查是否已登錄
 * @returns {boolean}
 */
export function isLoggedIn() {
  return currentUser !== null
}

/**
 * 創建數據（Create）
 * @param {string} path - 數據路徑，如 'users/task1'
 * @param {Object} data - 要存儲的數據
 * @returns {Promise<Object>} 存儲的數據
 */
export async function createData(path, data) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法存儲數據')
  }

  const timestamp = new Date().toISOString()
  const dataWithMeta = {
    ...data,
    id: data.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId: currentUser.id
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  return new Promise((resolve, reject) => {
    reference.put(dataWithMeta, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err))
      } else {
        resolve(dataWithMeta)
      }
    })
  })
}

/**
 * 讀取數據（Read）
 * @param {string} path - 數據路徑
 * @returns {Promise<Object>} 讀取的數據
 */
export async function readData(path) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法讀取數據')
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('讀取超時'))
    }, 5000)

    reference.once((data) => {
      clearTimeout(timeout)
      if (data) {
        resolve(data)
      } else {
        resolve(null)
      }
    }, { wait: 100 })
  })
}

/**
 * 更新數據（Update）
 * @param {string} path - 數據路徑
 * @param {Object} updates - 要更新的欄位
 * @returns {Promise<Object>} 更新後的數據
 */
export async function updateData(path, updates) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法更新數據')
  }

  const existingData = await readData(path)
  if (!existingData) {
    throw new Error('數據不存在')
  }

  const updatedData = {
    ...existingData,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  return new Promise((resolve, reject) => {
    reference.put(updatedData, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err))
      } else {
        resolve(updatedData)
      }
    })
  })
}

/**
 * 刪除數據（Delete）
 * @param {string} path - 數據路徑
 * @returns {Promise<void>}
 */
export async function deleteData(path) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法刪除數據')
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  return new Promise((resolve, reject) => {
    reference.put(null, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err))
      } else {
        resolve()
      }
    })
  })
}

/**
 * 列出某路徑下的所有數據
 * @param {string} path - 數據路徑
 * @returns {Promise<Object>} 數據集合
 */
export async function listData(path) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法列出數據')
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('讀取超時'))
    }, 5000)

    const data = {}
    reference.map().on((value, key) => {
      if (value) {
        data[key] = value
      }
    })

    reference.once(() => {
      clearTimeout(timeout)
      resolve(data)
    })
  })
}

/**
 * 監聽數據變化（實時同步）
 * @param {string} path - 數據路徑
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消監聽的函數
 */
export function watchData(path, callback) {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }

  if (!currentUser) {
    throw new Error('未登錄，無法監聽數據')
  }

  const keys = path.split('/')
  let reference = gun.user(currentUser.id)

  for (const key of keys) {
    reference = reference.get(key)
  }

  const unsubscribe = reference.on((data) => {
    if (data) {
      callback(null, data)
    }
  })

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe()
    }
  }
}

/**
 * 獲取 GUN 實例（高級用法）
 * @returns {Object} GUN 實例
 */
export function getGUN() {
  if (!gun) {
    throw new Error('GUN 未初始化')
  }
  return gun
}
