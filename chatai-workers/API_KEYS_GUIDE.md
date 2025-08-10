# 🔑 AI密钥配置指南

## 🚀 快速开始

### 方法一：使用管理工具 (推荐)

```bash
cd chatai-workers
node scripts/manage-keys.js
```

### 方法二：手动设置

```bash
# 多密钥格式 (推荐)
echo "key1,key2,key3" | wrangler secret put GEMINI_API_KEYS

# 单密钥格式 (兼容)
echo "your-key" | wrangler secret put GEMINI_API_KEY
```

## 🌟 推荐配置优先级

### 1. 免费额度大 (优先配置)
- **Google Gemini** - 每天1500次免费请求
- **阿里通义千问** - 国内访问快，有免费额度

### 2. 国内平台 (速度快，成本低)
- **智谱AI** - GLM-4模型，中文能力强
- **月之暗面** - Kimi模型，长文本处理好
- **DeepSeek** - 代码能力突出
- **百度文心一言** - 老牌平台，稳定性好

### 3. 国外平台 (能力强，成本高)
- **OpenAI GPT** - 最强通用能力
- **Anthropic Claude** - 安全性和推理能力强

## 📝 密钥格式说明

### 通用格式
```bash
# 多个密钥用逗号分隔
PROVIDER_API_KEYS="key1,key2,key3"
```

### 特殊格式

#### 百度文心一言
```bash
# 格式: client_id:client_secret
BAIDU_API_KEYS="client_id1:secret1,client_id2:secret2"
```

## 🔧 完整配置示例

```bash
# === 免费优先 ===
echo "AIzaSyAXvL...,AIzaSyDj-s..." | wrangler secret put GEMINI_API_KEYS

# === 国内平台 ===
echo "sk-xxx,sk-yyy" | wrangler secret put QWEN_API_KEYS
echo "xxx.yyy,aaa.bbb" | wrangler secret put ZHIPU_API_KEYS
echo "sk-xxx,sk-yyy" | wrangler secret put MOONSHOT_API_KEYS
echo "sk-xxx,sk-yyy" | wrangler secret put DEEPSEEK_API_KEYS
echo "client_id1:secret1,client_id2:secret2" | wrangler secret put BAIDU_API_KEYS

# === 国外平台 ===
echo "sk-xxx,sk-yyy" | wrangler secret put OPENAI_API_KEYS
echo "sk-ant-xxx,sk-ant-yyy" | wrangler secret put ANTHROPIC_API_KEYS
```

## 🎯 智能选择策略

系统会根据内容自动选择最适合的AI平台：

### 图片处理
1. Google Gemini (视觉能力强)
2. OpenAI GPT-4V
3. 阿里通义千问

### 代码相关
1. DeepSeek (代码专家)
2. OpenAI GPT
3. Anthropic Claude
4. 通义千问

### 复杂推理
1. Anthropic Claude
2. OpenAI GPT
3. 智谱AI
4. 通义千问

### 日常对话
1. Google Gemini (免费)
2. 国内平台 (速度快)
3. 国外平台 (备用)

## 🔄 密钥轮换机制

- ✅ **自动切换**: 密钥配额用完时自动切换
- ✅ **错误恢复**: API错误时尝试下一个密钥
- ✅ **状态重置**: 定期重置失败状态
- ✅ **负载均衡**: 智能分配请求到不同密钥

## 🛠️ 管理命令

```bash
# 查看已设置的密钥
wrangler secret list

# 删除密钥
wrangler secret delete PROVIDER_API_KEYS

# 批量管理
node scripts/manage-keys.js
```

## 🔍 故障排除

### 密钥无效
- 检查密钥格式是否正确
- 确认密钥是否过期
- 验证API配额是否充足

### 服务不可用
- 查看 Workers 日志
- 检查网络连接
- 确认平台服务状态

### 性能优化
- 优先配置免费/低成本平台
- 设置多个备用密钥
- 定期检查配额使用情况

## 📊 成本优化建议

1. **免费优先**: Gemini 每天1500次免费
2. **国内平台**: 价格便宜，速度快
3. **按需付费**: 只为实际使用付费
4. **配额监控**: 设置使用限制和告警

## 🔐 安全建议

- 🚫 不要在代码中硬编码密钥
- 🔒 使用 Cloudflare Workers Secrets
- 🔄 定期轮换密钥
- 📊 监控异常使用情况
- 🛡️ 设置合理的使用限制
