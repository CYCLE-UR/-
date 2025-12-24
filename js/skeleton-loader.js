/**
 * 骨架屏加載組件
 * 提供美觀的加載狀態提示
 */

/**
 * HTML 骨架屏模板
 */
export const SKELETON_TEMPLATES = {
  // 任務卡片骨架屏
  taskCard: `
    <div class="skeleton-card">
      <div class="skeleton skeleton-text" style="width: 60%; height: 20px; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; height: 16px; margin-bottom: 12px;"></div>
      <div class="skeleton skeleton-text" style="width: 100%; height: 12px; margin-bottom: 6px;"></div>
      <div class="skeleton skeleton-text" style="width: 85%; height: 12px; margin-bottom: 12px;"></div>
      <div style="display: flex; gap: 8px;">
        <div class="skeleton skeleton-button" style="flex: 1; height: 32px;"></div>
        <div class="skeleton skeleton-button" style="flex: 1; height: 32px;"></div>
      </div>
    </div>
  `,

  // 列表項骨架屏
  listItem: `
    <div class="skeleton-list-item">
      <div class="skeleton skeleton-text" style="width: 30%; height: 18px;"></div>
      <div class="skeleton skeleton-text" style="width: 50%; height: 14px;"></div>
      <div class="skeleton skeleton-text" style="width: 60%; height: 14px;"></div>
    </div>
  `,

  // 表格行骨架屏
  tableRow: `
    <tr class="skeleton-row">
      <td><div class="skeleton skeleton-text" style="width: 80%; height: 14px;"></div></td>
      <td><div class="skeleton skeleton-text" style="width: 70%; height: 14px;"></div></td>
      <td><div class="skeleton skeleton-text" style="width: 60%; height: 14px;"></div></td>
      <td><div class="skeleton skeleton-text" style="width: 50%; height: 14px;"></div></td>
    </tr>
  `,

  // 詳情頁骨架屏
  detail: `
    <div class="skeleton-detail">
      <div class="skeleton skeleton-text" style="width: 40%; height: 28px; margin-bottom: 20px;"></div>
      <div style="margin-bottom: 20px;">
        <div class="skeleton skeleton-text" style="width: 20%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text" style="width: 100%; height: 14px;"></div>
      </div>
      <div style="margin-bottom: 20px;">
        <div class="skeleton skeleton-text" style="width: 20%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text" style="width: 100%; height: 14px;"></div>
      </div>
    </div>
  `,

  // 儀表板骨架屏
  dashboard: `
    <div class="skeleton-dashboard">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="skeleton-card" style="height: 100px;"></div>
        <div class="skeleton-card" style="height: 100px;"></div>
        <div class="skeleton-card" style="height: 100px;"></div>
        <div class="skeleton-card" style="height: 100px;"></div>
      </div>
      <div class="skeleton-card" style="height: 300px;"></div>
    </div>
  `
}

/**
 * CSS 骨架屏樣式
 */
export const SKELETON_STYLES = `
  .skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .skeleton-text {
    border-radius: 4px;
    display: block;
  }

  .skeleton-button {
    border-radius: 6px;
  }

  .skeleton-card {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
  }

  .skeleton-list-item {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid #f5f5f5;
  }

  .skeleton-row td {
    padding: 12px;
  }

  .skeleton-detail {
    padding: 16px;
  }

  .skeleton-dashboard {
    padding: 16px;
  }

  .skeleton-loader {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid #f0f0f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: skeleton-spin 0.8s linear infinite;
  }

  @keyframes skeleton-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .skeleton-pulse {
    animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

/**
 * 創建骨架屏管理器
 * @returns {Object} 骨架屏管理器
 */
export function createSkeletonManager() {
  const activeSkeletons = new Map()

  return {
    /**
     * 顯示骨架屏
     * @param {HTMLElement} container - 容器元素
     * @param {string} templateName - 模板名稱
     * @param {number} count - 顯示個數
     */
    show: (container, templateName = 'taskCard', count = 3) => {
      if (!container) return

      const template = SKELETON_TEMPLATES[templateName] || SKELETON_TEMPLATES.taskCard
      let html = ''

      for (let i = 0; i < count; i++) {
        html += template
      }

      container.innerHTML = html
      activeSkeletons.set(container, { templateName, count })
    },

    /**
     * 隱藏骨架屏
     * @param {HTMLElement} container - 容器元素
     */
    hide: (container) => {
      if (container) {
        container.innerHTML = ''
        activeSkeletons.delete(container)
      }
    },

    /**
     * 替換為實際內容
     * @param {HTMLElement} container - 容器元素
     * @param {string} content - 實際內容
     */
    replace: (container, content) => {
      if (container) {
        container.innerHTML = content
        activeSkeletons.delete(container)
      }
    },

    /**
     * 清除所有骨架屏
     */
    clearAll: () => {
      activeSkeletons.forEach((_, container) => {
        if (container && container.parentNode) {
          container.innerHTML = ''
        }
      })
      activeSkeletons.clear()
    },

    /**
     * 添加樣式到文檔
     */
    injectStyles: () => {
      const styleId = 'skeleton-styles'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = SKELETON_STYLES
        document.head.appendChild(style)
      }
    }
  }
}

/**
 * Vue 3 骨架屏組件
 * @example
 * <template>
 *   <div class="task-list">
 *     <Skeleton v-if="loading" type="taskCard" :count="3" />
 *     <TaskCard v-else v-for="task in tasks" :key="task.id" :task="task" />
 *   </div>
 * </template>
 */
export const SkeletonComponent = {
  name: 'Skeleton',
  props: {
    type: {
      type: String,
      default: 'taskCard'
    },
    count: {
      type: Number,
      default: 3
    }
  },
  setup(props) {
    const manager = createSkeletonManager()
    
    return {
      manager,
      templates: SKELETON_TEMPLATES,
      props
    }
  },
  mounted() {
    this.manager.injectStyles()
  },
  template: `
    <div class="skeleton-container">
      <div 
        v-for="i in count" 
        :key="i"
        v-html="templates[type] || templates.taskCard"
      ></div>
    </div>
  `
}

/**
 * 加載狀態指示器
 * @returns {Object}
 */
export function createLoadingIndicator() {
  let loadingCount = 0
  const callbacks = new Set()

  return {
    /**
     * 開始加載
     */
    start: () => {
      loadingCount++
      if (loadingCount === 1) {
        callbacks.forEach(cb => cb(true))
      }
    },

    /**
     * 結束加載
     */
    end: () => {
      loadingCount = Math.max(0, loadingCount - 1)
      if (loadingCount === 0) {
        callbacks.forEach(cb => cb(false))
      }
    },

    /**
     * 監聽加載狀態變化
     * @param {Function} callback - 回調函數
     */
    watch: (callback) => {
      callbacks.add(callback)
      return () => callbacks.delete(callback)
    },

    /**
     * 獲取當前加載狀態
     * @returns {boolean}
     */
    isLoading: () => loadingCount > 0,

    /**
     * 重置加載計數
     */
    reset: () => {
      loadingCount = 0
      callbacks.forEach(cb => cb(false))
    }
  }
}

/**
 * 異步加載包裝器
 * @param {Function} asyncFn - 異步函數
 * @param {Object} options - 選項
 * @param {HTMLElement} options.container - 容器元素
 * @param {string} options.skeletonType - 骨架屏類型
 * @param {number} options.minLoadingTime - 最小加載時間（毫秒）
 * @returns {Promise}
 */
export async function withSkeleton(asyncFn, options = {}) {
  const {
    container = null,
    skeletonType = 'taskCard',
    minLoadingTime = 300
  } = options

  const manager = createSkeletonManager()
  manager.injectStyles()

  if (container) {
    manager.show(container, skeletonType)
  }

  const startTime = Date.now()

  try {
    const result = await asyncFn()
    
    // 確保加載時間不會太短（避免閃爍）
    const elapsed = Date.now() - startTime
    if (elapsed < minLoadingTime) {
      await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
    }

    if (container) {
      manager.hide(container)
    }

    return result
  } catch (error) {
    if (container) {
      manager.hide(container)
    }
    throw error
  }
}
