/**
 * ChatAI 输入组件
 */

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import AIProviderSelector from './AIProviderSelector'

// AI平台显示名称映射
const PROVIDER_NAMES = {
  // 国外平台
  gemini: '🔮 Gemini',
  openai: '🚀 OpenAI',
  anthropic: '🧠 Claude',
  groq: '⚡ Groq',
  mistral: '🇫🇷 Mistral',
  cohere: '🔗 Cohere',
  perplexity: '🔍 Perplexity',
  together: '🤝 Together',
  fireworks: '🎆 Fireworks',
  replicate: '🔄 Replicate',
  huggingface: '🤗 HuggingFace',

  // 国内平台
  qwen: '🇨🇳 通义千问',
  zhipu: '🇨🇳 智谱AI',
  deepseek: '🇨🇳 DeepSeek',
  moonshot: '🇨🇳 月之暗面',
  baidu: '🇨🇳 文心一言',
  minimax: '🇨🇳 MiniMax'
}

const ChatInput = ({
  onSendMessage,
  onFileUpload,
  isLoading,
  placeholder = "Message...",
  disabled = false,
  selectedProvider = 'gemini',
  onProviderChange,
  apiUrl
}) => {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // 提取消息中的URL
  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.match(urlRegex) || []
  }

  // 处理发送消息
  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || isLoading || disabled) return

    const messageText = message.trim()
    const messageFiles = [...files]
    const urls = extractUrls(messageText)

    // 清空输入
    setMessage('')
    setFiles([])

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // 发送消息，包含提取的URL
    await onSendMessage(messageText, messageFiles, urls)
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理文件选择
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  // 处理文件
  const handleFiles = async (selectedFiles) => {
    const processedFiles = []
    
    for (const file of selectedFiles) {
      // 文件大小限制 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件 ${file.name} 太大，请选择小于10MB的文件`)
        continue
      }

      // 创建文件包装对象，保留原始File对象
      const fileData = {
        file: file, // 原始File对象
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size
      }

      // 如果是文本文件，读取内容
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        try {
          const content = await readFileAsText(file)
          fileData.content = content
        } catch (error) {
          console.error('读取文件失败:', error)
        }
      }

      processedFiles.push(fileData)
    }

    setFiles(prev => [...prev, ...processedFiles])
  }

  // 读取文件为文本
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // 移除文件
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 处理拖拽
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  // 自动调整textarea高度
  const handleTextareaChange = (e) => {
    setMessage(e.target.value)
    
    // 自动调整高度
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700 truncate max-w-32">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 工具栏区域 */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
          {/* AI平台选择按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProviderSelector(true)}
            disabled={disabled}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-purple-200"
            title="选择AI平台"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="max-w-24 truncate">
              {PROVIDER_NAMES[selectedProvider] || selectedProvider}
            </span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>

          {/* 文件上传按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-blue-200"
            title="上传文件"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>上传文件</span>
          </motion.button>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {files.length > 0 && (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{files.length}</span>
              </span>
            )}
            {isLoading && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>处理中</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div
        className={`
          px-4 pb-4 transition-colors duration-200
          ${isDragging ? 'bg-blue-50 border-blue-200' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-end space-x-3">
          {/* 文本输入 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Connecting..." : placeholder}
              disabled={disabled || isLoading}
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            {/* 拖拽提示 */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                <p className="text-blue-600 text-sm">Drop files here</p>
              </div>
            )}
          </div>

          {/* 发送按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={(!message.trim() && files.length === 0) || isLoading || disabled}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            title="Send message"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>

      {/* AI平台选择器 */}
      <AIProviderSelector
        isOpen={showProviderSelector}
        onClose={() => setShowProviderSelector(false)}
        selectedProvider={selectedProvider}
        onProviderChange={onProviderChange}
        apiUrl={apiUrl}
      />
    </div>
  )
}

export default ChatInput
