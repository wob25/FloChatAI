/**
 * ChatAI Hook
 * 管理与 Cloudflare Workers 的通信和聊天状态
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export const useChatAI = (workerUrl) => {
  const [currentChat, setCurrentChat] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [isClearing, setIsClearing] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  // 生成会话ID
  const generateSessionId = useCallback(() => {
    const stored = localStorage.getItem('chatai_session_id')
    if (stored) return stored
    
    const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
    localStorage.setItem('chatai_session_id', newId)
    return newId
  }, [])

  // 初始化
  useEffect(() => {
    if (!isInitialized) {
      const id = generateSessionId()
      setSessionId(id)

      // 检查连接状态
      checkConnection()

      // 加载本地聊天历史
      loadLocalChatHistory()

      setIsInitialized(true)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [generateSessionId, isInitialized])

  // 检查连接状态
  const checkConnection = async () => {
    try {
      const response = await fetch(`${workerUrl}/`)
      setIsConnected(response.ok)
    } catch (error) {
      console.error('Connection check failed:', error)
      setIsConnected(false)
    }
  }

  // 加载本地聊天历史
  const loadLocalChatHistory = () => {
    try {
      const stored = localStorage.getItem('chatai_history')
      if (stored) {
        const history = JSON.parse(stored)
        setChatHistory(history)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  // 保存聊天历史到本地
  const saveChatHistory = useCallback((history) => {
    try {
      localStorage.setItem('chatai_history', JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }, [])

  // 发送消息
  const sendMessage = useCallback(async (message, files = [], urls = [], preferredProvider = 'auto') => {
    if (!workerUrl || !sessionId) {
      setError('服务未初始化')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 使用已上传的文件结果（如果files是文件对象则上传，如果是结果对象则直接使用）
      let uploadedFiles = []
      if (files.length > 0) {
        uploadedFiles = await Promise.all(
          files.map(file => {
            // 如果是File对象，则上传；如果已经是上传结果，则直接使用
            if (file instanceof File) {
              console.log('Uploading file in sendMessage:', file.name)
              return uploadFile(file)
            } else {
              console.log('Using already uploaded file:', file.name)
              return Promise.resolve(file)
            }
          })
        )
      }

      // 发送到Workers
      const response = await fetch(`${workerUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': sessionId
        },
        body: JSON.stringify({
          message,
          chatId: currentChat?.id,
          files: uploadedFiles,
          urls,
          preferredProvider
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // 更新当前聊天
        const updatedChat = {
          id: data.chatId,
          messages: [
            ...(currentChat?.messages || []),
            data.userMessage,
            data.aiMessage
          ],
          updatedAt: new Date().toISOString()
        }
        
        setCurrentChat(updatedChat)
        
        // 如果是第一条用户消息，更新聊天标题
        if (updatedChat.messages.filter(msg => msg.type === 'user').length === 1) {
          const firstUserMessage = updatedChat.messages.find(msg => msg.type === 'user')
          if (firstUserMessage && firstUserMessage.content) {
            // 取前30个字符作为标题
            const title = firstUserMessage.content.trim().length > 30
              ? firstUserMessage.content.trim().substring(0, 30) + '...'
              : firstUserMessage.content.trim()
            updatedChat.title = title
          }
        }

        // 更新聊天历史
        const updatedHistory = chatHistory.map(chat =>
          chat.id === data.chatId ? updatedChat : chat
        )

        if (!chatHistory.find(chat => chat.id === data.chatId)) {
          updatedHistory.push(updatedChat)
        }

        setChatHistory(updatedHistory)
        saveChatHistory(updatedHistory)
        
        return data
      } else {
        throw new Error(data.error || '发送失败')
      }

    } catch (error) {
      console.error('Send message error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [workerUrl, sessionId, currentChat, chatHistory, saveChatHistory])

  // 上传文件
  const uploadFile = useCallback(async (file) => {
    console.log('uploadFile received:', file)
    console.log('uploadFile file type:', typeof file)
    console.log('uploadFile file instanceof File:', file instanceof File)
    console.log('uploadFile file constructor:', file?.constructor?.name)

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('FormData created, entries:', [...formData.entries()])

      const response = await fetch(`${workerUrl}/api/file/upload`, {
        method: 'POST',
        headers: {
          'X-Chat-Session': sessionId
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      return data.file

    } catch (error) {
      console.error('File upload error:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [workerUrl, sessionId])

  // 创建新聊天
  const createNewChat = useCallback(async () => {
    try {
      const response = await fetch(`${workerUrl}/api/chat/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chat-Session': sessionId
        },
        body: JSON.stringify({
          title: 'New Chat'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const newChat = {
          ...data.chat,
          messages: [{
            id: 'welcome',
            type: 'ai',
            content: '✨ 𝐻𝑒𝓁𝓁𝑜, 𝓌𝒽𝒶𝓉 𝒸𝒶𝓃 𝐼 𝒹𝑜 𝒻𝑜𝓇 𝓎𝑜𝓊?',
            timestamp: new Date().toISOString()
          }]
        }

        setCurrentChat(newChat)

        const updatedHistory = [newChat, ...chatHistory]
        setChatHistory(updatedHistory)
        saveChatHistory(updatedHistory)

        return newChat
      }

    } catch (error) {
      console.error('Create new chat error:', error)
      setError(error.message)
    }
  }, [workerUrl, sessionId, chatHistory, saveChatHistory])

  // 结束当前聊天
  const endCurrentChat = useCallback(() => {
    setCurrentChat(null)
  }, [])

  // 加载聊天历史
  const loadChatHistory = useCallback(async (forceReload = false) => {
    if (!workerUrl || !sessionId) {
      loadLocalChatHistory()
      return
    }

    // 如果不是强制重新加载且已有历史记录，则跳过
    if (!forceReload && chatHistory.length > 0) {
      return
    }

    try {
      const response = await fetch(`${workerUrl}/api/chat/list`, {
        headers: {
          'X-Chat-Session': sessionId
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // 转换后端数据格式为前端需要的格式
        const formattedChats = data.chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          messages: [], // 列表中不包含完整消息，需要时再加载
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          messageCount: chat.messageCount
        }))

        setChatHistory(formattedChats)
        saveChatHistory(formattedChats)
      } else {
        throw new Error(data.error || 'Failed to load chat history')
      }

    } catch (error) {
      console.error('Load chat history error:', error)
      // 如果远程加载失败，尝试加载本地历史
      loadLocalChatHistory()
    }
  }, [workerUrl, sessionId, saveChatHistory, chatHistory.length])

  // 当sessionId设置后，只加载一次远程聊天历史（但在清除操作期间不加载）
  useEffect(() => {
    if (sessionId && workerUrl && !isClearing && chatHistory.length === 0) {
      loadChatHistory()
    }
  }, [sessionId, workerUrl, isClearing]) // 移除loadChatHistory和chatHistory依赖，避免循环调用

  // 加载特定聊天
  const loadSpecificChat = useCallback(async (chatId) => {
    if (!workerUrl || !sessionId) {
      setError('服务未初始化')
      return
    }

    try {
      const response = await fetch(`${workerUrl}/api/chat/history/${chatId}`, {
        headers: {
          'X-Chat-Session': sessionId
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load chat: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.chat) {
        // 设置为当前聊天
        setCurrentChat({
          id: data.chat.id,
          title: data.chat.title,
          messages: data.chat.messages || [],
          createdAt: data.chat.createdAt,
          updatedAt: data.chat.updatedAt
        })
      } else {
        throw new Error(data.error || 'Failed to load chat')
      }

    } catch (error) {
      console.error('Load specific chat error:', error)
      setError(error.message)
    }
  }, [workerUrl, sessionId])

  // 清理全部聊天历史
  const clearAllChatHistory = useCallback(async () => {
    setIsClearing(true)

    // 立即清理本地状态，确保UI立即更新
    setChatHistory([])
    setCurrentChat(null)
    saveChatHistory([])

    try {
      const response = await fetch(`${workerUrl}/api/chat/clear-all`, {
        method: 'DELETE',
        headers: {
          'X-Chat-Session': sessionId
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to clear history: ${response.status}`)
      }

      // 清理所有相关的本地存储
      try {
        localStorage.removeItem('chatai_history')
        localStorage.removeItem(`chatai_current_chat_${sessionId}`)
        // 清理所有以chatai_开头的localStorage项
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('chatai_')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.error('Failed to clear local storage:', error)
      }
    } catch (error) {
      console.error('Clear all chat history error:', error)
      setError(error.message)
      // 如果远程清除失败，但本地已经清除，仍然保持本地清除状态
    } finally {
      // 延迟重置清除状态，避免立即重新加载
      setTimeout(() => setIsClearing(false), 1000)
    }
  }, [workerUrl, sessionId, saveChatHistory])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 连接WebSocket (可选，用于实时功能)
  const connectWebSocket = useCallback((chatId) => {
    if (!workerUrl || !chatId) return

    try {
      const wsUrl = workerUrl.replace('https://', 'wss://').replace('http://', 'ws://')
      wsRef.current = new WebSocket(`${wsUrl}/api/chat/ws/${chatId}`)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // 处理实时消息
          console.log('WebSocket message:', data)
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      }
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        // 重连逻辑
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(chatId)
        }, 5000)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }, [workerUrl])

  return {
    currentChat,
    chatHistory,
    isLoading,
    isProcessing,
    isConnected,
    error,
    sessionId,
    sendMessage,
    uploadFile,
    createNewChat,
    endCurrentChat,
    loadChatHistory,
    loadSpecificChat,
    clearAllChatHistory,
    clearError,
    connectWebSocket
  }
}
