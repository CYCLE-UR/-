/**
 * 虛擬滾動組件
 * 高效渲染大列表，只渲染可見區域的項目
 */

/**
 * 虛擬滾動配置
 * @typedef {Object} VirtualScrollConfig
 * @property {number} itemHeight - 每項的高度（像素）
 * @property {number} containerHeight - 容器高度（像素）
 * @property {number} bufferSize - 緩衝區大小（項數）
 * @property {number} scrollThrottle - 滾動節流時間（毫秒）
 */

/**
 * 創建虛擬滾動管理器
 * @param {Array} items - 項目列表
 * @param {VirtualScrollConfig} config - 配置
 * @returns {Object} 虛擬滾動管理器
 */
export function createVirtualScroll(items = [], config = {}) {
  const {
    itemHeight = 60,
    containerHeight = 600,
    bufferSize = 5,
    scrollThrottle = 100
  } = config

  let scrollTop = 0
  let lastScrollTime = 0
  let visibleRange = { start: 0, end: 0 }

  return {
    /**
     * 更新滾動位置
     * @param {number} newScrollTop - 新的滾動位置
     * @param {boolean} force - 是否強制更新
     */
    updateScroll: (newScrollTop, force = false) => {
      const now = Date.now()
      
      if (!force && now - lastScrollTime < scrollThrottle) {
        return visibleRange
      }

      scrollTop = Math.max(0, Math.min(newScrollTop, getTotalHeight() - containerHeight))
      lastScrollTime = now

      const newVisibleRange = calculateVisibleRange()
      visibleRange = newVisibleRange

      return visibleRange
    },

    /**
     * 獲取可見的項目列表
     * @returns {Array<Object>} 可見項目及其索引
     */
    getVisibleItems: () => {
      const { start, end } = visibleRange
      return items.slice(start, end).map((item, i) => ({
        item,
        index: start + i,
        offsetY: (start + i) * itemHeight
      }))
    },

    /**
     * 獲取總高度
     * @returns {number}
     */
    getTotalHeight: getTotalHeight,

    /**
     * 更新項目列表
     * @param {Array} newItems - 新的項目列表
     */
    updateItems: (newItems) => {
      items = newItems || []
      visibleRange = calculateVisibleRange()
    },

    /**
     * 滾動到特定項目
     * @param {number} index - 項目索引
     */
    scrollToItem: (index) => {
      const targetScrollTop = Math.max(0, index * itemHeight - containerHeight / 2)
      return module.exports.createVirtualScroll(items, config).updateScroll(targetScrollTop, true)
    },

    /**
     * 滾動到頂部
     */
    scrollToTop: () => {
      scrollTop = 0
      visibleRange = calculateVisibleRange()
      return visibleRange
    },

    /**
     * 滾動到底部
     */
    scrollToBottom: () => {
      scrollTop = Math.max(0, getTotalHeight() - containerHeight)
      visibleRange = calculateVisibleRange()
      return visibleRange
    }
  }

  function getTotalHeight() {
    return items.length * itemHeight
  }

  function calculateVisibleRange() {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length, start + visibleCount + bufferSize * 2)

    return {
      start: Math.max(0, start - bufferSize),
      end,
      firstVisibleIndex: start,
      lastVisibleIndex: start + visibleCount - 1
    }
  }
}

/**
 * Vue 3 虛擬滾動指令
 * 用法: v-virtual-scroll="{ items, itemHeight: 60 }"
 */
export const vVirtualScroll = {
  mounted(el, binding) {
    const { items = [], itemHeight = 60 } = binding.value || {}
    
    const virtualScroll = createVirtualScroll(items, {
      itemHeight,
      containerHeight: el.clientHeight
    })

    el.addEventListener('scroll', () => {
      virtualScroll.updateScroll(el.scrollTop)
      // 更新渲染可以通過 Vue 事件觸發
      el.dispatchEvent(new CustomEvent('virtual-scroll-update', {
        detail: { visibleRange: virtualScroll.getVisibleItems() }
      }))
    })

    el.$virtualScroll = virtualScroll
  },

  updated(el, binding) {
    const { items = [] } = binding.value || {}
    if (el.$virtualScroll) {
      el.$virtualScroll.updateItems(items)
    }
  }
}
