/**
 * ChatAI 小部件
 * 集成到博客的浮动聊天助手
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatAI from './ChatAI'

const ChatAIWidget = ({
  config = {
    name: '𝒞𝒽𝒶𝓉𝒜𝐼',
    avatar: '/chatai-avatar.png',
    welcomeMessage: '✨ 𝐻𝑒𝓁𝓁𝑜, 𝓌𝒽𝒶𝓉 𝒸𝒶𝓃 𝐼 𝒹𝑜 𝒻𝑜𝓇 𝓎𝑜𝓊?',
    position: 'bottom-right',
    workerUrl: process.env.NEXT_PUBLIC_CHATAI_WORKER_URL || 'https://your-domain.com'
  }
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [showTextHint, setShowTextHint] = useState(false)

  // 监听滚动，在滚动时隐藏/显示
  useEffect(() => {
    let scrollTimeout
    
    const handleScroll = () => {
      setIsVisible(false)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  // 切换聊天窗口
  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasNewMessage(false)
    }
  }

  // 定时器逻辑，以实现完整的显示->切换->隐藏流程
  useEffect(() => {
    let messageTimer
    let hideTimer

    // 仅当聊天窗口关闭时，才执行此逻辑
    if (!isOpen) {
      // 重置状态，开始动画序列
      setShowTextHint(true)   // 1. 让提示框可见
      setHasNewMessage(false)  //    并显示 "Hello" 消息

      // 定时器1: 8秒后切换文本
      messageTimer = setTimeout(() => {
        setHasNewMessage(true) // 2. 切换为 "New message!" 文本 (此时红点也会出现)
      }, 8000) // 8秒

      // 定时器2: 16秒后隐藏所有提示
      hideTimer = setTimeout(() => {
        setShowTextHint(false) // 3. 隐藏文本提示框
        setHasNewMessage(false) //   同时也移除新消息状态，隐藏红点
      }, 16000) // 8 + 8 = 16秒

      // 清理函数：当聊天窗口被打开或组件卸载时，清除所有定时器
      return () => {
        clearTimeout(messageTimer)
        clearTimeout(hideTimer)
      }
    } else {
      // 如果聊天窗口是打开的，确保提示文本是隐藏的
      setShowTextHint(false)
    }
  }, [isOpen]) // 依赖于 isOpen 状态

  return (
    <>
      {/* 聊天窗口 */}
      <AnimatePresence>
        {isOpen && (
          <ChatAI
            isOpen={isOpen}
            onToggle={toggleChat}
            config={config}
          />
        )}
      </AnimatePresence>

      {/* 浮动按钮 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`
              chatai-widget fixed z-40
              ${config.position === 'bottom-right' ? 'bottom-6 right-6' : ''}
              ${config.position === 'bottom-left' ? 'bottom-6 left-6' : ''}
            `}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleChat}
              className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center"
            >
              {/* 头像或图标 */}
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.svg
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.img
                    key="avatar"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={config.avatar}
                    alt={config.name}
                    className="chatai-avatar w-14 h-14 rounded-full border-2 border-white object-cover"
                    onError={(e) => {
                      e.target.src = '/chatai-avatar.png'
                    }}
                  />
                )}
              </AnimatePresence>

              {/* 新消息指示器 */}
              <AnimatePresence>
                {hasNewMessage && !isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 脉冲动画 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
            </motion.button>

            {/* 提示文本 */}
            <AnimatePresence>
              {!isOpen && showTextHint && (
                <motion.div
                  initial={{ opacity: 0, x: config.position === 'bottom-right' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: config.position === 'bottom-right' ? 20 : -20 }}
                  className={`
                    absolute -top-8 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none
                    ${config.position === 'bottom-right' ? 'right-8' : 'left-8'}
                  `}
                >
                  {hasNewMessage ? '✨ 𝒩𝑒𝓌 𝓂𝑒𝓈𝓈𝒶𝑔𝑒!' : `✨ 𝐻𝑒𝓁𝓁𝑜, 𝓌𝒽𝒶𝓉 𝒸𝒶𝓃 𝐼 𝒹𝑜 𝒻𝑜𝓇 𝓎𝑜𝓊?`}
                  
                  {/* 箭头 */}
                  <div
                    className={`
                      absolute -bottom-1 w-2 h-2 bg-blue-500 rotate-45
                      ${config.position === 'bottom-right' ? 'right-3' : 'left-3'}
                    `}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatAIWidget