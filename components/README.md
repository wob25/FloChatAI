# FloChatAI 组件文档

## 组件结构

### 主要组件

#### `ChatAIWidget.js` - 悬浮聊天组件
主要的悬浮聊天组件，提供完整的聊天功能。

**Props:**
```jsx
{
  config: {
    name: string,           // 聊天助手名称
    avatar: string,         // 头像URL
    welcomeMessage: string, // 欢迎消息
    position: string,       // 位置: 'bottom-right' | 'bottom-left'
    workerUrl: string       // Cloudflare Workers API URL
  }
}
```

#### `ChatAI.js` - 聊天主组件
聊天窗口的主要组件，包含消息列表、输入框等。

#### `ChatInput.js` - 输入组件
处理用户输入、文件上传、AI平台选择等功能。

#### `ChatMessages.js` - 消息列表
显示聊天消息的组件。

#### `AIProviderSelector.js` - AI平台选择器
AI平台选择弹窗组件，支持国外/国内平台分类。

### 辅助组件

#### `ChatHeader.js` - 聊天头部
聊天窗口的头部组件，包含标题、菜单按钮等。

#### `ChatMenu.js` - 菜单组件
聊天菜单下拉组件，提供新建聊天、查看历史等功能。

#### `ChatHistory.js` - 聊天历史
聊天历史记录弹窗组件。

#### `MessageBubble.js` - 消息气泡
单个消息的显示组件。

#### `QuotaStatus.js` - 配额状态
AI平台配额状态显示组件。

#### `TypingIndicator.js` - 输入指示器
AI正在输入时的动画指示器。

### Hooks

#### `hooks/useChatAI.js` - 聊天状态管理
自定义Hook，管理聊天状态、消息发送、文件上传等功能。

## 使用方法

### 基本使用

```jsx
import ChatAIWidget from './components/ChatAIWidget'

function App() {
  return (
    <div>
      <ChatAIWidget
        config={{
          name: 'FloChatAI',
          avatar: 'https://your-avatar-url.png',
          welcomeMessage: '✨ Hello, what can I do for you?',
          position: 'bottom-right',
          workerUrl: 'https://your-workers-url.workers.dev'
        }}
      />
    </div>
  )
}
```

### 自定义配置

```jsx
const chatConfig = {
  name: '我的AI助手',
  avatar: 'https://example.com/avatar.png',
  welcomeMessage: '你好！我是你的AI助手，有什么可以帮助你的吗？',
  position: 'bottom-left',
  workerUrl: 'https://my-chatai.workers.dev'
}

<ChatAIWidget config={chatConfig} />
```

## 样式定制

组件使用Tailwind CSS构建，你可以通过以下方式自定义样式：

1. **修改组件文件**: 直接编辑组件文件中的className
2. **CSS覆盖**: 使用更高优先级的CSS规则覆盖默认样式
3. **主题配置**: 通过Tailwind配置文件自定义主题

## 依赖要求

- React >= 18.0.0
- framer-motion >= 10.0.0
- Tailwind CSS (推荐)

## 注意事项

1. 确保你的项目已安装并配置了Tailwind CSS
2. 需要部署Cloudflare Workers后端服务
3. 组件使用了现代React特性，确保你的构建工具支持
