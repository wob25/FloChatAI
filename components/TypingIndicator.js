/**
 * 打字指示器组件
 */

import { motion } from 'framer-motion'

const TypingIndicator = ({ config }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
        {/* AI头像 */}
        <img
          src={config.avatar}
          alt={config.name}
          className="chatai-avatar w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          onError={(e) => {
            e.target.src = '/chatai-avatar.png'
          }}
        />

        {/* 打字气泡 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3"
        >
          <div className="flex items-center space-x-1">
            {/* 打字动画点 */}
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TypingIndicator
