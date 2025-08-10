/**
 * ChatAI Cloudflare Workers 主入口
 * 处理AI对话、文件上传、URL解析等功能
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { ChatHandler } from './handlers/chatHandler'
import { FileHandler } from './handlers/fileHandler'
import { UrlHandler } from './handlers/urlHandler'
import { AuthHandler } from './handlers/authHandler'

// 创建 Hono 应用
const app = new Hono()

// 中间件
app.use('*', logger())
app.use('*', cors({
  origin: '*', // 临时允许所有来源进行测试
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Chat-Session'],
  credentials: false
}))

// 健康检查
app.get('/', (c) => {
  return c.json({
    service: 'ChatAI Workers',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// API 路由
app.route('/api/chat', ChatHandler)
app.route('/api/file', FileHandler)
app.route('/api/url', UrlHandler)
app.route('/api/auth', AuthHandler)

// 错误处理
app.onError((err, c) => {
  console.error('Worker Error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  }, 404)
})

// Durable Object for real-time chat
export class ChatRoom {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Set()
  }

  async fetch(request) {
    const url = new URL(request.url)
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request)
    }
    
    return new Response('Not found', { status: 404 })
  }

  async handleWebSocket(request) {
    const [client, server] = Object.values(new WebSocketPair())
    
    server.accept()
    this.sessions.add(server)
    
    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data)
        await this.handleMessage(data, server)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })
    
    server.addEventListener('close', () => {
      this.sessions.delete(server)
    })
    
    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }

  async handleMessage(data, sender) {
    // 广播消息给所有连接的客户端
    const message = {
      ...data,
      timestamp: new Date().toISOString()
    }
    
    this.sessions.forEach(session => {
      if (session !== sender && session.readyState === 1) {
        session.send(JSON.stringify(message))
      }
    })
  }
}

// 定时任务处理
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx)
  },

  async scheduled(event, env, ctx) {
    // 每日清理任务
    console.log('Running scheduled cleanup task')
    
    try {
      // 清理过期的聊天记录
      await cleanupExpiredChats(env.CHAT_STORAGE)
      
      // 清理过期的文件
      await cleanupExpiredFiles(env.FILE_STORAGE)
      
      console.log('Cleanup task completed successfully')
    } catch (error) {
      console.error('Cleanup task failed:', error)
    }
  }
}

// 清理函数
async function cleanupExpiredChats(storage) {
  const keys = await storage.list()
  const now = Date.now()
  const expireTime = 7 * 24 * 60 * 60 * 1000 // 7天

  for (const key of keys.keys) {
    try {
      const data = await storage.get(key.name, 'json')
      if (data && data.timestamp && (now - new Date(data.timestamp).getTime()) > expireTime) {
        await storage.delete(key.name)
        console.log(`Deleted expired chat: ${key.name}`)
      }
    } catch (error) {
      console.error(`Error processing chat ${key.name}:`, error)
    }
  }
}

async function cleanupExpiredFiles(storage) {
  const objects = await storage.list()
  const now = Date.now()
  const expireTime = 30 * 24 * 60 * 60 * 1000 // 30天

  for (const object of objects.objects) {
    try {
      if (object.uploaded && (now - new Date(object.uploaded).getTime()) > expireTime) {
        await storage.delete(object.key)
        console.log(`Deleted expired file: ${object.key}`)
      }
    } catch (error) {
      console.error(`Error processing file ${object.key}:`, error)
    }
  }
}
