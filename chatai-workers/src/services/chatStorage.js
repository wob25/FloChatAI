/**
 * 聊天存储服务
 * 管理聊天记录的存储和检索
 */

export class ChatStorage {
  constructor(kvStorage) {
    this.kv = kvStorage
  }

  // 创建新聊天
  async createChat(chatId, metadata = {}) {
    const chat = {
      id: chatId,
      title: metadata.title || 'New Chat',
      sessionId: metadata.sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata
    }

    await this.kv.put(`chat:${chatId}`, JSON.stringify(chat))
    
    // 更新用户聊天列表
    if (metadata.sessionId) {
      await this.addToUserChats(metadata.sessionId, chatId)
    }

    return chat
  }

  // 获取聊天
  async getChat(chatId) {
    try {
      const data = await this.kv.get(`chat:${chatId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Get chat error:', error)
      return null
    }
  }

  // 添加消息到聊天
  async addMessage(chatId, message) {
    try {
      const chat = await this.getChat(chatId)
      if (!chat) {
        throw new Error('Chat not found')
      }

      chat.messages.push(message)
      chat.updatedAt = new Date().toISOString()

      // 更新标题（如果是第一条用户消息且标题还是默认的）
      if (message.type === 'user' && (chat.title === 'New Chat' || !chat.title)) {
        // 检查是否是第一条用户消息
        const userMessages = chat.messages.filter(msg => msg.type === 'user')
        if (userMessages.length === 1) {
          chat.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
        }
      }

      await this.kv.put(`chat:${chatId}`, JSON.stringify(chat))
      return chat
    } catch (error) {
      console.error('Add message error:', error)
      throw error
    }
  }

  // 删除聊天
  async deleteChat(chatId) {
    try {
      const chat = await this.getChat(chatId)
      if (chat && chat.sessionId) {
        await this.removeFromUserChats(chat.sessionId, chatId)
      }
      
      await this.kv.delete(`chat:${chatId}`)
      return true
    } catch (error) {
      console.error('Delete chat error:', error)
      return false
    }
  }

  // 获取用户的聊天列表
  async getUserChats(sessionId) {
    try {
      const data = await this.kv.get(`user_chats:${sessionId}`)
      const chatIds = data ? JSON.parse(data) : []
      
      const chats = []
      for (const chatId of chatIds) {
        const chat = await this.getChat(chatId)
        if (chat) {
          // 只返回基本信息，不包含完整消息
          chats.push({
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            messageCount: chat.messages ? chat.messages.length : 0
          })
        }
      }
      
      // 按更新时间排序
      chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      
      return chats
    } catch (error) {
      console.error('Get user chats error:', error)
      return []
    }
  }

  // 添加聊天到用户列表
  async addToUserChats(sessionId, chatId) {
    try {
      const data = await this.kv.get(`user_chats:${sessionId}`)
      const chatIds = data ? JSON.parse(data) : []
      
      if (!chatIds.includes(chatId)) {
        chatIds.unshift(chatId) // 添加到开头
        
        // 限制最大聊天数量
        if (chatIds.length > 50) {
          const removedIds = chatIds.splice(50)
          // 删除超出限制的聊天
          for (const id of removedIds) {
            await this.kv.delete(`chat:${id}`)
          }
        }
        
        await this.kv.put(`user_chats:${sessionId}`, JSON.stringify(chatIds))
      }
    } catch (error) {
      console.error('Add to user chats error:', error)
    }
  }

  // 从用户列表移除聊天
  async removeFromUserChats(sessionId, chatId) {
    try {
      const data = await this.kv.get(`user_chats:${sessionId}`)
      const chatIds = data ? JSON.parse(data) : []
      
      const index = chatIds.indexOf(chatId)
      if (index > -1) {
        chatIds.splice(index, 1)
        await this.kv.put(`user_chats:${sessionId}`, JSON.stringify(chatIds))
      }
    } catch (error) {
      console.error('Remove from user chats error:', error)
    }
  }

  // 清理过期聊天
  async cleanupExpiredChats(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7天
    try {
      const keys = await this.kv.list({ prefix: 'chat:' })
      const now = Date.now()
      let cleanedCount = 0

      for (const key of keys.keys) {
        try {
          const chat = await this.getChat(key.name.replace('chat:', ''))
          if (chat && chat.updatedAt) {
            const age = now - new Date(chat.updatedAt).getTime()
            if (age > maxAge) {
              await this.deleteChat(chat.id)
              cleanedCount++
            }
          }
        } catch (error) {
          console.error(`Error processing chat ${key.name}:`, error)
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired chats`)
      return cleanedCount
    } catch (error) {
      console.error('Cleanup expired chats error:', error)
      return 0
    }
  }

  // 获取聊天统计
  async getChatStats() {
    try {
      const chatKeys = await this.kv.list({ prefix: 'chat:' })
      const userKeys = await this.kv.list({ prefix: 'user_chats:' })
      
      return {
        totalChats: chatKeys.keys.length,
        totalUsers: userKeys.keys.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Get chat stats error:', error)
      return {
        totalChats: 0,
        totalUsers: 0,
        timestamp: new Date().toISOString()
      }
    }
  }
}
