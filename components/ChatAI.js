/**
 * ChatAI 主组件
 * 基于 Cloudflare Workers 的智能聊天助手
 * 修复文件上传功能 v2
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ChatMenu from './ChatMenu'
import ChatHistory from './ChatHistory'
import { useChatAI } from './hooks/useChatAI'

const ChatAI = ({
  isOpen,
  onToggle,
  config = {
    name: '𝒞𝒽𝒶𝓉𝒜𝐼',
    avatar: '/chatai-avatar.png',
    welcomeMessage: '✨ 𝐻𝑒𝓁𝓁𝑜, 𝓌𝒽𝒶𝓉 𝒸𝒶𝓃 𝐼 𝒹𝑜 𝒻𝑜𝓇 𝓎𝑜𝓊?',
    position: 'bottom-right',
    workerUrl: 'https://your-worker.your-subdomain.workers.dev'
  }
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [isClearing, setIsClearing] = useState(false)
  const chatRef = useRef(null)

  // 使用自定义Hook管理聊天状态
  const {
    currentChat,
    chatHistory,
    isLoading,
    isProcessing,
    isConnected,
    sendMessage,
    createNewChat,
    endCurrentChat,
    loadChatHistory,
    loadSpecificChat,
    clearAllChatHistory,
    uploadFile,
    error,
    clearError
  } = useChatAI(config.workerUrl)

  useEffect(() => {
    // 只在首次打开聊天窗口时加载历史记录，不自动创建新聊天
    if (isOpen && !isClearing) {
      loadChatHistory()
    }
  }, [isOpen, loadChatHistory, isClearing])

  // 处理发送消息
  const handleSendMessage = async (message, files = [], urls = []) => {
    if (!message.trim() && files.length === 0 && urls.length === 0) return

    // 如果没有当前聊天，则创建一个新的
    if (!currentChat) {
      await createNewChat()
    }

    try {
      // 处理文件上传 - 修复文件对象传递 v2
      let fileResults = []
      if (files.length > 0) {
        console.log('Files to upload:', files) // 调试日志
        console.log('Files array length:', files.length)

        for (let i = 0; i < files.length; i++) {
          const fileData = files[i]
          const actualFile = fileData.file || fileData // 获取原始File对象
          console.log(`Uploading file ${i}:`, actualFile)
          console.log(`File ${i} type:`, typeof actualFile)
          console.log(`File ${i} instanceof File:`, actualFile instanceof File)
          console.log(`File ${i} name:`, actualFile.name)

          try {
            const result = await uploadFile(actualFile)
            fileResults.push(result)
            console.log(`File ${i} upload result:`, result)
          } catch (error) {
            console.error(`File ${i} upload error:`, error)
            throw error
          }
        }
      }

      // 处理URL解析 (如果需要的话)
      let urlResults = []
      if (urls.length > 0) {
        // 直接传递URL字符串数组给后端
        urlResults = urls
      }

      // 发送消息到AI (useChatAI Hook会处理消息保存)
      await sendMessage(message, fileResults, urlResults, selectedProvider)

    } catch (error) {
      console.error('发送消息失败:', error)
      // 错误处理已经在 useChatAI Hook 中处理
    }
  }

  // 处理菜单操作
  const handleMenuAction = (action, chatId) => {
    switch (action) {
      case 'new-chat':
        // 只有用户主动点击时才创建新聊天
        createNewChat()
        break
      case 'end-chat':
        endCurrentChat()
        break
      case 'view-history':
        // 显示历史记录，不重新加载（避免重复请求）
        setShowHistory(true)
        break
      case 'load-chat':
        if (chatId) {
          // 这里可以添加加载特定聊天的逻辑
          console.log('Loading chat:', chatId)
          // TODO: 实现加载特定聊天的功能
        }
        break
      default:
        break
    }
    setShowMenu(false)
  }



  if (!isOpen) return null

  return (
    <motion.div
      ref={chatRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        height: '600px'
      }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200
        ${config.position === 'bottom-right' ? 'bottom-20 right-6' : ''}
        ${config.position === 'bottom-left' ? 'bottom-20 left-6' : ''}
        w-96 h-[600px]
        flex flex-col overflow-hidden
      `}
      style={{
        maxHeight: '80vh',
        maxWidth: '90vw'
      }}
    >
      {/* 聊天头部 */}
      <ChatHeader
        config={config}
        onMenuToggle={() => setShowMenu(!showMenu)}
        onClose={onToggle}
        showMenu={showMenu}
        isConnected={isConnected}
      />



      {/* 菜单下拉 */}
      <AnimatePresence>
        {showMenu && (
          <ChatMenu
            onAction={handleMenuAction}
            onClose={() => setShowMenu(false)}
            apiUrl={config.workerUrl}
            chatHistory={chatHistory}
            selectedProvider={selectedProvider}
          />
        )}
      </AnimatePresence>

      {/* 聊天内容区域 */}
      {/* 消息列表 */}
      <ChatMessages
        messages={currentChat?.messages || []}
        isLoading={isLoading}
        config={config}
      />

      {/* 输入区域 */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading || isProcessing}
        placeholder="Message..."
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        apiUrl={config.workerUrl}
      />

      {/* 历史记录弹窗 */}
      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        chatHistory={chatHistory}
        onLoadChat={(chatId) => {
          loadSpecificChat(chatId)
          setShowHistory(false)
        }}
        onClearAll={async () => {
          setIsClearing(true)
          try {
            await clearAllChatHistory()
          } finally {
            // 延迟重置清除状态，避免立即重新加载
            setTimeout(() => setIsClearing(false), 1000)
          }
        }}
      />
    </motion.div>
  )
}

export default ChatAI
