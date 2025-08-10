/**
 * FloChatAI 使用示例
 * 展示如何在 React 应用中集成 ChatAI 组件
 */

import React from 'react'
import ChatAIWidget from './components/ChatAIWidget'

const App = () => {
  // ChatAI 配置
  const chatConfig = {
    name: '𝒞𝒽𝒶𝓉𝒜𝐼',
    avatar: '/chatai-avatar.png',
    welcomeMessage: '✨ 𝐻𝑒𝓁𝓁𝑜, 𝓌𝒽𝒶𝓉 𝒸𝒶𝓃 𝐼 𝒹𝑜 𝒻𝑜𝓇 𝓎𝑜𝓊?',
    position: 'bottom-right', // 或 'bottom-left'
    workerUrl: process.env.NEXT_PUBLIC_CHATAI_WORKER_URL || 'https://your-worker.your-subdomain.workers.dev'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 您的应用内容 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              FloChatAI 示例应用
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                欢迎使用 FloChatAI
              </h2>
              <p className="text-gray-500 mb-4">
                点击右下角的聊天按钮开始对话
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✨ 支持 13 个 AI 平台</p>
                <p>📁 支持文件上传</p>
                <p>🔗 支持 URL 解析</p>
                <p>💬 实时流式响应</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ChatAI 悬浮组件 */}
      <ChatAIWidget config={chatConfig} />
    </div>
  )
}

export default App