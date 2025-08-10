/**
 * 消息气泡组件
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

// 代码复制组件
function CodeCopyButton({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors text-xs"
      title="复制代码"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      )}
    </button>
  )
}

const MessageBubble = ({ message, config, isLast }) => {
  const [showTime, setShowTime] = useState(false)
  const isUser = message.type === 'user'
  const isError = message.isError

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 渲染文件附件
  const renderAttachments = (files) => {
    if (!files || files.length === 0) return null

    return (
      <div className="mt-2 space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg text-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-700">{file.name}</span>
            <span className="text-gray-500 text-xs">({file.size} bytes)</span>
          </div>
        ))}
      </div>
    )
  }

  // 渲染URL链接
  const renderUrls = (urls) => {
    if (!urls || urls.length === 0) return null

    return (
      <div className="mt-2 space-y-2">
        {urls.map((url, index) => {
          // 处理URL字符串或URL对象
          const urlString = typeof url === 'string' ? url : url.url
          const urlTitle = typeof url === 'string' ? url : (url.title || url.url)

          return (
            <a
              key={index}
              href={urlString}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-blue-700 truncate">{urlTitle}</span>
              </div>
            </a>
          )
        })}
      </div>
    )
  }

  // 渲染消息内容（支持完整Markdown语法和代码高亮）
  const renderContent = (content) => {
    if (!content) return null

    // 如果是用户消息，直接显示文本
    if (isUser) {
      return <span className="whitespace-pre-wrap">{content}</span>
    }

    // AI消息支持Markdown渲染
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 代码块高亮
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')

            return !inline && match ? (
              <div className="my-3 relative">
                <div className="bg-gray-900 rounded-t-lg px-3 py-2 text-xs text-gray-300 font-medium flex justify-between items-center">
                  <span>{language.toUpperCase()}</span>
                  <CodeCopyButton code={codeString} />
                </div>
                <div className="relative bg-gray-800 rounded-b-lg overflow-hidden">
                  <div className="overflow-x-auto max-w-full">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      className="!mt-0 !rounded-t-none !bg-transparent"
                      customStyle={{
                        margin: 0,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        backgroundColor: 'transparent',
                        padding: '12px 16px',
                        minWidth: 'max-content'
                      }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            ) : (
              <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          // 链接样式
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
                {...props}
              >
                {children}
              </a>
            )
          },
          // 标题样式
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
          // 列表样式
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          // 引用样式
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-600">
              {children}
            </blockquote>
          ),
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-gray-300">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-2">{children}</td>
          ),
          // 段落样式
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2 w-full`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3 max-w-[98%] w-full`}>
        {/* AI助手头像 - 靠左 */}
        {!isUser && (
          <img
            src="/chatai-avatar.png"
            alt="AI助手"
            className="chatai-avatar w-10 h-10 rounded-full border-2 border-purple-200 shadow-lg flex-shrink-0 bg-gradient-to-br from-purple-400 to-blue-500"
            onError={(e) => {
              // 如果主头像加载失败，尝试备用头像
              if (e.target.src.includes('chatai-avatar.png')) {
                e.target.src = '/default-chatai.png'
              } else {
                // 如果备用头像也失败，显示默认样式
                e.target.style.display = 'none'
              }
            }}
          />
        )}

        {/* 用户头像 - 靠右，男同学头像 */}
        {isUser && (
          <img
            src="/user.png"
            alt="用户头像"
            className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-lg flex-shrink-0 object-cover"
            onError={(e) => {
              // 如果图片加载失败，显示默认头像
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}

        {/* 用户头像备用方案 */}
        {isUser && (
          <div className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-lg flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-500 items-center justify-center" style={{display: 'none'}}>
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}

        {/* 消息气泡 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowTime(!showTime)}
          className={`
            relative px-4 py-2 rounded-2xl cursor-pointer transition-all duration-200 max-w-full min-w-0 flex-1 overflow-hidden
            ${isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : isError
                ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-md'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
            }
          `}
        >
          {/* 消息内容 */}
          <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
            {renderContent(message.content)}
          </div>

          {/* 附件 */}
          {renderAttachments(message.files)}

          {/* URL链接 */}
          {renderUrls(message.urls)}

          {/* 元数据 */}
          {message.metadata && !isUser && (
            <div className="mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span>Provider: {message.metadata.provider || message.metadata.selectedProvider || 'unknown'}</span>
                {message.metadata.tokensUsed && (
                  <span>• Tokens: {message.metadata.tokensUsed}</span>
                )}
                {message.metadata.processingTime && (
                  <span>• {message.metadata.processingTime}ms</span>
                )}
              </div>
            </div>
          )}

          {/* 时间戳 */}
          {showTime && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                absolute top-full mt-1 text-xs text-gray-500
                ${isUser ? 'right-0' : 'left-0'}
              `}
            >
              {formatTime(message.timestamp)}
            </motion.div>
          )}

          {/* 错误指示器 */}
          {isError && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          )}
        </motion.div>


      </div>
    </div>
  )
}

export default MessageBubble
