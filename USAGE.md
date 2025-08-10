# FloChatAI 详细使用说明 📖

## 📋 目录

1. [安装与配置](#安装与配置)
2. [基本使用](#基本使用)
3. [高级配置](#高级配置)
4. [API接口说明](#api接口说明)
5. [故障排除](#故障排除)
6. [最佳实践](#最佳实践)

## 🚀 安装与配置

### 前端安装

#### 1. 安装依赖
```bash
npm install framer-motion
# 或者使用 yarn
yarn add framer-motion
```

#### 2. 复制组件文件
将整个 `components` 目录复制到你的React项目中：
```
your-project/
├── src/
│   ├── components/
│   │   └── ChatAI/          # 复制这个目录
│   │       ├── ChatAI.js
│   │       ├── ChatAIWidget.js
│   │       └── ...
│   └── App.js
```

#### 3. 确保Tailwind CSS配置
确保你的项目已经配置了Tailwind CSS。如果没有，请参考 [Tailwind CSS安装指南](https://tailwindcss.com/docs/installation)。

### 后端部署

#### 1. 安装Wrangler CLI
```bash
npm install -g wrangler
```

#### 2. 登录Cloudflare
```bash
wrangler login
```

#### 3. 部署Workers
```bash
cd chatai-workers
npm install
wrangler deploy
```

#### 4. 配置环境变量
```bash
# 必需的API密钥
wrangler secret put GEMINI_API_KEYS
wrangler secret put OPENAI_API_KEYS
wrangler secret put ANTHROPIC_API_KEYS

# 可选的API密钥
wrangler secret put GROQ_API_KEYS
wrangler secret put MISTRAL_API_KEYS
wrangler secret put COHERE_API_KEYS
```

## 💻 基本使用

### 最简单的集成

```jsx
import React from 'react'
import ChatAIWidget from './components/ChatAIWidget'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 你的应用内容 */}
      <h1>我的应用</h1>
      
      {/* FloChatAI 悬浮聊天组件 */}
      <ChatAIWidget
        config={{
          workerUrl: 'https://your-workers-url.workers.dev'
        }}
      />
    </div>
  )
}

export default App
```

### 完整配置示例

```jsx
import React from 'react'
import ChatAIWidget from './components/ChatAIWidget'

function App() {
  const chatConfig = {
    // 基本配置
    name: '我的AI助手',
    avatar: 'https://example.com/avatar.png',
    welcomeMessage: '你好！我是你的AI助手，有什么可以帮助你的吗？',
    
    // 位置配置
    position: 'bottom-right', // 'bottom-right' | 'bottom-left'
    
    // 后端配置
    workerUrl: 'https://your-workers-url.workers.dev',
    
    // 样式配置
    theme: {
      primaryColor: '#3B82F6',
      borderRadius: '12px'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ChatAIWidget config={chatConfig} />
    </div>
  )
}

export default App
```

## ⚙️ 高级配置

### 配置选项详解

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `name` | string | 'ChatAI' | 聊天助手名称 |
| `avatar` | string | 默认头像 | 助手头像URL |
| `welcomeMessage` | string | 默认欢迎语 | 首次打开时的欢迎消息 |
| `position` | string | 'bottom-right' | 悬浮按钮位置 |
| `workerUrl` | string | 必需 | Cloudflare Workers API地址 |
| `theme` | object | {} | 主题配置 |

### 主题自定义

```jsx
const customTheme = {
  // 主色调
  primaryColor: '#3B82F6',
  
  // 圆角大小
  borderRadius: '12px',
  
  // 悬浮按钮大小
  buttonSize: '60px',
  
  // 聊天窗口大小
  chatWidth: '400px',
  chatHeight: '600px',
  
  // 字体配置
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px'
}

<ChatAIWidget 
  config={{
    workerUrl: 'https://your-workers-url.workers.dev',
    theme: customTheme
  }}
/>
```

### 事件回调

```jsx
const handleChatEvent = (event, data) => {
  switch (event) {
    case 'message_sent':
      console.log('用户发送消息:', data.message)
      break
    case 'message_received':
      console.log('AI回复消息:', data.message)
      break
    case 'chat_opened':
      console.log('聊天窗口打开')
      break
    case 'chat_closed':
      console.log('聊天窗口关闭')
      break
  }
}

<ChatAIWidget 
  config={{
    workerUrl: 'https://your-workers-url.workers.dev',
    onEvent: handleChatEvent
  }}
/>
```

## 🔌 API接口说明

### 聊天接口

#### 发送消息
```http
POST /api/chat/send
Content-Type: application/json
X-Chat-Session: your-session-id

{
  "message": "用户消息内容",
  "preferredProvider": "gemini",
  "files": [
    {
      "name": "image.jpg",
      "type": "image/jpeg",
      "data": "base64-encoded-data"
    }
  ]
}
```

#### 获取聊天历史
```http
GET /api/chat/list
X-Chat-Session: your-session-id
```

#### 获取单个聊天
```http
GET /api/chat/{chatId}
X-Chat-Session: your-session-id
```

#### 删除聊天
```http
DELETE /api/chat/{chatId}
X-Chat-Session: your-session-id
```

#### 清空所有聊天
```http
DELETE /api/chat/clear-all
X-Chat-Session: your-session-id
```

### 系统接口

#### 获取支持的AI平台
```http
GET /api/chat/providers
```

#### 检查服务状态
```http
GET /api/health
```

## 🔧 故障排除

### 常见问题

#### 1. 组件不显示
**问题**: ChatAI组件没有显示在页面上
**解决方案**:
- 检查Tailwind CSS是否正确安装和配置
- 确保`workerUrl`配置正确
- 检查浏览器控制台是否有错误信息

#### 2. API请求失败
**问题**: 聊天功能不工作，API请求失败
**解决方案**:
- 检查Cloudflare Workers是否正确部署
- 验证API密钥是否正确配置
- 检查CORS设置

#### 3. 文件上传失败
**问题**: 无法上传文件或图片
**解决方案**:
- 检查文件大小是否超过限制（默认10MB）
- 确保文件格式被支持
- 检查R2存储配置

#### 4. 历史记录不保存
**问题**: 聊天历史记录丢失
**解决方案**:
- 检查KV存储是否正确配置
- 确保sessionId正确传递
- 检查浏览器localStorage是否被禁用

### 调试技巧

#### 启用调试模式
```jsx
<ChatAIWidget 
  config={{
    workerUrl: 'https://your-workers-url.workers.dev',
    debug: true  // 启用调试模式
  }}
/>
```

#### 查看网络请求
1. 打开浏览器开发者工具
2. 切换到Network标签
3. 筛选XHR/Fetch请求
4. 查看API请求和响应

#### 检查控制台日志
```javascript
// 在浏览器控制台中查看详细日志
localStorage.setItem('chatai_debug', 'true')
```

## 🎯 最佳实践

### 性能优化

#### 1. 懒加载组件
```jsx
import { lazy, Suspense } from 'react'

const ChatAIWidget = lazy(() => import('./components/ChatAIWidget'))

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ChatAIWidget config={chatConfig} />
      </Suspense>
    </div>
  )
}
```

#### 2. 缓存配置
```jsx
const chatConfig = useMemo(() => ({
  workerUrl: 'https://your-workers-url.workers.dev',
  name: 'AI助手'
}), [])
```

### 安全建议

#### 1. API密钥管理
- 永远不要在前端代码中暴露API密钥
- 使用Cloudflare Workers的secrets功能
- 定期轮换API密钥

#### 2. 用户输入验证
- 在后端验证所有用户输入
- 限制文件上传大小和类型
- 实施速率限制

#### 3. 数据隐私
- 不要记录敏感用户信息
- 实施数据保留策略
- 遵守相关隐私法规

### 用户体验优化

#### 1. 响应式设计
```jsx
const isMobile = window.innerWidth < 768

<ChatAIWidget 
  config={{
    workerUrl: 'https://your-workers-url.workers.dev',
    position: isMobile ? 'bottom-center' : 'bottom-right',
    theme: {
      chatWidth: isMobile ? '100vw' : '400px'
    }
  }}
/>
```

#### 2. 加载状态
- 显示消息发送状态
- 提供AI思考指示器
- 实现优雅的错误处理

#### 3. 可访问性
- 支持键盘导航
- 提供屏幕阅读器支持
- 确保足够的颜色对比度

---

📝 **需要更多帮助？** 请查看 [API文档](./chatai-workers/README.md) 或提交 [Issue](https://github.com/your-username/FloChatAI/issues)。
