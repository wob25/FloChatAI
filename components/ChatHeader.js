/**
 * ChatAI 头部组件
 */

import { motion } from 'framer-motion'

const ChatHeader = ({
  config,
  onMenuToggle,
  onClose,
  showMenu,
  isConnected = true
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
      {/* 左侧：头像和名称 */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={config.avatar}
            alt={config.name}
            className="chatai-avatar w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
            onError={(e) => {
              e.target.src = '/chatai-avatar.png'
            }}
          />
          {/* 连接状态指示器 */}
          <div className={`
            absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white
            ${isConnected ? 'bg-green-500' : 'bg-red-500'}
          `} />
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">
            {config.name}
          </h3>
          <p className="text-xs text-gray-500">
            {isConnected ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        {/* 菜单按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMenuToggle}
          className={`
            p-2 rounded-lg transition-colors duration-200
            ${showMenu 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100 text-gray-600'
            }
          `}
          title="Menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </motion.button>



        {/* 关闭按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors duration-200"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

export default ChatHeader
