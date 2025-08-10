# ChatAI 快速启动指南

🤖 基于 Cloudflare Workers 的智能聊天助手，支持文件上传、URL解析、多AI提供商等功能。

## 🚀 快速开始

### 1. 环境准备

```bash
# 确保已安装 Node.js 16+
node --version

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 2. 部署后端服务

```bash
# 进入 Workers 目录
cd chatai-workers

# 安装依赖
npm install

# 一键部署（开发环境）
chmod +x deploy.sh
./deploy.sh development

# 或手动部署
wrangler deploy --env development
```

### 3. 配置前端

```bash
# 回到项目根目录
cd ..

# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量
# 设置 NEXT_PUBLIC_CHATAI_WORKER_URL=https://your-worker-url.workers.dev
```

### 4. 启动项目

```bash
# 安装前端依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

### 5. 测试功能

```bash
# 运行测试脚本
node test-chatai.js
```

## ✨ 功能特性

### 🤖 AI 对话
- 支持 OpenAI GPT、Anthropic Claude、Google Gemini
- 智能选择最适合的 AI 模型
- 上下文记忆和对话历史

### 📁 文件处理
- 支持文本、图片、代码等多种文件类型
- 自动识别和解析文件内容
- 安全的文件存储和管理

### 🔗 URL 解析
- 自动提取网站标题、描述、内容
- 支持 Open Graph 元数据
- 智能内容摘要

### 💬 聊天管理
- 新建聊天、结束聊天
- 查看聊天历史
- 实时消息同步

## 🎨 界面展示

ChatAI 提供类似 ChatbaseAI 的用户界面：

- 🎯 **浮动按钮**: 右下角智能聊天入口
- 💬 **聊天窗口**: 现代化的对话界面
- 📋 **菜单功能**: 新建、结束、历史记录
- 📱 **响应式设计**: 支持桌面和移动设备

## ⚙️ 配置选项

### 主题配置 (themes/matery/config.js)

```javascript
const CONFIG = {
  // 启用 ChatAI
  CHATAI_ENABLE: true,

  // 基本设置
  CHATAI_NAME: 'your-application-name',
  CHATAI_AVATAR: 'https://imgbed.com/file/1756583573155_chatai.png', // 自定义备用头像URL
  CHATAI_WELCOME: '👋 Hello, what can I do for you?',

  // 位置设置
  CHATAI_POSITION: 'bottom-right', // 或 'bottom-left'

  // 后端服务
  CHATAI_WORKER_URL: 'https://your-domain.com'
}
```

### 环境变量 (.env.local)

```bash
# 必需配置
NEXT_PUBLIC_CHATAI_WORKER_URL=https://chatai-username.workers.dev
# 可选配置
CHATAI_ENABLE=true
CHATAI_NAME=your-application-name
CHATAI_POSITION=bottom-right
```

## 🔧 高级配置

### AI 提供商设置

在 Cloudflare Workers 中设置 API Keys：

```bash
# OpenAI
echo "your-openai-key" | wrangler secret put OPENAI_API_KEY

# Anthropic Claude
echo "your-anthropic-key" | wrangler secret put ANTHROPIC_API_KEY

# Google Gemini
echo "your-gemini-key" | wrangler secret put GEMINI_API_KEY
```

### 自定义样式

修改 `components/` 目录下的组件文件来自定义界面：

- `ChatAI.js` - 主组件
- `ChatHeader.js` - 头部样式
- `ChatMessages.js` - 消息列表
- `ChatInput.js` - 输入框
- `MessageBubble.js` - 消息气泡

## 🛠️ 开发调试

### 本地开发

```bash
# 启动 Workers 开发服务器
cd chatai-workers
wrangler dev

# 启动前端开发服务器
cd ..
npm run dev
```

### 查看日志

```bash
# Workers 日志
wrangler tail

# 前端日志
# 在浏览器开发者工具中查看
```

### 测试 API

```bash
# 健康检查
curl https://your-worker-url.workers.dev/

# 测试聊天
curl -X POST https://your-worker-url.workers.dev/api/chat/send \
  -H "Content-Type: application/json" \
  -H "X-Chat-Session: test-session" \
  -d '{"message": "Hello!"}'
```

## 📊 监控和维护

### 使用统计

```bash
# Workers 使用情况
wrangler metrics

# 存储使用情况
wrangler kv:key list --binding CHAT_STORAGE
wrangler r2 object list chatai-files
```

### 数据清理

```bash
# 手动清理过期数据
curl -X POST https://your-worker-url.workers.dev/api/auth/cleanup
```

## 🔒 安全注意事项

1. **API 密钥**: 仅在 Workers 中设置，不要暴露到前端
2. **CORS 配置**: 限制允许的域名
3. **文件上传**: 设置合理的大小和类型限制
4. **速率限制**: 防止 API 滥用

## 🆘 故障排除

### 常见问题

**Q: ChatAI 按钮不显示**
A: 检查 `CHATAI_ENABLE` 配置和组件导入

**Q: 无法连接到 Workers**
A: 验证 `NEXT_PUBLIC_CHATAI_WORKER_URL` 设置

**Q: AI 不回复**
A: 检查 API Keys 设置和 Workers 日志

**Q: 文件上传失败**
A: 确认 R2 存储配置正确

### 获取帮助

- 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- 检查浏览器开发者工具的控制台
- 运行 `node test-chatai.js` 进行诊断

## 🎉 完成！

现在你的博客已经集成了强大的 ChatAI 功能！

访问你的网站，点击右下角的 ChatAI 按钮开始体验：
- 💬 智能对话
- 📁 文件分析
- 🔗 链接解析
- 📚 历史记录

享受你的专属 AI 助手吧！ 🚀
