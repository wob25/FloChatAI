# 🤖 AI平台选择功能演示

## 🎯 新功能概览

### ✅ 已实现功能

1. **17个AI平台支持**
   - 🆓 **免费服务**: Google Gemini, Groq
   - 🇨🇳 **国内平台**: 通义千问, 智谱AI, DeepSeek, 月之暗面, 文心一言, MiniMax
   - 🌍 **国外平台**: OpenAI, Anthropic, Mistral, Cohere, Perplexity, Together AI, Fireworks, Replicate, Hugging Face

2. **多密钥轮换**
   - 每个平台支持多个API密钥
   - 配额用完自动切换到下一个密钥
   - 智能错误恢复和重试机制

3. **用户界面**
   - 📱 AI平台选择按钮（在文件上传按钮上方）
   - 🎨 美观的弹窗界面，按分类显示平台
   - 🔄 支持"智能选择"模式

4. **智能选择策略**
   - 📸 **图片处理**: Gemini → OpenAI → 通义千问
   - 💻 **代码相关**: DeepSeek → OpenAI → Claude
   - 🧠 **复杂推理**: Claude → OpenAI → 智谱AI
   - 💬 **日常对话**: Gemini(免费) → 国内平台

## 🚀 使用方法

### 1. 配置密钥

```bash
# 使用管理工具（推荐）
cd chatai-workers
node scripts/manage-keys.js

# 或手动配置
echo "key1,key2,key3" | wrangler secret put GEMINI_API_KEYS
echo "sk-1,sk-2,sk-3" | wrangler secret put OPENAI_API_KEYS
```

### 2. 前端使用

1. 点击聊天输入框上方的 🤖 按钮
2. 选择想要使用的AI平台
3. 发送消息，系统会使用选择的平台

### 3. 智能选择模式

选择"🤖 智能选择"，系统会根据内容自动选择最佳平台：

- **发送图片** → 自动选择支持视觉的模型
- **发送代码** → 自动选择代码能力强的模型
- **复杂问题** → 自动选择推理能力强的模型
- **普通对话** → 自动选择免费/低成本模型

## 📊 平台分类

### 🆓 免费服务
- **Google Gemini**: 每天1500次免费请求，视觉能力强
- **Groq**: 超快推理速度，免费使用

### 🇨🇳 国内平台（速度快，成本低）
- **通义千问**: 阿里云，中文能力强
- **智谱AI**: GLM-4模型，推理能力好
- **DeepSeek**: 代码能力突出
- **月之暗面**: Kimi模型，长文本处理
- **文心一言**: 百度AI，稳定可靠
- **MiniMax**: 多模态能力

### 🌍 国外平台（能力强，成本高）
- **OpenAI GPT**: 最强通用能力
- **Anthropic Claude**: 安全性和推理能力强
- **Mistral AI**: 欧洲AI，开源友好
- **Cohere**: 企业级AI解决方案
- **Perplexity**: 搜索增强的AI
- **Together AI**: 开源模型托管
- **Fireworks AI**: 高性能推理
- **Replicate**: 模型复制平台
- **Hugging Face**: 开源AI社区

## 🔧 技术实现

### 前端组件
- `AIProviderSelector.js`: AI平台选择器
- `ChatInput.js`: 添加选择按钮
- `ChatAI.js`: 状态管理

### 后端服务
- `aiService.js`: 17个平台的API调用实现
- `chatHandler.js`: 支持preferredProvider参数
- 密钥轮换和错误恢复机制

### 配置管理
- `manage-keys.js`: 批量密钥管理工具
- `deploy.sh`: 部署时密钥配置
- 环境变量支持多密钥格式

## 🎯 优势特点

1. **高可用性**: 多密钥备份，单点故障不影响服务
2. **成本优化**: 优先使用免费和低成本平台
3. **智能路由**: 根据内容类型选择最适合的AI模型
4. **用户友好**: 简单易用的界面，支持手动和自动选择
5. **企业级**: 支持17个主流AI平台，满足各种需求

## 🔮 未来扩展

- [ ] 添加更多AI平台支持
- [ ] 实时配额监控和告警
- [ ] 成本分析和优化建议
- [ ] 自定义平台优先级
- [ ] API调用统计和分析
