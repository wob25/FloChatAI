import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ChatHistory = ({ isOpen, onClose, chatHistory, onLoadChat, onClearAll }) => {
  const [localChatHistory, setLocalChatHistory] = useState(chatHistory || [])
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 监听chatHistory变化，立即更新本地状态
  useEffect(() => {
    setLocalChatHistory(chatHistory || [])
  }, [chatHistory])

  // 格式化日期
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return '今天'
    } else if (diffDays === 2) {
      return '昨天'
    } else if (diffDays <= 7) {
      return `${diffDays - 1}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  // 获取聊天标题（用户第一句话）
  const getChatTitle = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return chat.title || 'New Chat'
    }

    // 如果聊天已经有标题且不是默认标题，直接使用
    if (chat.title && chat.title !== 'New Chat') {
      return chat.title
    }

    // 找到第一条用户消息（兼容 type 和 role 字段）
    const firstUserMessage = chat.messages.find(msg =>
      msg.type === 'user' || msg.role === 'user'
    )
    if (firstUserMessage && firstUserMessage.content) {
      // 截取前30个字符作为标题
      const title = firstUserMessage.content.trim()
      return title.length > 30 ? title.substring(0, 30) + '...' : title
    }

    return 'New Chat'
  }

  // 按日期分组聊天记录
  const groupChatsByDate = (chats) => {
    const groups = {}
    
    chats.forEach(chat => {
      const dateKey = formatDate(chat.createdAt)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(chat)
    })
    
    return groups
  }

  const groupedChats = localChatHistory ? groupChatsByDate(localChatHistory) : {}

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* 历史记录弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={isMobile ? {
              position: 'fixed',
              top: '8%',
              left: '4%',
              right: '4%',
              bottom: '8%',
              zIndex: 50,
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column'
            } : {
              position: 'fixed',
              top: '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24rem',
              maxHeight: '70vh',
              zIndex: 50,
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex-1 min-w-0">聊天历史</h3>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* 清理全部历史记录按钮 */}
                <button
                  onClick={async () => {
                    if (window.confirm('确定要清理全部聊天历史记录吗？此操作不可恢复。')) {
                      // 立即清空本地显示
                      setLocalChatHistory([])
                      // 执行清除操作
                      await onClearAll()
                      // 清除完成后立即关闭历史记录窗口
                      onClose()
                    }
                  }}
                  className="p-2 sm:p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors touch-manipulation"
                  title="清理全部历史记录"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="p-2 sm:p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 聊天记录列表 */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {Object.keys(groupedChats).length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm sm:text-base">暂无聊天记录</p>
                </div>
              ) : (
                Object.entries(groupedChats).map(([dateGroup, chats]) => (
                  <div key={dateGroup} className="mb-4 sm:mb-6">
                    {/* 日期分组标题 */}
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3 sticky top-0 bg-white">
                      {dateGroup}
                    </h4>
                    
                    {/* 该日期的聊天记录 */}
                    <div className="space-y-2">
                      {chats.map((chat) => (
                        <motion.button
                          key={chat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onLoadChat(chat.id)
                            onClose()
                          }}
                          className="w-full text-left p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group touch-manipulation"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs sm:text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                                {getChatTitle(chat)}
                              </h5>
                              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                                {chat.messages?.length || 0} 条消息
                              </p>
                            </div>
                            <div className="ml-1 sm:ml-2 flex-shrink-0">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ChatHistory
