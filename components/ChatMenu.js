/**
 * ChatAI 菜单组件
 */

import { motion } from 'framer-motion'
import QuotaStatus from './QuotaStatus'

const ChatMenu = ({ onAction, onClose, chatHistory = [], apiUrl, selectedProvider = 'auto' }) => {
  const menuItems = [
    {
      id: 'new-chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Start a new chat',
      action: () => onAction('new-chat')
    },
    {
      id: 'end-chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      label: 'End chat',
      action: () => onAction('end-chat')
    },
    {
      id: 'view-history',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'View recent chats',
      action: () => onAction('view-history'),
      badge: chatHistory.length > 0 ? chatHistory.length : null
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-48"
    >
      {/* 菜单项 */}
      {menuItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ backgroundColor: '#f3f4f6' }}
          whileTap={{ scale: 0.98 }}
          onClick={item.action}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
        >
          <div className="flex items-center space-x-3">
            <span className="text-gray-500">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>
          
          {item.badge && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </motion.button>
      ))}

      {/* 配额状态 */}
      {apiUrl && (
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50">
          <QuotaStatus apiUrl={apiUrl} selectedProvider={selectedProvider} />
        </div>
      )}



      {/* 关闭按钮 */}
      <div className="border-t border-gray-100 mt-2 pt-2 px-4">
        <motion.button
          whileHover={{ backgroundColor: '#fee2e2' }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Close Menu</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default ChatMenu
