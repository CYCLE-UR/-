/**
 * 協作功能系統測試
 * 測試邀請、朋友管理、共享任務、協作等功能
 * @version 1.0
 */

import { describe, it, expect, beforeEach } from 'vitest'

// 模擬協作系統的實現
function createCollaborationManager() {
  const friends = new Map()
  const sharedTasks = new Map()
  const invitations = new Map()
  const collaborations = new Map()

  const generateInviteCode = (expiresIn = 7 * 24 * 60 * 60 * 1000) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = Date.now() + expiresIn
    return {
      code,
      createdAt: Date.now(),
      expiresAt,
      used: false,
      usedBy: null,
      isValid: () => Date.now() < expiresAt && !used
    }
  }

  const inviteFriend = (currentUser, targetEmail, message = '') => {
    const inviteCode = generateInviteCode()
    const invitation = {
      id: `invite-${Date.now()}-${Math.random()}`,
      from: currentUser,
      to: targetEmail,
      code: inviteCode.code,
      message,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: inviteCode.expiresAt,
      inviteUrl: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost'}?invite=${inviteCode.code}`
    }
    invitations.set(invitation.id, invitation)
    return invitation
  }

  const acceptInvitation = (inviteCode, acceptingUser) => {
    let accepted = null
    invitations.forEach((invitation, id) => {
      if (invitation.code === inviteCode && invitation.status === 'pending') {
        if (Date.now() > invitation.expiresAt) {
          invitation.status = 'expired'
          return
        }
        invitation.status = 'accepted'
        invitation.acceptedAt = Date.now()
        invitation.acceptedBy = acceptingUser
        addFriend(invitation.from, acceptingUser)
        addFriend(acceptingUser, invitation.from)
        accepted = invitation
      }
    })
    return accepted
  }

  const addFriend = (user, friendUsername) => {
    if (!friends.has(user)) {
      friends.set(user, [])
    }
    const friendList = friends.get(user)
    if (!friendList.find(f => f.username === friendUsername)) {
      friendList.push({
        username: friendUsername,
        addedAt: Date.now(),
        status: 'active',
        mutualTasks: []
      })
    }
    return friends.get(user)
  }

  const getFriends = (user) => {
    return friends.get(user) || []
  }

  const removeFriend = (user, friendUsername) => {
    if (friends.has(user)) {
      const friendList = friends.get(user)
      const index = friendList.findIndex(f => f.username === friendUsername)
      if (index !== -1) {
        friendList.splice(index, 1)
      }
    }
  }

  const shareTask = (taskId, task, fromUser, toUsers, permissions = 'view') => {
    const sharedId = `shared-${taskId}-${Date.now()}`
    const shared = {
      id: sharedId,
      taskId,
      task: { ...task },
      from: fromUser,
      to: toUsers,
      permissions,
      sharedAt: Date.now(),
      viewedBy: [],
      lastModified: Date.now()
    }
    sharedTasks.set(sharedId, shared)
    const friendList = friends.get(fromUser) || []
    ;(Array.isArray(toUsers) ? toUsers : [toUsers]).forEach(user => {
      const friend = friendList.find(f => f.username === user)
      if (friend) {
        friend.mutualTasks.push(sharedId)
      }
    })
    return shared
  }

  const getSharedTasks = (user) => {
    const shared = []
    sharedTasks.forEach((task, id) => {
      if (Array.isArray(task.to)) {
        if (task.to.includes(user)) shared.push(task)
      } else if (task.to === user) {
        shared.push(task)
      }
    })
    return shared
  }

  const createCollaboration = (taskId, task, collaborators, permissions = {}) => {
    const collaborationId = `collab-${taskId}-${Date.now()}`
    const collaboration = {
      id: collaborationId,
      taskId,
      task: { ...task },
      collaborators: collaborators.map(collab => ({
        username: collab,
        joinedAt: Date.now(),
        role: permissions[collab] || 'editor',
        lastActivityTime: Date.now()
      })),
      createdAt: Date.now(),
      activities: [],
      comments: [],
      status: 'active'
    }
    collaborations.set(collaborationId, collaboration)
    return collaboration
  }

  const addCollaborator = (collaborationId, username, role = 'editor') => {
    const collaboration = collaborations.get(collaborationId)
    if (!collaboration) return null
    const existing = collaboration.collaborators.find(c => c.username === username)
    if (existing) {
      existing.role = role
      return collaboration
    }
    collaboration.collaborators.push({
      username,
      joinedAt: Date.now(),
      role,
      lastActivityTime: Date.now()
    })
    collaboration.activities.push({
      type: 'user_added',
      user: username,
      timestamp: Date.now()
    })
    return collaboration
  }

  const removeCollaborator = (collaborationId, username) => {
    const collaboration = collaborations.get(collaborationId)
    if (!collaboration) return null
    const index = collaboration.collaborators.findIndex(c => c.username === username)
    if (index !== -1) {
      collaboration.collaborators.splice(index, 1)
      collaboration.activities.push({
        type: 'user_removed',
        user: username,
        timestamp: Date.now()
      })
    }
    return collaboration
  }

  const addComment = (collaborationId, author, content) => {
    const collaboration = collaborations.get(collaborationId)
    if (!collaboration) return null
    const comment = {
      id: `comment-${Date.now()}`,
      author,
      content,
      createdAt: Date.now(),
      likes: [],
      replies: []
    }
    collaboration.comments.push(comment)
    collaboration.activities.push({
      type: 'comment_added',
      author,
      timestamp: Date.now()
    })
    return comment
  }

  const addActivity = (collaborationId, type, details = {}) => {
    const collaboration = collaborations.get(collaborationId)
    if (!collaboration) return null
    const activity = {
      type,
      timestamp: Date.now(),
      ...details
    }
    collaboration.activities.push(activity)
    return activity
  }

  const getCollaboration = (collaborationId) => {
    return collaborations.get(collaborationId)
  }

  const getUserCollaborations = (user) => {
    const userCollabs = []
    collaborations.forEach((collab, id) => {
      if (collab.collaborators.some(c => c.username === user)) {
        userCollabs.push(collab)
      }
    })
    return userCollabs
  }

  const getInvitations = (user, type = 'received') => {
    const result = []
    invitations.forEach((invitation, id) => {
      if (type === 'received' && invitation.to === user && invitation.status === 'pending') {
        result.push(invitation)
      } else if (type === 'sent' && invitation.from === user) {
        result.push(invitation)
      }
    })
    return result
  }

  const declineInvitation = (inviteCode) => {
    let declined = null
    invitations.forEach((invitation, id) => {
      if (invitation.code === inviteCode && invitation.status === 'pending') {
        invitation.status = 'declined'
        invitation.declinedAt = Date.now()
        declined = invitation
      }
    })
    return declined
  }

  const getCollaborationStats = (user) => {
    const userCollabs = getUserCollaborations(user)
    const userFriends = getFriends(user)
    return {
      totalCollaborations: userCollabs.length,
      totalFriends: userFriends.length,
      activeTasks: userCollabs.filter(c => c.status === 'active').length,
      totalComments: userCollabs.reduce((sum, c) => sum + c.comments.length, 0),
      totalActivities: userCollabs.reduce((sum, c) => sum + c.activities.length, 0),
      collaborators: new Set(userCollabs.flatMap(c => c.collaborators.map(col => col.username))).size
    }
  }

  return {
    generateInviteCode,
    inviteFriend,
    acceptInvitation,
    declineInvitation,
    addFriend,
    removeFriend,
    getFriends,
    shareTask,
    getSharedTasks,
    createCollaboration,
    addCollaborator,
    removeCollaborator,
    getCollaboration,
    getUserCollaborations,
    addComment,
    addActivity,
    getInvitations,
    getCollaborationStats
  }
}

// 測試套件
describe('協作功能系統', () => {
  let collab

  beforeEach(() => {
    collab = createCollaborationManager()
  })

  // ============== 邀請相關測試 ==============
  describe('邀請功能', () => {
    it('應該能生成唯一的邀請碼', () => {
      const code1 = collab.generateInviteCode()
      const code2 = collab.generateInviteCode()
      expect(code1.code).not.toBe(code2.code)
      expect(code1.code).toMatch(/^[A-Z0-9]+$/)
    })

    it('應該能邀請朋友', () => {
      const invite = collab.inviteFriend('alice', 'bob@example.com', '讓我們開始協作')
      expect(invite.from).toBe('alice')
      expect(invite.to).toBe('bob@example.com')
      expect(invite.message).toBe('讓我們開始協作')
      expect(invite.status).toBe('pending')
    })

    it('應該能接受邀請', () => {
      const invite = collab.inviteFriend('alice', 'bob@example.com')
      const accepted = collab.acceptInvitation(invite.code, 'bob')
      expect(accepted.status).toBe('accepted')
      expect(accepted.acceptedBy).toBe('bob')
    })

    it('接受邀請後應該自動建立朋友關係', () => {
      const invite = collab.inviteFriend('alice', 'bob@example.com')
      collab.acceptInvitation(invite.code, 'bob')
      const aliceFriends = collab.getFriends('alice')
      const bobFriends = collab.getFriends('bob')
      expect(aliceFriends.some(f => f.username === 'bob')).toBe(true)
      expect(bobFriends.some(f => f.username === 'alice')).toBe(true)
    })

    it('應該能拒絕邀請', () => {
      const invite = collab.inviteFriend('alice', 'bob@example.com')
      const declined = collab.declineInvitation(invite.code)
      expect(declined.status).toBe('declined')
      expect(declined.declinedAt).toBeDefined()
    })

    it('應該能獲取待機邀請', () => {
      collab.inviteFriend('alice', 'bob@example.com')
      collab.inviteFriend('charlie', 'bob@example.com')
      const invites = collab.getInvitations('bob@example.com', 'received')
      expect(invites).toHaveLength(2)
      expect(invites.every(i => i.status === 'pending')).toBe(true)
    })

    it('應該能獲取已發送的邀請', () => {
      collab.inviteFriend('alice', 'bob@example.com')
      collab.inviteFriend('alice', 'charlie@example.com')
      const sentInvites = collab.getInvitations('alice', 'sent')
      expect(sentInvites).toHaveLength(2)
      expect(sentInvites.every(i => i.from === 'alice')).toBe(true)
    })
  })

  // ============== 朋友相關測試 ==============
  describe('朋友管理', () => {
    it('應該能添加朋友', () => {
      collab.addFriend('alice', 'bob')
      const friends = collab.getFriends('alice')
      expect(friends).toHaveLength(1)
      expect(friends[0].username).toBe('bob')
    })

    it('不應該添加重複的朋友', () => {
      collab.addFriend('alice', 'bob')
      collab.addFriend('alice', 'bob')
      const friends = collab.getFriends('alice')
      expect(friends).toHaveLength(1)
    })

    it('應該能移除朋友', () => {
      collab.addFriend('alice', 'bob')
      collab.addFriend('alice', 'charlie')
      collab.removeFriend('alice', 'bob')
      const friends = collab.getFriends('alice')
      expect(friends).toHaveLength(1)
      expect(friends[0].username).toBe('charlie')
    })

    it('應該能獲取朋友列表', () => {
      collab.addFriend('alice', 'bob')
      collab.addFriend('alice', 'charlie')
      collab.addFriend('alice', 'david')
      const friends = collab.getFriends('alice')
      expect(friends).toHaveLength(3)
      expect(friends.map(f => f.username)).toEqual(['bob', 'charlie', 'david'])
    })
  })

  // ============== 共享任務相關測試 ==============
  describe('共享任務', () => {
    it('應該能共享任務給朋友', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      collab.addFriend('alice', 'bob')
      const shared = collab.shareTask('1', task, 'alice', 'bob', 'view')
      expect(shared.from).toBe('alice')
      expect(shared.to).toBe('bob')
      expect(shared.permissions).toBe('view')
    })

    it('應該能共享任務給多個朋友', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      collab.addFriend('alice', 'bob')
      collab.addFriend('alice', 'charlie')
      const shared = collab.shareTask('1', task, 'alice', ['bob', 'charlie'], 'edit')
      expect(Array.isArray(shared.to)).toBe(true)
      expect(shared.to).toHaveLength(2)
    })

    it('應該能獲取接收到的共享任務', () => {
      const task1 = { id: '1', title: '任務1', description: '描述1' }
      const task2 = { id: '2', title: '任務2', description: '描述2' }
      collab.shareTask('1', task1, 'alice', 'bob')
      collab.shareTask('2', task2, 'charlie', 'bob')
      const sharedTasks = collab.getSharedTasks('bob')
      expect(sharedTasks).toHaveLength(2)
    })

    it('共享任務應該記錄在朋友的互動任務中', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      collab.addFriend('alice', 'bob')
      collab.shareTask('1', task, 'alice', 'bob')
      const friends = collab.getFriends('alice')
      expect(friends[0].mutualTasks.length).toBeGreaterThan(0)
    })
  })

  // ============== 協作相關測試 ==============
  describe('協作管理', () => {
    it('應該能建立協作', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collab_result = collab.createCollaboration('1', task, ['alice', 'bob', 'charlie'])
      expect(collab_result.taskId).toBe('1')
      expect(collab_result.collaborators).toHaveLength(3)
      expect(collab_result.status).toBe('active')
    })

    it('應該能添加協作者', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      collab.addCollaborator(collaboration.id, 'charlie', 'editor')
      expect(collaboration.collaborators).toHaveLength(3)
      expect(collaboration.collaborators.some(c => c.username === 'charlie')).toBe(true)
    })

    it('應該能移除協作者', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob', 'charlie'])
      collab.removeCollaborator(collaboration.id, 'charlie')
      expect(collaboration.collaborators).toHaveLength(2)
      expect(collaboration.collaborators.some(c => c.username === 'charlie')).toBe(false)
    })

    it('應該記錄添加協作者的活動', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice'])
      collab.addCollaborator(collaboration.id, 'bob')
      const userAddedActivity = collaboration.activities.find(a => a.type === 'user_added')
      expect(userAddedActivity).toBeDefined()
      expect(userAddedActivity.user).toBe('bob')
    })

    it('應該能獲取用戶的所有協作', () => {
      const task1 = { id: '1', title: '任務1', description: '描述1' }
      const task2 = { id: '2', title: '任務2', description: '描述2' }
      collab.createCollaboration('1', task1, ['alice', 'bob'])
      collab.createCollaboration('2', task2, ['bob', 'charlie'])
      collab.createCollaboration('3', task1, ['charlie', 'david'])
      const bobCollabs = collab.getUserCollaborations('bob')
      expect(bobCollabs).toHaveLength(2)
      expect(bobCollabs.every(c => c.collaborators.some(col => col.username === 'bob'))).toBe(true)
    })
  })

  // ============== 評論和活動相關測試 ==============
  describe('評論和活動', () => {
    it('應該能添加評論到協作', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      const comment = collab.addComment(collaboration.id, 'alice', '我已準備好了！')
      expect(comment.author).toBe('alice')
      expect(comment.content).toBe('我已準備好了！')
      expect(collaboration.comments).toHaveLength(1)
    })

    it('應該記錄評論活動', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      collab.addComment(collaboration.id, 'alice', '我已準備好了！')
      const commentActivity = collaboration.activities.find(a => a.type === 'comment_added')
      expect(commentActivity).toBeDefined()
      expect(commentActivity.author).toBe('alice')
    })

    it('應該能添加自定義活動', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      collab.addActivity(collaboration.id, 'task_completed', { completedBy: 'alice' })
      const activity = collaboration.activities.find(a => a.type === 'task_completed')
      expect(activity).toBeDefined()
      expect(activity.completedBy).toBe('alice')
    })

    it('應該能獲取協作詳情', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      const retrieved = collab.getCollaboration(collaboration.id)
      expect(retrieved).toBeDefined()
      expect(retrieved.id).toBe(collaboration.id)
      expect(retrieved.task.title).toBe('搶票計劃')
    })
  })

  // ============== 統計相關測試 ==============
  describe('協作統計', () => {
    it('應該生成正確的協作統計', () => {
      const task1 = { id: '1', title: '任務1', description: '描述1' }
      const task2 = { id: '2', title: '任務2', description: '描述2' }
      collab.addFriend('alice', 'bob')
      collab.addFriend('alice', 'charlie')
      collab.createCollaboration('1', task1, ['alice', 'bob'])
      collab.createCollaboration('2', task2, ['alice', 'charlie', 'david'])

      const stats = collab.getCollaborationStats('alice')
      expect(stats.totalFriends).toBe(2)
      expect(stats.totalCollaborations).toBe(2)
      expect(stats.activeTasks).toBe(2)
    })

    it('應該計算評論總數', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      collab.addComment(collaboration.id, 'alice', '評論1')
      collab.addComment(collaboration.id, 'bob', '評論2')
      collab.addComment(collaboration.id, 'alice', '評論3')

      const stats = collab.getCollaborationStats('alice')
      expect(stats.totalComments).toBe(3)
    })

    it('應該計算活動總數', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      collab.addComment(collaboration.id, 'alice', '評論1')
      collab.addCollaborator(collaboration.id, 'charlie')
      collab.addActivity(collaboration.id, 'custom_event', {})

      const stats = collab.getCollaborationStats('alice')
      expect(stats.totalActivities).toBeGreaterThan(0)
    })

    it('應該計算唯一協作者數量', () => {
      const task1 = { id: '1', title: '任務1', description: '描述1' }
      const task2 = { id: '2', title: '任務2', description: '描述2' }
      collab.createCollaboration('1', task1, ['alice', 'bob', 'charlie'])
      collab.createCollaboration('2', task2, ['alice', 'bob', 'david'])

      const stats = collab.getCollaborationStats('alice')
      expect(stats.collaborators).toBe(4) // alice, bob, charlie, david
    })
  })

  // ============== 複雜場景測試 ==============
  describe('複雜協作場景', () => {
    it('應該能處理完整的邀請-接受-協作流程', () => {
      // 1. Alice 邀請 Bob
      const invite = collab.inviteFriend('alice', 'bob@example.com', '讓我們搶票吧')
      expect(invite.status).toBe('pending')

      // 2. Bob 接受邀請
      collab.acceptInvitation(invite.code, 'bob')
      const aliceFriends = collab.getFriends('alice')
      expect(aliceFriends.some(f => f.username === 'bob')).toBe(true)

      // 3. Alice 建立協作任務
      const task = { id: '1', title: '2025年演唱會', description: '與朋友協作搶票' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      expect(collaboration.collaborators).toHaveLength(2)

      // 4. 添加評論
      collab.addComment(collaboration.id, 'alice', '我已準備好時間表')
      collab.addComment(collaboration.id, 'bob', '我也準備好了')
      expect(collaboration.comments).toHaveLength(2)

      // 5. 驗證統計
      const stats = collab.getCollaborationStats('alice')
      expect(stats.totalCollaborations).toBe(1)
      expect(stats.totalComments).toBe(2)
    })

    it('應該能管理多個協作項目', () => {
      // Alice 創建3個協作
      const task1 = { id: '1', title: '任務1', description: '描述1' }
      const task2 = { id: '2', title: '任務2', description: '描述2' }
      const task3 = { id: '3', title: '任務3', description: '描述3' }

      collab.createCollaboration('1', task1, ['alice', 'bob'])
      collab.createCollaboration('2', task2, ['alice', 'charlie'])
      collab.createCollaboration('3', task3, ['alice', 'bob', 'charlie'])

      // 驗證 Alice 的協作
      const aliceCollabs = collab.getUserCollaborations('alice')
      expect(aliceCollabs).toHaveLength(3)

      // 驗證 Bob 的協作
      const bobCollabs = collab.getUserCollaborations('bob')
      expect(bobCollabs).toHaveLength(2)

      // 驗證 Charlie 的協作
      const charlieCollabs = collab.getUserCollaborations('charlie')
      expect(charlieCollabs).toHaveLength(2)
    })

    it('應該能處理協作者的動態變化', () => {
      const task = { id: '1', title: '搶票計劃', description: '2025年演唱會' }
      const collaboration = collab.createCollaboration('1', task, ['alice', 'bob'])
      
      // 添加協作者
      collab.addCollaborator(collaboration.id, 'charlie', 'editor')
      expect(collaboration.collaborators).toHaveLength(3)

      // 添加更多
      collab.addCollaborator(collaboration.id, 'david', 'viewer')
      expect(collaboration.collaborators).toHaveLength(4)

      // 移除協作者
      collab.removeCollaborator(collaboration.id, 'charlie')
      expect(collaboration.collaborators).toHaveLength(3)
      expect(collaboration.activities.filter(a => a.type === 'user_removed')).toHaveLength(1)
    })
  })
})
