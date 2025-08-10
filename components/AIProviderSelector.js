/**
 * AI平台选择器组件
 * 允许用户手动选择AI平台
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// AI平台配置 - 分为国外平台和国内平台
const AI_PROVIDERS = {
  // 国外平台
  gemini: {
    name: '🔮 Google Gemini',
    description: '视觉能力强，多模态支持',
    category: 'international',
    free: false,
    available: true // 默认可用，会根据API密钥动态更新
  },
  openai: {
    name: '🚀 OpenAI GPT',
    description: '最强通用能力',
    category: 'international',
    free: false,
    available: false
  },
  anthropic: {
    name: '🧠 Anthropic Claude',
    description: '安全性和推理能力强',
    category: 'international',
    free: false,
    available: false
  },
  groq: {
    name: '⚡ Groq',
    description: '超快推理速度',
    category: 'international',
    free: false,
    available: false
  },
  mistral: {
    name: '🇫🇷 Mistral AI',
    description: '欧洲开源模型',
    category: 'international',
    free: false,
    available: false
  },
  cohere: {
    name: '🌐 Cohere',
    description: '企业级AI平台',
    category: 'international',
    free: false,
    available: false
  },

  // 国内平台
  qwen: {
    name: '🇨🇳 通义千问',
    description: '阿里云，中文能力强',
    category: 'domestic',
    free: false,
    available: false
  },
  zhipu: {
    name: '🇨🇳 智谱AI',
    description: 'GLM-4模型，推理能力好',
    category: 'domestic',
    free: false,
    available: false
  },
  deepseek: {
    name: '🇨🇳 DeepSeek',
    description: '代码能力突出',
    category: 'domestic',
    free: false,
    available: false
  },
  moonshot: {
    name: '🇨🇳 月之暗面',
    description: 'Kimi模型，长文本处理',
    category: 'domestic',
    free: false,
    available: false
  },
  baidu: {
    name: '🇨🇳 百度文心',
    description: '文心一言，中文优化',
    category: 'domestic',
    free: false,
    available: false
  },
  minimax: {
    name: '🇨🇳 MiniMax',
    description: '海螺AI，多模态能力',
    category: 'domestic',
    free: false,
    available: false
  }
}

const CATEGORIES = {
  international: { name: '国外平台', icon: '🌍' },
  domestic: { name: '国内平台', icon: '🇨🇳' }
}

export default function AIProviderSelector({ isOpen, onClose, selectedProvider, onProviderChange, apiUrl }) {
  const [activeCategory, setActiveCategory] = useState('international')
  const [providers, setProviders] = useState(AI_PROVIDERS)
  const [loading, setLoading] = useState(false)

  // 获取平台可用性信息
  useEffect(() => {
    if (isOpen && apiUrl) {
      fetchProviderInfo()
    }
  }, [isOpen, apiUrl])

  const fetchProviderInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/chat/providers`)
      const data = await response.json()

      if (data.success && data.providers.available) {
        // 根据后端返回的可用提供商列表更新状态
        const updatedProviders = { ...AI_PROVIDERS }
        const availableProviders = data.providers.available

        // 更新每个提供商的可用性
        Object.keys(updatedProviders).forEach(key => {
          // 所有提供商根据API密钥配置决定可用性
          updatedProviders[key].available = availableProviders.includes(key)
        })

        setProviders(updatedProviders)
      }
    } catch (error) {
      console.error('Failed to fetch provider info:', error)
      // 使用静态配置作为fallback
    } finally {
      setLoading(false)
    }
  }

  // 按分类组织平台
  const providersByCategory = Object.entries(providers).reduce((acc, [key, provider]) => {
    if (!acc[provider.category]) {
      acc[provider.category] = []
    }
    acc[provider.category].push({ key, ...provider })
    return acc
  }, {})

  const handleProviderSelect = (providerKey) => {
    onProviderChange(providerKey)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* 选择器弹窗 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative top-20 w-[500px] max-h-[70vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">选择AI平台</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 分类标签 */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
              <button
                key={categoryKey}
                onClick={() => setActiveCategory(categoryKey)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeCategory === categoryKey
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* 平台列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {providersByCategory[activeCategory]?.map((provider) => {
                const isAvailable = provider.available !== false
                const isDisabled = !isAvailable

                return (
                  <motion.button
                    key={provider.key}
                    whileHover={isDisabled ? {} : { scale: 1.02 }}
                    whileTap={isDisabled ? {} : { scale: 0.98 }}
                    onClick={() => isDisabled ? null : handleProviderSelect(provider.key)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                        : selectedProvider === provider.key
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                            {provider.name}
                          </span>
                          {isAvailable && provider.key === 'gemini' && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                              已配置
                            </span>
                          )}
                          {isDisabled && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-500 rounded-full">
                              🔒 需要密钥
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                          {provider.description}
                        </p>
                        {isDisabled && (
                          <p className="text-xs text-gray-400 mt-1">
                            请配置API密钥后解锁使用
                          </p>
                        )}
                      </div>
                      {selectedProvider === provider.key && isAvailable && (
                        <div className="ml-2 text-blue-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {isDisabled && (
                        <div className="ml-2 text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 目前已配置Google Gemini，其他平台需要添加API密钥后解锁
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
