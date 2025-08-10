/**
 * 认证处理器
 * 处理用户会话和认证
 */

import { Hono } from 'hono'
import { generateId, getClientIP, parseUserAgent } from '../utils/helpers'

const app = new Hono()

// 创建会话
app.post('/session', async (c) => {
  try {
    const sessionId = generateId()
    const clientIP = getClientIP(c.req.raw)
    const userAgent = c.req.header('User-Agent') || ''
    const userInfo = parseUserAgent(userAgent)
    
    const session = {
      id: sessionId,
      clientIP: clientIP,
      userAgent: userAgent,
      browser: userInfo.browser,
      os: userInfo.operatingSystem,
      country: c.req.raw.cf?.country || 'unknown',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    }

    // 存储会话信息
    await c.env.CHAT_STORAGE.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60 // 7天过期
    })

    return c.json({
      success: true,
      sessionId: sessionId,
      session: session,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Create session error:', error)
    return c.json({
      error: 'Failed to create session',
      message: error.message
    }, 500)
  }
})

// 验证会话
app.get('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    
    const sessionData = await c.env.CHAT_STORAGE.get(`session:${sessionId}`)
    if (!sessionData) {
      return c.json({ error: 'Session not found' }, 404)
    }

    const session = JSON.parse(sessionData)
    
    // 更新最后活跃时间
    session.lastActiveAt = new Date().toISOString()
    await c.env.CHAT_STORAGE.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60 // 重新设置7天过期
    })

    return c.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Validate session error:', error)
    return c.json({
      error: 'Failed to validate session',
      message: error.message
    }, 500)
  }
})

// 删除会话
app.delete('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    
    await c.env.CHAT_STORAGE.delete(`session:${sessionId}`)

    return c.json({
      success: true,
      message: 'Session deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Delete session error:', error)
    return c.json({
      error: 'Failed to delete session',
      message: error.message
    }, 500)
  }
})

// 获取会话统计
app.get('/stats', async (c) => {
  try {
    // 获取所有会话
    const sessions = await c.env.CHAT_STORAGE.list({ prefix: 'session:' })
    
    const stats = {
      totalSessions: sessions.keys.length,
      activeSessions: 0,
      countries: {},
      browsers: {},
      operatingSystems: {}
    }

    const now = Date.now()
    const activeThreshold = 24 * 60 * 60 * 1000 // 24小时

    // 分析会话数据
    for (const key of sessions.keys) {
      try {
        const sessionData = await c.env.CHAT_STORAGE.get(key.name)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          
          // 检查是否为活跃会话
          const lastActive = new Date(session.lastActiveAt).getTime()
          if (now - lastActive < activeThreshold) {
            stats.activeSessions++
          }

          // 统计国家
          const country = session.country || 'unknown'
          stats.countries[country] = (stats.countries[country] || 0) + 1

          // 统计浏览器
          const browser = session.browser || 'unknown'
          stats.browsers[browser] = (stats.browsers[browser] || 0) + 1

          // 统计操作系统
          const os = session.os || 'unknown'
          stats.operatingSystems[os] = (stats.operatingSystems[os] || 0) + 1
        }
      } catch (error) {
        console.error(`Error processing session ${key.name}:`, error)
      }
    }

    return c.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return c.json({
      error: 'Failed to get stats',
      message: error.message
    }, 500)
  }
})

// 清理过期会话
app.post('/cleanup', async (c) => {
  try {
    const sessions = await c.env.CHAT_STORAGE.list({ prefix: 'session:' })
    const now = Date.now()
    const expireThreshold = 7 * 24 * 60 * 60 * 1000 // 7天
    let cleanedCount = 0

    for (const key of sessions.keys) {
      try {
        const sessionData = await c.env.CHAT_STORAGE.get(key.name)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          const lastActive = new Date(session.lastActiveAt).getTime()
          
          if (now - lastActive > expireThreshold) {
            await c.env.CHAT_STORAGE.delete(key.name)
            cleanedCount++
          }
        }
      } catch (error) {
        console.error(`Error cleaning session ${key.name}:`, error)
        // 删除损坏的会话数据
        await c.env.CHAT_STORAGE.delete(key.name)
        cleanedCount++
      }
    }

    return c.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedCount: cleanedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cleanup sessions error:', error)
    return c.json({
      error: 'Failed to cleanup sessions',
      message: error.message
    }, 500)
  }
})

export { app as AuthHandler }
