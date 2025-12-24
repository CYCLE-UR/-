/**
 * Vue 3 應用主邏輯
 */

const { createApp, ref, reactive, computed, onMounted, onUnmounted } = Vue

// 動態導入存儲模塊
const { initGUN, loginAnonymous, getCurrentUser, isLoggedIn, logout } = await import('./storage.js')

// 應用組件
const app = createApp({
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- 頂部導航 -->
      <nav class="bg-white shadow-md">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="text-2xl font-bold text-indigo-600">🎫</div>
            <h1 class="text-xl font-bold text-gray-800">智能搶票助手</h1>
          </div>
          <div class="flex items-center gap-4">
            <span v-if="isLoggedIn" class="text-sm text-gray-600">
              用戶 ID: {{ truncateId(currentUser?.id) }}
            </span>
            <button 
              @click="handleLogout"
              class="btn-secondary text-sm"
            >
              {{ isLoggedIn ? '登出' : '登入' }}
            </button>
          </div>
        </div>
      </nav>

      <!-- 主容器 -->
      <main class="max-w-6xl mx-auto px-4 py-8">
        <!-- 加載狀態 -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <div class="spinner"></div>
          <p class="ml-4 text-gray-600">加載中...</p>
        </div>

        <!-- 錯誤提示 -->
        <div 
          v-if="errorMessage" 
          class="notification notification-error fade-in"
        >
          <p class="font-semibold">錯誤</p>
          <p>{{ errorMessage }}</p>
          <button 
            @click="errorMessage = ''"
            class="text-sm underline mt-2"
          >
            關閉
          </button>
        </div>

        <!-- 成功提示 -->
        <div 
          v-if="successMessage" 
          class="notification notification-success fade-in"
        >
          <p class="font-semibold">✓ 成功</p>
          <p>{{ successMessage }}</p>
        </div>

        <!-- 內容區域 -->
        <div v-if="!isLoading && isLoggedIn" class="space-y-6">
          <!-- 歡迎卡片 -->
          <div class="card">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">歡迎使用智能搶票助手！</h2>
            <p class="text-gray-600 mb-4">
              這是一個幫助追星族自動搶購演唱會門票的工具。
            </p>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-3xl mb-2">🤖</div>
                <h3 class="font-semibold text-gray-800">自動搶票</h3>
                <p class="text-sm text-gray-600">設置時間和目標自動執行</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-3xl mb-2">🔄</div>
                <h3 class="font-semibold text-gray-800">多設備同步</h3>
                <p class="text-sm text-gray-600">跨設備實時數據同步</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-3xl mb-2">🔒</div>
                <h3 class="font-semibold text-gray-800">隱私保護</h3>
                <p class="text-sm text-gray-600">完全本地化，無後端</p>
              </div>
            </div>
          </div>

          <!-- 功能列表 -->
          <div class="card">
            <h3 class="text-xl font-bold text-gray-800 mb-4">核心功能</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-xl">✓</span>
                <div>
                  <p class="font-semibold text-gray-800">搶票任務管理</p>
                  <p class="text-sm text-gray-600">創建、編輯和管理搶票任務</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-xl">✓</span>
                <div>
                  <p class="font-semibold text-gray-800">自動搶票引擎</p>
                  <p class="text-sm text-gray-600">定時執行自動購票操作</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-xl">✓</span>
                <div>
                  <p class="font-semibold text-gray-800">實時通知</p>
                  <p class="text-sm text-gray-600">搶票狀態實時推送</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-xl">✓</span>
                <div>
                  <p class="font-semibold text-gray-800">歷史記錄</p>
                  <p class="text-sm text-gray-600">查看搶票歷史和統計數據</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 下一步指引 -->
          <div class="card bg-indigo-50 border-2 border-indigo-200">
            <h3 class="text-lg font-bold text-indigo-900 mb-2">🚀 下一步</h3>
            <p class="text-indigo-800 mb-4">
              當前應用已成功初始化，您可以開始創建搶票任務。
            </p>
            <button class="btn-primary">
              創建第一個任務
            </button>
          </div>
        </div>

        <!-- 未登錄提示 -->
        <div v-if="!isLoading && !isLoggedIn" class="card text-center py-12">
          <div class="text-6xl mb-4">🎫</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">歡迎來到智能搶票助手</h2>
          <p class="text-gray-600 mb-6">
            點擊下方按鈕開始使用
          </p>
          <button 
            @click="handleLogin"
            class="btn-primary"
          >
            開始使用
          </button>
        </div>
      </main>

      <!-- 底部 -->
      <footer class="bg-gray-800 text-gray-400 py-8 mt-12">
        <div class="max-w-6xl mx-auto px-4 text-center">
          <p class="mb-2">智能搶票助手 v0.1.0</p>
          <p class="text-sm">Pure Frontend Application · Powered by Vue 3 & GUN.js</p>
        </div>
      </footer>
    </div>
  `,

  setup() {
    const isLoading = ref(true)
    const isUserLoggedIn = ref(false)
    const currentUserData = ref(null)
    const errorMessage = ref('')
    const successMessage = ref('')

    const currentUser = computed(() => currentUserData.value)
    const isLoggedIn = computed(() => isUserLoggedIn.value)

    const truncateId = (id) => {
      if (!id) return ''
      return id.substring(0, 8) + '...'
    }

    const handleLogin = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''
        const user = await loginAnonymous()
        currentUserData.value = user
        isUserLoggedIn.value = true
        successMessage.value = '登入成功！'
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      } catch (error) {
        errorMessage.value = error.message
        console.error('登入失敗:', error)
      } finally {
        isLoading.value = false
      }
    }

    const handleLogout = async () => {
      try {
        await logout()
        currentUserData.value = null
        isUserLoggedIn.value = false
        successMessage.value = '登出成功！'
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      } catch (error) {
        errorMessage.value = error.message
        console.error('登出失敗:', error)
      }
    }

    const initializeApp = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''
        
        // 初始化 GUN
        await initGUN()

        // 檢查是否已登錄
        const user = getCurrentUser()
        if (user) {
          currentUserData.value = user
          isUserLoggedIn.value = true
        }
      } catch (error) {
        errorMessage.value = '應用初始化失敗: ' + error.message
        console.error('初始化失敗:', error)
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      initializeApp()
    })

    return {
      isLoading,
      errorMessage,
      successMessage,
      currentUser,
      isLoggedIn,
      handleLogin,
      handleLogout,
      truncateId
    }
  }
})

// 掛載應用
app.mount('#app')
