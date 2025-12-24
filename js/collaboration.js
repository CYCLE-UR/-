/**
 * 協作功能系統 (Collaboration System)
 * 支持邀請朋友、共享任務、協作管理
 * 
 * @version 1.0
 * @stage Stage 6+
 */

/**
 * 建立協作管理器
 */
export function createCollaborationManager() {
  const friends = new Map()
  const sharedTasks = new Map()
  const invitations = new Map()
  const collaborations = new Map()

  /**
   * 生成邀請碼
   */
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

  /**
   * 邀請朋友
   */
  const inviteFriend = (currentUser, targetEmail, message = '') => {
    const inviteCode = generateInviteCode()
    
    const invitation = {
      id: `invite-${Date.now()}-${Math.random()}`,
      from: currentUser,
      to: targetEmail,
      code: inviteCode.code,
      message,
      status: 'pending', // pending, accepted, declined, expired
      createdAt: Date.now(),
      expiresAt: inviteCode.expiresAt,
      inviteUrl: `${window.location.origin}?invite=${inviteCode.code}`
    }
    
    invitations.set(invitation.id, invitation)
    return invitation
  }

  /**
   * 接受邀請
   */
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
        
        // 添加朋友關係
        addFriend(invitation.from, acceptingUser)
        addFriend(acceptingUser, invitation.from)
        
        accepted = invitation
      }
    })
    
    return accepted
  }

  /**
   * 添加朋友
   */
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

  /**
   * 獲取朋友列表
   */
  const getFriends = (user) => {
    return friends.get(user) || []
  }

  /**
   * 移除朋友
   */
  const removeFriend = (user, friendUsername) => {
    if (friends.has(user)) {
      const friendList = friends.get(user)
      const index = friendList.findIndex(f => f.username === friendUsername)
      if (index !== -1) {
        friendList.splice(index, 1)
      }
    }
  }

  /**
   * 共享任務
   */
  const shareTask = (taskId, task, fromUser, toUsers, permissions = 'view') => {
    const sharedId = `shared-${taskId}-${Date.now()}`
    
    const shared = {
      id: sharedId,
      taskId,
      task: { ...task },
      from: fromUser,
      to: toUsers, // 可以是陣列
      permissions, // 'view', 'edit', 'full'
      sharedAt: Date.now(),
      viewedBy: [],
      lastModified: Date.now()
    }
    
    sharedTasks.set(sharedId, shared)
    
    // 記錄朋友的共享任務
    (Array.isArray(toUsers) ? toUsers : [toUsers]).forEach(user => {
      const friendList = friends.get(fromUser) || []
      const friend = friendList.find(f => f.username === user)
      if (friend) {
        friend.mutualTasks.push(sharedId)
      }
    })
    
    return shared
  }

  /**
   * 獲取共享任務
   */
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

  /**
   * 更新共享任務
   */
  const updateSharedTask = (sharedId, updates, updatedBy) => {
    const shared = sharedTasks.get(sharedId)
    if (!shared) return null
    
    if (shared.permissions !== 'full' && shared.permissions !== 'edit') {
      throw new Error('無權限修改此任務')
    }
    
    Object.assign(shared.task, updates)
    shared.lastModified = Date.now()
    shared.lastModifiedBy = updatedBy
    
    return shared
  }

  /**
   * 建立協作任務
   */
  const createCollaboration = (taskId, task, collaborators, permissions = {}) => {
    const collaborationId = `collab-${taskId}-${Date.now()}`
    
    const collaboration = {
      id: collaborationId,
      taskId,
      task: { ...task },
      collaborators: collaborators.map(collab => ({
        username: collab,
        joinedAt: Date.now(),
        role: permissions[collab] || 'editor', // 'viewer', 'editor', 'owner'
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

  /**
   * 添加協作者
   */
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

  /**
   * 移除協作者
   */
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

  /**
   * 添加協作任務評論
   */
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

  /**
   * 添加協作活動記錄
   */
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

  /**
   * 獲取協作詳情
   */
  const getCollaboration = (collaborationId) => {
    return collaborations.get(collaborationId)
  }

  /**
   * 獲取用戶的所有協作
   */
  const getUserCollaborations = (user) => {
    const userCollabs = []
    
    collaborations.forEach((collab, id) => {
      if (collab.collaborators.some(c => c.username === user)) {
        userCollabs.push(collab)
      }
    })
    
    return userCollabs
  }

  /**
   * 獲取邀請列表
   */
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

  /**
   * 拒絕邀請
   */
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

  /**
   * 生成協作統計
   */
  const getCollaborationStats = (user) => {
    const userCollabs = getUserCollaborations(user)
    const userFriends = getFriends(user)
    
    return {
      totalCollaborations: userCollabs.length,
      totalFriends: userFriends.length,
      activeTasks: userCollabs.filter(c => c.status === 'active').length,
      totalComments: userCollabs.reduce((sum, c) => sum + c.comments.length, 0),
      totalActivities: userCollabs.reduce((sum, c) => sum + c.activities.length, 0),
      collaborators: new Set(
        userCollabs.flatMap(c => c.collaborators.map(col => col.username))
      ).size
    }
  }

  return {
    // 邀請相關
    generateInviteCode,
    inviteFriend,
    acceptInvitation,
    declineInvitation,
    getInvitations,

    // 朋友相關
    addFriend,
    removeFriend,
    getFriends,

    // 共享相關
    shareTask,
    getSharedTasks,
    updateSharedTask,

    // 協作相關
    createCollaboration,
    addCollaborator,
    removeCollaborator,
    getCollaboration,
    getUserCollaborations,

    // 活動和評論
    addComment,
    addActivity,

    // 統計
    getCollaborationStats
  }
}

/**
 * 建立協作邀請管理器
 * 專門處理邀請流程
 */
export function createInviteManager() {
  const pendingInvites = new Map()
  const inviteHistory = []

  /**
   * 發送邀請
   */
  const sendInvite = (from, to, type = 'friend') => {
    const inviteId = `invite-${Date.now()}`
    const code = generateUniqueCode()
    
    const invite = {
      id: inviteId,
      from,
      to,
      type, // 'friend', 'task', 'collaboration'
      code,
      status: 'pending',
      sentAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天
      reminderSent: false
    }
    
    pendingInvites.set(inviteId, invite)
    inviteHistory.push({ ...invite, action: 'sent' })
    
    return invite
  }

  /**
   * 回應邀請
   */
  const respondToInvite = (inviteId, accepted) => {
    const invite = pendingInvites.get(inviteId)
    if (!invite) return null
    
    invite.status = accepted ? 'accepted' : 'declined'
    invite.respondedAt = Date.now()
    
    inviteHistory.push({ ...invite, action: 'responded', accepted })
    
    if (accepted) {
      pendingInvites.delete(inviteId)
    }
    
    return invite
  }

  /**
   * 重新發送邀請
   */
  const resendInvite = (inviteId) => {
    const invite = pendingInvites.get(inviteId)
    if (!invite) return null
    
    invite.sentAt = Date.now()
    invite.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
    invite.reminderSent = true
    
    inviteHistory.push({ ...invite, action: 'resent' })
    
    return invite
  }

  /**
   * 獲取待機邀請
   */
  const getPendingInvites = (user, direction = 'received') => {
    const result = []
    
    pendingInvites.forEach((invite, id) => {
      if (direction === 'received' && invite.to === user && invite.status === 'pending') {
        result.push(invite)
      } else if (direction === 'sent' && invite.from === user && invite.status === 'pending') {
        result.push(invite)
      }
    })
    
    return result
  }

  /**
   * 取消邀請
   */
  const cancelInvite = (inviteId) => {
    const invite = pendingInvites.get(inviteId)
    if (!invite) return null
    
    invite.status = 'cancelled'
    invite.cancelledAt = Date.now()
    
    inviteHistory.push({ ...invite, action: 'cancelled' })
    pendingInvites.delete(inviteId)
    
    return invite
  }

  /**
   * 生成唯一邀請碼
   */
  const generateUniqueCode = () => {
    return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  return {
    sendInvite,
    respondToInvite,
    resendInvite,
    getPendingInvites,
    cancelInvite,
    getHistory: () => [...inviteHistory]
  }
}

/**
 * 建立團隊/分組管理器
 */
export function createTeamManager() {
  const teams = new Map()
  const members = new Map()

  /**
   * 建立團隊
   */
  const createTeam = (name, owner, description = '') => {
    const teamId = `team-${Date.now()}`
    
    const team = {
      id: teamId,
      name,
      description,
      owner,
      createdAt: Date.now(),
      members: [owner],
      tasks: [],
      settings: {
        isPublic: false,
        allowJoinRequests: true,
        memberCanInvite: true
      }
    }
    
    teams.set(teamId, team)
    members.set(teamId, [{ username: owner, role: 'owner', joinedAt: Date.now() }])
    
    return team
  }

  /**
   * 邀請成員加入團隊
   */
  const inviteMember = (teamId, username, role = 'member') => {
    const team = teams.get(teamId)
    if (!team) return null
    
    if (!team.members.includes(username)) {
      team.members.push(username)
      
      const memberList = members.get(teamId) || []
      memberList.push({
        username,
        role,
        joinedAt: Date.now(),
        invitedBy: team.owner
      })
      members.set(teamId, memberList)
    }
    
    return team
  }

  /**
   * 移除成員
   */
  const removeMember = (teamId, username) => {
    const team = teams.get(teamId)
    if (!team) return null
    
    const index = team.members.indexOf(username)
    if (index !== -1) {
      team.members.splice(index, 1)
    }
    
    return team
  }

  /**
   * 添加任務到團隊
   */
  const addTaskToTeam = (teamId, taskId) => {
    const team = teams.get(teamId)
    if (!team && !team.tasks.includes(taskId)) {
      team.tasks.push(taskId)
    }
    
    return team
  }

  /**
   * 獲取團隊詳情
   */
  const getTeam = (teamId) => {
    return teams.get(teamId)
  }

  /**
   * 獲取用戶所屬的團隊
   */
  const getUserTeams = (username) => {
    const userTeams = []
    
    teams.forEach((team, id) => {
      if (team.members.includes(username)) {
        userTeams.push(team)
      }
    })
    
    return userTeams
  }

  return {
    createTeam,
    inviteMember,
    removeMember,
    addTaskToTeam,
    getTeam,
    getUserTeams
  }
}
