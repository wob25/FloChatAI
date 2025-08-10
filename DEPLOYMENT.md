# FloChatAI 部署指南 🚀

## 📋 部署概览

FloChatAI 采用前后端分离架构：
- **前端**: React组件，可集成到任何React项目
- **后端**: Cloudflare Workers，提供AI聊天API服务

## 🔧 后端部署 (Cloudflare Workers)

### 1. 准备工作

#### 安装Wrangler CLI
```bash
npm install -g wrangler
```

#### 登录Cloudflare账户
```bash
wrangler login
```

### 2. 配置项目

#### 检查wrangler.toml配置
```toml
name = "chatai-workers"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "chatai-workers-prod"

[[kv_namespaces]]
binding = "CHAT_STORAGE"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "FILE_STORAGE"
bucket_name = "chatai-files"
```

#### 创建KV命名空间
```bash
# 创建KV存储
wrangler kv:namespace create "CHAT_STORAGE"
wrangler kv:namespace create "CHAT_STORAGE" --preview

# 创建R2存储桶
wrangler r2 bucket create chatai-files
```

### 3. 配置API密钥

#### Google Gemini (推荐)
```bash
echo "your-gemini-api-key" | wrangler secret put GEMINI_API_KEYS
```

#### OpenAI GPT
```bash
echo "your-openai-api-key" | wrangler secret put OPENAI_API_KEYS
```

#### Anthropic Claude
```bash
echo "your-anthropic-api-key" | wrangler secret put ANTHROPIC_API_KEYS
```

#### 其他平台 (可选)
```bash
# Groq
echo "your-groq-api-key" | wrangler secret put GROQ_API_KEYS

# Mistral AI
echo "your-mistral-api-key" | wrangler secret put MISTRAL_API_KEYS

# Cohere
echo "your-cohere-api-key" | wrangler secret put COHERE_API_KEYS

# 国内平台
echo "your-qwen-api-key" | wrangler secret put QWEN_API_KEYS
echo "your-zhipu-api-key" | wrangler secret put ZHIPU_API_KEYS
echo "your-deepseek-api-key" | wrangler secret put DEEPSEEK_API_KEYS
```

### 4. 部署到生产环境

#### 安装依赖
```bash
cd chatai-workers
npm install
```

#### 部署
```bash
# 部署到默认环境
wrangler deploy

# 部署到生产环境
wrangler deploy --env production
```

#### 验证部署
```bash
# 测试API
curl https://your-workers-url.workers.dev/api/health
```

### 5. 自定义域名 (可选)

#### 在Cloudflare Dashboard中配置
1. 进入Cloudflare Dashboard
2. 选择你的域名
3. 进入Workers & Pages
4. 添加自定义域名

#### 或使用Wrangler命令
```bash
wrangler route add "api.yourdomain.com/*" your-worker-name
```

## 💻 前端集成

### 1. React项目集成

#### 安装依赖
```bash
npm install framer-motion
```

#### 复制组件
```bash
# 将components目录复制到你的项目
cp -r components /path/to/your/project/src/
```

#### 基本使用
```jsx
import ChatAIWidget from './components/ChatAIWidget'

function App() {
  return (
    <div>
      <ChatAIWidget
        config={{
          workerUrl: 'https://your-workers-url.workers.dev'
        }}
      />
    </div>
  )
}
```

### 2. Next.js项目集成

#### 动态导入 (推荐)
```jsx
import dynamic from 'next/dynamic'

const ChatAIWidget = dynamic(
  () => import('../components/ChatAIWidget'),
  { ssr: false }
)

export default function Home() {
  return (
    <div>
      <ChatAIWidget
        config={{
          workerUrl: 'https://your-workers-url.workers.dev'
        }}
      />
    </div>
  )
}
```

### 3. Vite项目集成

#### vite.config.js配置
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['framer-motion']
  }
})
```

## 🌐 生产环境配置

### 1. 环境变量管理

#### 开发环境
```bash
# .env.local
NEXT_PUBLIC_CHATAI_WORKER_URL=https://your-dev-workers-url.workers.dev
```

#### 生产环境
```bash
# .env.production
NEXT_PUBLIC_CHATAI_WORKER_URL=https://your-prod-workers-url.workers.dev
```

### 2. 性能优化

#### Cloudflare Workers优化
```javascript
// 启用缓存
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default
    const cacheKey = new Request(request.url, request)
    
    // 检查缓存
    let response = await cache.match(cacheKey)
    if (response) {
      return response
    }
    
    // 处理请求
    response = await handleRequest(request, env)
    
    // 缓存响应
    if (response.status === 200) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    }
    
    return response
  }
}
```

#### 前端优化
```jsx
// 懒加载组件
const ChatAIWidget = lazy(() => import('./components/ChatAIWidget'))

// 使用Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ChatAIWidget config={config} />
</Suspense>
```

### 3. 监控和日志

#### Cloudflare Analytics
```javascript
// 在Workers中添加分析
export default {
  async fetch(request, env, ctx) {
    const start = Date.now()
    
    try {
      const response = await handleRequest(request, env)
      
      // 记录成功请求
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          blobs: ['success'],
          doubles: [Date.now() - start],
          indexes: [request.url]
        })
      )
      
      return response
    } catch (error) {
      // 记录错误
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          blobs: ['error', error.message],
          doubles: [Date.now() - start],
          indexes: [request.url]
        })
      )
      
      throw error
    }
  }
}
```

## 🔒 安全配置

### 1. CORS设置
```javascript
// 在Workers中配置CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Chat-Session',
  'Access-Control-Max-Age': '86400'
}
```

### 2. 速率限制
```javascript
// 实施速率限制
const rateLimiter = {
  async isAllowed(ip, env) {
    const key = `rate_limit:${ip}`
    const current = await env.CHAT_STORAGE.get(key)
    
    if (!current) {
      await env.CHAT_STORAGE.put(key, '1', { expirationTtl: 60 })
      return true
    }
    
    const count = parseInt(current)
    if (count >= 60) { // 每分钟60次请求
      return false
    }
    
    await env.CHAT_STORAGE.put(key, (count + 1).toString(), { expirationTtl: 60 })
    return true
  }
}
```

### 3. 输入验证
```javascript
// 验证用户输入
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message')
  }
  
  if (message.length > 10000) {
    throw new Error('Message too long')
  }
  
  // 检查恶意内容
  const maliciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i]
  for (const pattern of maliciousPatterns) {
    if (pattern.test(message)) {
      throw new Error('Malicious content detected')
    }
  }
  
  return true
}
```

## 📊 监控和维护

### 1. 健康检查
```javascript
// 添加健康检查端点
app.get('/api/health', async (c) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      kv: 'unknown',
      r2: 'unknown',
      ai_providers: {}
    }
  }
  
  // 检查KV存储
  try {
    await c.env.CHAT_STORAGE.get('health_check')
    checks.services.kv = 'healthy'
  } catch (error) {
    checks.services.kv = 'unhealthy'
    checks.status = 'degraded'
  }
  
  return c.json(checks)
})
```

### 2. 错误追踪
```javascript
// 集成错误追踪服务
function logError(error, context) {
  console.error('FloChatAI Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
  
  // 发送到外部错误追踪服务
  // 如 Sentry, LogRocket 等
}
```

### 3. 性能监控
```javascript
// 监控API响应时间
const performanceMonitor = {
  async track(operation, fn) {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      console.log(`Operation ${operation} took ${duration}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Operation ${operation} failed after ${duration}ms:`, error)
      throw error
    }
  }
}
```

## 🔄 CI/CD配置

### GitHub Actions示例
```yaml
name: Deploy FloChatAI

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd chatai-workers
          npm install
          
      - name: Deploy to Cloudflare Workers
        run: |
          cd chatai-workers
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

