/**
 * 聊天处理器
 * 处理AI对话、消息存储等功能
 */

import { Hono } from 'hono'
import { AIService } from '../services/aiService'
import { ChatStorage } from '../services/chatStorage'
import { generateId } from '../utils/helpers'

const app = new Hono()

// 获取配额状态
app.get('/quota', async (c) => {
  try {
    const aiService = new AIService(c.env)
    const allQuotaStatus = await aiService.getAllQuotaStatus(c.env)

    return c.json({
      success: true,
      quotas: allQuotaStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get quota status error:', error)
    return c.json({
      success: false,
      error: 'Failed to get quota status',
      details: error.message
    }, 500)
  }
})

// 获取特定平台的配额状态
app.get('/quota/:provider', async (c) => {
  try {
    const provider = c.req.param('provider')
    const aiService = new AIService(c.env)
    const quotaStatus = await aiService.checkQuotaStatus(provider, c.env)

    return c.json({
      success: true,
      provider,
      quota: quotaStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get provider quota status error:', error)
    return c.json({
      success: false,
      error: 'Failed to get provider quota status',
      details: error.message
    }, 500)
  }
})

// 获取真实API配额信息
app.get('/quota/:provider/real', async (c) => {
  try {
    const provider = c.req.param('provider')
    const aiService = new AIService(c.env)
    const realQuota = await aiService.getRealQuotaFromAPI(provider)

    return c.json({
      success: true,
      provider,
      realQuota,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get real quota error:', error)
    return c.json({
      success: false,
      error: 'Failed to get real quota',
      details: error.message
    }, 500)
  }
})

// 刷新所有平台的真实配额信息
app.post('/quota/refresh', async (c) => {
  try {
    const aiService = new AIService(c.env)
    const availableProviders = aiService.getAvailableProviders()
    const results = {}

    for (const provider of availableProviders) {
      try {
        const realQuota = await aiService.getRealQuotaFromAPI(provider)
        results[provider] = {
          success: true,
          data: realQuota
        }
      } catch (error) {
        results[provider] = {
          success: false,
          error: error.message
        }
      }
    }

    return c.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Refresh quota error:', error)
    return c.json({
      success: false,
      error: 'Failed to refresh quota',
      details: error.message
    }, 500)
  }
})

// 获取可用的AI平台列表
app.get('/providers', async (c) => {
  try {
    const aiService = new AIService(c.env)
    const availableProviders = aiService.getAvailableProviders()
    const allProviders = aiService.getAllProviderInfo()

    return c.json({
      success: true,
      providers: {
        available: availableProviders,
        all: allProviders
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get providers error:', error)
    return c.json({
      success: false,
      error: 'Failed to get providers',
      details: error.message
    }, 500)
  }
})

// 发送消息
app.post('/send', async (c) => {
  try {
    const { message, chatId, files = [], urls = [], preferredProvider = 'auto' } = await c.req.json()
    const sessionId = c.req.header('X-Chat-Session') || generateId()
    
    if (!message && files.length === 0 && urls.length === 0) {
      return c.json({ error: 'Message, files, or urls required' }, 400)
    }

    // 获取或创建聊天会话
    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)
    let chat = await chatStorage.getChat(chatId || sessionId)
    
    if (!chat) {
      chat = await chatStorage.createChat(chatId || sessionId, {
        title: 'New Chat', // 初始设置为默认标题，稍后会根据第一条用户消息更新
        sessionId: sessionId,
        createdAt: new Date().toISOString()
      })
    }

    // 保存用户消息
    const userMessage = {
      id: generateId(),
      type: 'user',
      content: message,
      files: files,
      urls: urls,
      timestamp: new Date().toISOString()
    }
    
    await chatStorage.addMessage(chat.id, userMessage)

    // 处理AI回复
    const aiService = new AIService(c.env)
    const aiResponse = await aiService.generateResponse({
      message,
      files,
      urls,
      chatHistory: chat.messages || [],
      preferredProvider,
      env: c.env
    })

    // 保存AI回复
    const aiMessage = {
      id: generateId(),
      type: 'ai',
      content: aiResponse.content,
      metadata: aiResponse.metadata,
      timestamp: new Date().toISOString()
    }
    
    await chatStorage.addMessage(chat.id, aiMessage)

    return c.json({
      success: true,
      chatId: chat.id,
      sessionId,
      userMessage,
      aiMessage,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat send error:', error)
    return c.json({
      error: 'Failed to process message',
      message: error.message
    }, 500)
  }
})

// 获取聊天历史
app.get('/history/:chatId', async (c) => {
  try {
    const chatId = c.req.param('chatId')
    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)
    
    const chat = await chatStorage.getChat(chatId)
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404)
    }

    return c.json({
      success: true,
      chat,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get chat history error:', error)
    return c.json({
      error: 'Failed to get chat history',
      message: error.message
    }, 500)
  }
})

// 获取所有聊天列表
app.get('/list', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session')
    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)
    const chats = await chatStorage.getUserChats(sessionId)

    return c.json({
      success: true,
      chats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get chat list error:', error)
    return c.json({
      error: 'Failed to get chat list',
      message: error.message
    }, 500)
  }
})

// 创建新聊天
app.post('/new', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session') || generateId()
    const { title } = await c.req.json()
    
    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)
    const chat = await chatStorage.createChat(generateId(), {
      title: title || 'New Chat',
      sessionId,
      createdAt: new Date().toISOString()
    })

    return c.json({
      success: true,
      chat,
      sessionId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Create new chat error:', error)
    return c.json({
      error: 'Failed to create new chat',
      message: error.message
    }, 500)
  }
})

// 清理全部聊天历史 - 必须放在动态路由之前
app.delete('/clear-all', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session')
    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)

    // 获取用户的所有聊天
    const chats = await chatStorage.getUserChats(sessionId)

    // 删除所有聊天
    for (const chat of chats) {
      await chatStorage.deleteChat(chat.id)
    }

    // 清空用户聊天列表
    await c.env.CHAT_STORAGE.delete(`user_chats:${sessionId}`)

    // 额外清理：删除所有可能残留的聊天数据
    try {
      // 获取所有以chat:开头的键，检查是否属于当前用户
      const { keys } = await c.env.CHAT_STORAGE.list({ prefix: 'chat:' })
      for (const key of keys) {
        try {
          const chatData = await c.env.CHAT_STORAGE.get(key.name)
          if (chatData) {
            const chat = JSON.parse(chatData)
            if (chat.sessionId === sessionId) {
              await c.env.CHAT_STORAGE.delete(key.name)
              console.log(`Cleaned up orphaned chat: ${key.name}`)
            }
          }
        } catch (error) {
          console.error(`Error cleaning chat ${key.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Error during additional cleanup:', error)
    }

    return c.json({
      success: true,
      message: `Cleared ${chats.length} chats successfully`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Clear all chats error:', error)
    return c.json({
      error: 'Failed to clear all chats',
      message: error.message
    }, 500)
  }
})

// 删除聊天
app.delete('/:chatId', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session')
    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    const chatStorage = new ChatStorage(c.env.CHAT_STORAGE)

    // 获取用户的所有聊天
    const chats = await chatStorage.getUserChats(sessionId)

    // 删除所有聊天
    for (const chat of chats) {
      await chatStorage.deleteChat(chat.id)
    }

    // 清空用户聊天列表
    await c.env.CHAT_STORAGE.delete(`user_chats:${sessionId}`)

    // 额外清理：删除所有可能残留的聊天数据
    try {
      // 获取所有以chat:开头的键，检查是否属于当前用户
      const { keys } = await c.env.CHAT_STORAGE.list({ prefix: 'chat:' })
      for (const key of keys) {
        try {
          const chatData = await c.env.CHAT_STORAGE.get(key.name)
          if (chatData) {
            const chat = JSON.parse(chatData)
            if (chat.sessionId === sessionId) {
              await c.env.CHAT_STORAGE.delete(key.name)
              console.log(`Cleaned up orphaned chat: ${key.name}`)
            }
          }
        } catch (error) {
          console.error(`Error cleaning chat ${key.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Error during additional cleanup:', error)
    }

    return c.json({
      success: true,
      message: `Cleared ${chats.length} chats successfully`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Clear all chats error:', error)
    return c.json({
      error: 'Failed to clear all chats',
      message: error.message
    }, 500)
  }
})

// WebSocket 连接
app.get('/ws/:chatId', async (c) => {
  try {
    const chatId = c.req.param('chatId')
    const upgradeHeader = c.req.header('Upgrade')
    
    if (upgradeHeader !== 'websocket') {
      return c.text('Expected websocket', 400)
    }

    // 获取 Durable Object
    const id = c.env.CHAT_ROOM.idFromName(chatId)
    const chatRoom = c.env.CHAT_ROOM.get(id)
    
    return chatRoom.fetch(c.req.raw)

  } catch (error) {
    console.error('WebSocket connection error:', error)
    return c.json({
      error: 'Failed to establish WebSocket connection',
      message: error.message
    }, 500)
  }
})

export { app as ChatHandler }
