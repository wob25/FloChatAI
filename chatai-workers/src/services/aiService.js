/**
 * AI 服务
 * 集成多个AI提供商，处理智能对话，支持密钥轮换
 */

// 全局配额状态（在Workers中持久化）
let globalQuotaStatus = {
  gemini: {
    dailyLimit: 1500,
    used: 0,
    resetTime: null,
    lastError: null,
    name: 'Google Gemini',
    icon: '🔮'
  },
  groq: {
    dailyLimit: 1000,
    used: 0,
    resetTime: null,
    lastError: null,
    name: 'Groq',
    icon: '⚡'
  },
  openai: {
    dailyLimit: null, // 付费服务，无固定限制
    used: 0,
    resetTime: null,
    lastError: null,
    name: 'OpenAI GPT',
    icon: '🚀'
  },
  anthropic: {
    dailyLimit: null,
    used: 0,
    resetTime: null,
    lastError: null,
    name: 'Anthropic Claude',
    icon: '🧠'
  },
  qwen: {
    dailyLimit: 500,
    used: 0,
    resetTime: null,
    lastError: null,
    name: '通义千问',
    icon: '🇨🇳'
  },
  zhipu: {
    dailyLimit: 200,
    used: 0,
    resetTime: null,
    lastError: null,
    name: '智谱AI',
    icon: '🇨🇳'
  },
  deepseek: {
    dailyLimit: 300,
    used: 0,
    resetTime: null,
    lastError: null,
    name: 'DeepSeek',
    icon: '🇨🇳'
  }
}

export class AIService {
  constructor(env) {
    this.env = env

    // 初始化密钥池
    this.initializeKeyPools(env)

    // 使用全局配额状态
    this.quotaStatus = globalQuotaStatus
  }

  // 初始化密钥池
  initializeKeyPools(env) {
    this.keyPools = {
      // 国外AI平台
      openai: {
        keys: this.parseKeys(env.OPENAI_API_KEYS || env.OPENAI_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-2025-04-14',
        failedKeys: new Set()
      },
      anthropic: {
        keys: this.parseKeys(env.ANTHROPIC_API_KEYS || env.ANTHROPIC_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-opus-4.1',
        failedKeys: new Set()
      },
      gemini: {
        keys: this.parseKeys(env.GEMINI_API_KEYS || env.GEMINI_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-2.5-pro',
        failedKeys: new Set()
      },

      // 更多国外AI平台
      cohere: {
        keys: this.parseKeys(env.COHERE_API_KEYS || env.COHERE_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.cohere.ai/v1',
        model: 'command-a',
        failedKeys: new Set()
      },
      mistral: {
        keys: this.parseKeys(env.MISTRAL_API_KEYS || env.MISTRAL_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.mistral.ai/v1',
        model: 'codestral-2501',
        failedKeys: new Set()
      },
      perplexity: {
        keys: this.parseKeys(env.PERPLEXITY_API_KEYS || env.PERPLEXITY_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.perplexity.ai',
        model: 'sonar-pro',
        failedKeys: new Set()
      },
      groq: {
        keys: this.parseKeys(env.GROQ_API_KEYS || env.GROQ_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-4-maverick',
        failedKeys: new Set()
      },
      together: {
        keys: this.parseKeys(env.TOGETHER_API_KEYS || env.TOGETHER_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.together.xyz/v1',
        model: 'meta-llama/llama-4-scout',
        failedKeys: new Set()
      },
      fireworks: {
        keys: this.parseKeys(env.FIREWORKS_API_KEYS || env.FIREWORKS_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/deepseek-v3',
        failedKeys: new Set()
      },
      replicate: {
        keys: this.parseKeys(env.REPLICATE_API_KEYS || env.REPLICATE_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.replicate.com/v1',
        model: 'meta/llama-4-maverick',
        failedKeys: new Set()
      },
      huggingface: {
        keys: this.parseKeys(env.HUGGINGFACE_API_KEYS || env.HUGGINGFACE_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api-inference.huggingface.co/models',
        model: 'Qwen/Qwen3-235B-A22B',
        failedKeys: new Set()
      },

      // 中国国内AI平台
      qwen: {
        keys: this.parseKeys(env.QWEN_API_KEYS || env.QWEN_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        model: 'qwen-max-2025-01-25',
        failedKeys: new Set()
      },
      baidu: {
        keys: this.parseKeys(env.BAIDU_API_KEYS || env.BAIDU_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
        model: 'ernie-4.0-turbo-8k',
        failedKeys: new Set()
      },
      zhipu: {
        keys: this.parseKeys(env.ZHIPU_API_KEYS || env.ZHIPU_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4.5-air',
        failedKeys: new Set()
      },
      moonshot: {
        keys: this.parseKeys(env.MOONSHOT_API_KEYS || env.MOONSHOT_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'kimi-k2-preview',
        failedKeys: new Set()
      },
      deepseek: {
        keys: this.parseKeys(env.DEEPSEEK_API_KEYS || env.DEEPSEEK_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-v3',
        failedKeys: new Set()
      },
      minimax: {
        keys: this.parseKeys(env.MINIMAX_API_KEYS || env.MINIMAX_API_KEY),
        currentIndex: 0,
        baseUrl: 'https://api.minimax.chat/v1',
        model: 'MiniMax-Text-01',
        failedKeys: new Set()
      }
    }
  }

  // 解析密钥字符串，支持多种格式
  parseKeys(keyString) {
    if (!keyString) return []

    // 支持多种分隔符：逗号、分号、换行符
    const keys = keyString
      .split(/[,;\n]/)
      .map(key => key.trim())
      .filter(key => key.length > 0)

    console.log(`Parsed ${keys.length} keys from: ${keyString.substring(0, 20)}...`)
    return keys
  }

  // 获取下一个可用的API密钥
  getNextApiKey(providerName) {
    const pool = this.keyPools[providerName]
    if (!pool || !pool.keys || pool.keys.length === 0) {
      throw new Error(`No API keys configured for provider: ${providerName}`)
    }

    // 如果所有密钥都失败了，重置失败状态
    if (pool.failedKeys.size >= pool.keys.length) {
      console.log(`All keys failed for ${providerName}, resetting failed keys`)
      pool.failedKeys.clear()
      pool.currentIndex = 0
    }

    // 寻找下一个可用的密钥
    let attempts = 0
    while (attempts < pool.keys.length) {
      const currentKey = pool.keys[pool.currentIndex]

      if (!pool.failedKeys.has(currentKey)) {
        console.log(`Using key ${pool.currentIndex + 1}/${pool.keys.length} for ${providerName}`)
        return {
          key: currentKey,
          index: pool.currentIndex,
          baseUrl: pool.baseUrl,
          model: pool.model
        }
      }

      // 移动到下一个密钥
      pool.currentIndex = (pool.currentIndex + 1) % pool.keys.length
      attempts++
    }

    throw new Error(`No available API keys for provider: ${providerName}`)
  }

  // 标记密钥为失败状态
  markKeyAsFailed(providerName, keyIndex, error) {
    const pool = this.keyPools[providerName]
    if (!pool || !pool.keys[keyIndex]) return

    const failedKey = pool.keys[keyIndex]
    pool.failedKeys.add(failedKey)

    console.log(`Marked key ${keyIndex + 1}/${pool.keys.length} as failed for ${providerName}: ${error}`)

    // 移动到下一个密钥
    pool.currentIndex = (keyIndex + 1) % pool.keys.length
  }

  // 重置密钥状态（用于定期清理）
  resetKeyStatus(providerName) {
    const pool = this.keyPools[providerName]
    if (pool) {
      pool.failedKeys.clear()
      pool.currentIndex = 0
      console.log(`Reset key status for ${providerName}`)
    }
  }

  // 通用配额管理方法
  async updateQuotaStatus(providerName, success, errorType = null, env = null) {
    // 确保配额对象存在，并保持原有的dailyLimit设置
    if (!this.quotaStatus[providerName]) {
      // 从全局配额状态获取默认配置
      const defaultQuota = globalQuotaStatus[providerName]
      this.quotaStatus[providerName] = {
        dailyLimit: defaultQuota ? defaultQuota.dailyLimit : null,
        used: 0,
        resetTime: null,
        lastError: null,
        name: defaultQuota ? defaultQuota.name : providerName,
        icon: defaultQuota ? defaultQuota.icon : '🤖'
      }
    }

    const quota = this.quotaStatus[providerName]
    const now = new Date()
    const today = now.toDateString()

    // 检查是否需要重置（只在真正是新的一天时重置）
    if (!quota.resetTime) {
      // 第一次初始化，设置重置时间为明天
      quota.resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    } else if (new Date(quota.resetTime).toDateString() !== today && new Date(quota.resetTime) <= now) {
      // 真正是新的一天，重置配额
      quota.used = 0
      quota.resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      quota.lastError = null
      console.log(`Reset quota for ${providerName} - new day`)
    }

    // 确保dailyLimit不会被重置，从全局状态恢复（但不重置used）
    const defaultQuota = globalQuotaStatus[providerName]
    if (defaultQuota && quota.dailyLimit !== defaultQuota.dailyLimit) {
      quota.dailyLimit = defaultQuota.dailyLimit
      quota.name = defaultQuota.name
      quota.icon = defaultQuota.icon
    }

    if (success) {
      quota.used += 1
      quota.lastError = null
    } else {
      quota.lastError = errorType
    }

    console.log(`Updated quota for ${providerName}:`, quota)

    // 持久化到KV存储
    if (env && env.CHAT_STORAGE) {
      try {
        const quotaKey = `quota:${providerName}:${today}`
        await env.CHAT_STORAGE.put(quotaKey, JSON.stringify(quota))
        console.log(`Persisted quota for ${providerName} to KV storage`)
      } catch (error) {
        console.error(`Failed to persist quota for ${providerName}:`, error)
      }
    }
  }

  // 从KV存储加载配额状态
  async loadQuotaFromKV(providerName, env) {
    if (!env || !env.CHAT_STORAGE) return null

    try {
      const today = new Date().toDateString()
      const quotaKey = `quota:${providerName}:${today}`
      const quotaData = await env.CHAT_STORAGE.get(quotaKey)

      if (quotaData) {
        const quota = JSON.parse(quotaData)
        console.log(`Loaded quota for ${providerName} from KV:`, quota)
        return quota
      }
    } catch (error) {
      console.error(`Failed to load quota for ${providerName} from KV:`, error)
    }

    return null
  }

  // 获取真实的API配额信息
  async getRealQuotaFromAPI(providerName) {
    try {
      const provider = this.keyPools[providerName]
      if (!provider || !provider.keys || provider.keys.length === 0) {
        return null
      }

      const apiKey = provider.keys[provider.currentIndex]
      if (!apiKey) return null

      switch (providerName) {
        case 'gemini':
          return await this.getGeminiRealQuota(apiKey)
        case 'openai':
          return await this.getOpenAIRealQuota(apiKey)
        case 'anthropic':
          return await this.getAnthropicRealQuota(apiKey)
        case 'qwen':
          return await this.getQwenRealQuota(apiKey)
        case 'zhipu':
          return await this.getZhipuRealQuota(apiKey)
        case 'deepseek':
          return await this.getDeepSeekRealQuota(apiKey)
        case 'moonshot':
          return await this.getMoonshotRealQuota(apiKey)
        case 'groq':
          return await this.getGroqRealQuota(apiKey)
        default:
          return null
      }
    } catch (error) {
      console.error(`Failed to get real quota for ${providerName}:`, error)
      return null
    }
  }

  // Gemini真实配额查询
  async getGeminiRealQuota(apiKey) {
    try {
      // Gemini没有直接的配额查询API，通过测试请求判断
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: 'GET' }
      )

      if (response.ok) {
        return {
          dailyLimit: 1500, // Gemini免费版每日限制
          available: true,
          source: 'api_test'
        }
      } else if (response.status === 429) {
        return {
          dailyLimit: 1500,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // OpenAI真实配额查询
  async getOpenAIRealQuota(apiKey) {
    try {
      // OpenAI配额查询API
      const response = await fetch(
        'https://api.openai.com/v1/usage',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        return {
          dailyLimit: null, // 付费服务，无固定限制
          available: true,
          source: 'api_real',
          usage: data
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Anthropic真实配额查询
  async getAnthropicRealQuota(apiKey) {
    try {
      // Anthropic没有公开的配额查询API，通过测试请求判断
      const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: null,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: null, // 付费服务
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // 通义千问真实配额查询
  async getQwenRealQuota(apiKey) {
    try {
      // 通义千问没有直接的配额查询API，通过测试请求判断
      const response = await fetch(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen-turbo',
            input: { messages: [{ role: 'user', content: 'test' }] },
            parameters: { max_tokens: 1 }
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: 500,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: 500, // 免费版限制
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // 智谱AI真实配额查询
  async getZhipuRealQuota(apiKey) {
    try {
      // 智谱AI没有直接的配额查询API，通过测试请求判断
      const response = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'glm-4',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: 200,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: 200, // 免费版限制
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // DeepSeek真实配额查询
  async getDeepSeekRealQuota(apiKey) {
    try {
      const response = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: 300,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: 300, // 免费版限制
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Moonshot真实配额查询
  async getMoonshotRealQuota(apiKey) {
    try {
      const response = await fetch(
        'https://api.moonshot.cn/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: null, // 付费服务
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: null, // 付费服务
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Groq真实配额查询
  async getGroqRealQuota(apiKey) {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        }
      )

      if (response.status === 429) {
        return {
          dailyLimit: 1000,
          available: false,
          source: 'api_test',
          error: 'quota_exceeded'
        }
      } else if (response.ok || response.status === 400) {
        return {
          dailyLimit: 1000, // 免费版限制
          available: true,
          source: 'api_test'
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // 检查配额状态（增强版，支持真实API查询）
  async checkQuotaStatus(providerName, env = null) {
    // 确保配额对象存在，并从全局状态获取默认配置
    if (!this.quotaStatus[providerName]) {
      const defaultQuota = globalQuotaStatus[providerName]
      this.quotaStatus[providerName] = {
        dailyLimit: defaultQuota ? defaultQuota.dailyLimit : null,
        used: 0,
        resetTime: null,
        lastError: null,
        name: defaultQuota ? defaultQuota.name : providerName,
        icon: defaultQuota ? defaultQuota.icon : '🤖'
      }
    }

    // 尝试从KV存储加载最新状态
    if (env) {
      const kvQuota = await this.loadQuotaFromKV(providerName, env)
      if (kvQuota) {
        // 合并KV数据，但保持全局配置的dailyLimit、name、icon
        const defaultQuota = globalQuotaStatus[providerName]
        this.quotaStatus[providerName] = {
          ...kvQuota,
          dailyLimit: defaultQuota ? defaultQuota.dailyLimit : kvQuota.dailyLimit,
          name: defaultQuota ? defaultQuota.name : kvQuota.name,
          icon: defaultQuota ? defaultQuota.icon : kvQuota.icon
        }
      }
    }

    // 尝试获取真实的API配额信息
    const realQuota = await this.getRealQuotaFromAPI(providerName, env)
    if (realQuota) {
      console.log(`Got real quota for ${providerName}:`, realQuota)
      // 更新配额信息
      if (realQuota.dailyLimit !== undefined) {
        this.quotaStatus[providerName].dailyLimit = realQuota.dailyLimit
      }
      if (realQuota.error) {
        this.quotaStatus[providerName].lastError = realQuota.error
      }
      this.quotaStatus[providerName].realQuotaChecked = true
      this.quotaStatus[providerName].realQuotaTime = new Date().toISOString()
    }

    const quota = this.quotaStatus[providerName]
    if (!quota) return { canUse: true, used: 0, dailyLimit: null }

    const now = new Date()
    const today = now.toDateString()

    // 检查是否需要重置（只在真正是新的一天时重置）
    if (!quota.resetTime) {
      // 第一次初始化，设置重置时间为明天
      quota.resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    } else if (new Date(quota.resetTime).toDateString() !== today && new Date(quota.resetTime) <= now) {
      // 真正是新的一天，重置配额
      quota.used = 0
      quota.resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      quota.lastError = null
      console.log(`Reset quota for ${providerName} - new day`)
    }

    // 确保dailyLimit等配置正确（但不重置used）
    const defaultQuota = globalQuotaStatus[providerName]
    if (defaultQuota) {
      quota.name = defaultQuota.name
      quota.icon = defaultQuota.icon
      // 只有在没有真实配额数据时才使用默认值
      if (!quota.realQuotaChecked) {
        quota.dailyLimit = defaultQuota.dailyLimit
      }
    }

    const canUse = !quota.dailyLimit || quota.used < quota.dailyLimit
    return {
      canUse,
      used: quota.used,
      dailyLimit: quota.dailyLimit,
      resetTime: quota.resetTime,
      lastError: quota.lastError,
      name: quota.name,
      icon: quota.icon,
      realQuotaChecked: quota.realQuotaChecked || false,
      realQuotaTime: quota.realQuotaTime || null
    }
  }

  // 获取所有平台的配额状态
  async getAllQuotaStatus(env = null) {
    const allStatus = {}

    // 获取已配置的平台
    const configuredProviders = this.getAvailableProviders()

    for (const providerName of configuredProviders) {
      allStatus[providerName] = await this.checkQuotaStatus(providerName, env)
    }

    return allStatus
  }

  // 获取所有平台信息（包括可用性状态）
  getAllProviderInfo() {
    const availableProviders = this.getAvailableProviders()
    const allProviders = {}

    // 定义所有支持的平台信息
    const providerInfo = {
      // 国外平台
      gemini: {
        name: 'Google Gemini',
        icon: '🔮',
        description: '视觉能力强，多模态支持',
        category: 'international',
        free: false
      },
      groq: {
        name: 'Groq',
        icon: '⚡',
        description: '超快推理速度',
        category: 'international',
        free: false
      },

      // 国内平台
      qwen: {
        name: '通义千问',
        icon: '🇨🇳',
        description: '阿里云，中文能力强',
        category: 'domestic',
        free: false
      },
      zhipu: {
        name: '智谱AI',
        icon: '🇨🇳',
        description: 'GLM-4模型，推理能力好',
        category: 'domestic',
        free: false
      },
      deepseek: {
        name: 'DeepSeek',
        icon: '🇨🇳',
        description: '代码能力突出',
        category: 'domestic',
        free: false
      },
      moonshot: {
        name: '月之暗面',
        icon: '🇨🇳',
        description: 'Kimi模型，长文本处理',
        category: 'domestic',
        free: false
      },
      baidu: {
        name: '文心一言',
        icon: '🇨🇳',
        description: '百度AI，稳定可靠',
        category: 'domestic',
        free: false
      },
      minimax: {
        name: 'MiniMax',
        icon: '🇨🇳',
        description: '多模态能力',
        category: 'domestic',
        free: false
      },

      // 国外平台
      openai: {
        name: 'OpenAI GPT',
        icon: '🚀',
        description: '最强通用能力',
        category: 'international',
        free: false
      },
      anthropic: {
        name: 'Anthropic Claude',
        icon: '🧠',
        description: '安全性和推理能力强',
        category: 'international',
        free: false
      },
      mistral: {
        name: 'Mistral AI',
        icon: '🇫🇷',
        description: '欧洲AI，开源友好',
        category: 'international',
        free: false
      },
      cohere: {
        name: 'Cohere',
        icon: '🔗',
        description: '企业级AI解决方案',
        category: 'international',
        free: false
      },
      perplexity: {
        name: 'Perplexity',
        icon: '🔍',
        description: '搜索增强的AI',
        category: 'international',
        free: false
      },
      together: {
        name: 'Together AI',
        icon: '🤝',
        description: '开源模型托管',
        category: 'international',
        free: false
      },
      fireworks: {
        name: 'Fireworks AI',
        icon: '🎆',
        description: '高性能推理',
        category: 'international',
        free: false
      },
      replicate: {
        name: 'Replicate',
        icon: '🔄',
        description: '模型复制平台',
        category: 'international',
        free: false
      },
      huggingface: {
        name: 'Hugging Face',
        icon: '🤗',
        description: '开源AI社区',
        category: 'international',
        free: false
      }
    }

    // 为每个平台添加可用性状态
    for (const [key, info] of Object.entries(providerInfo)) {
      const hasApiKey = this.keyPools[key] && this.keyPools[key].keys && this.keyPools[key].keys.length > 0

      allProviders[key] = {
        ...info,
        available: hasApiKey, // 所有平台都需要API密钥
        hasApiKey: hasApiKey,
        isFree: false, // 没有免费平台
        reason: hasApiKey ? 'configured' : 'no_api_key'
      }
    }

    return allProviders
  }



  async generateResponse({ message, files = [], urls = [], chatHistory = [], preferredProvider = 'gemini', env }) {
    let selectedProvider = null

    try {
      // 构建上下文
      const context = await this.buildContext({ message, files, urls, chatHistory, env })

      // 选择最佳的AI提供商
      const provider = this.selectProvider(preferredProvider)
      selectedProvider = provider.name

      // 生成回复
      const response = await this.callAI(provider, context, env)

      // 更新配额状态（成功）
      await this.updateQuotaStatus(provider.name, true, null, env)

      return {
        content: response.content,
        metadata: {
          provider: provider.name,
          model: provider.model,
          tokensUsed: response.tokensUsed,
          processingTime: response.processingTime,
          confidence: response.confidence,
          quotaStatus: await this.checkQuotaStatus(provider.name, env)
        }
      }

    } catch (error) {
      console.error('AI service error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        preferredProvider,
        selectedProvider
      })

      // 提供更详细的错误信息用于调试
      let userMessage = '抱歉，我现在无法处理您的请求。请稍后再试。'

      // 检查是否是API密钥问题
      if (error.message.includes('No API keys configured')) {
        userMessage = `❌ ${selectedProvider || preferredProvider} 平台未配置API密钥。请联系管理员配置相关密钥。`
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        userMessage = `🔑 ${selectedProvider || preferredProvider} 平台API密钥无效。请检查密钥配置。`
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        userMessage = `📊 ${selectedProvider || preferredProvider} 平台配额已用完。请稍后再试或切换其他平台。`
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        userMessage = `🚫 ${selectedProvider || preferredProvider} 平台访问被拒绝。请检查API权限。`
      }

      return {
        content: userMessage,
        metadata: {
          error: true,
          errorMessage: error.message,
          preferredProvider,
          provider: selectedProvider || 'unknown',
          selectedProvider: selectedProvider || 'unknown'
        }
      }
    }
  }

  async buildContext({ message, files, urls, chatHistory, env }) {
    const context = {
      userMessage: message,
      conversationHistory: chatHistory.slice(-10), // 保留最近10条消息
      attachments: [],
      urlContent: []
    }

    // 处理文件内容
    if (files.length > 0) {
      for (const file of files) {
        try {
          const processedFile = await this.processFile(file, env)
          context.attachments.push({
            type: file.type,
            name: file.name,
            content: processedFile.content,
            size: file.size,
            contentType: processedFile.type,
            imageData: processedFile.imageData // 保存图片数据用于API调用
          })
        } catch (error) {
          console.error('File processing error:', error)
        }
      }
    }

    // 处理URL内容
    if (urls.length > 0) {
      for (const url of urls) {
        try {
          // 处理URL字符串或URL对象
          const urlString = typeof url === 'string' ? url : url.url
          console.log('Processing URL:', urlString)

          const content = await this.fetchUrlContent(urlString)
          context.urlContent.push({
            url: urlString,
            title: content.title,
            description: content.description,
            content: content.text
          })
        } catch (error) {
          console.error('URL processing error:', error)
        }
      }
    }

    return context
  }

  selectProvider(preferredProvider = 'gemini') {
    // 用户必须指定提供商，不再支持自动选择
    const availableProviders = this.getAvailableProviders()
    if (availableProviders.includes(preferredProvider)) {
      console.log(`Using user-selected provider: ${preferredProvider}`)
      return this.createProviderConfig(preferredProvider)
    } else {
      // 如果指定的提供商不可用，抛出错误
      throw new Error(`Selected AI platform "${preferredProvider}" is not available. Please check API key configuration or select a different platform.`)
    }


  }

  // 获取可用的提供商列表
  getAvailableProviders() {
    const providers = []

    // 按优先级排序：Gemini优先
    const priorityOrder = [
      // Google Gemini 优先 (主要平台)
      'gemini',      // Google Gemini

      // 国内平台备选 (速度快，成本低)
      'qwen',        // 阿里通义千问
      'zhipu',       // 智谱AI
      'deepseek',    // DeepSeek
      'moonshot',    // 月之暗面
      'baidu',       // 百度文心一言
      'minimax',     // MiniMax

      // 国外平台
      'gemini',      // Google Gemini
      'anthropic',   // Claude
      'openai',      // OpenAI GPT
      'groq',        // Groq
      'mistral',     // Mistral AI
      'cohere',      // Cohere
      'perplexity',  // Perplexity
      'together',    // Together AI
      'fireworks',   // Fireworks AI
      'replicate',   // Replicate
      'huggingface'  // Hugging Face
    ]

    for (const providerName of priorityOrder) {
      const pool = this.keyPools[providerName]

      // 所有平台都需要有API密钥
      if (pool && pool.keys && pool.keys.length > 0) {
        // 检查是否还有可用的密钥
        if (pool.failedKeys.size < pool.keys.length) {
          providers.push(providerName)
        }
      }
    }

    return providers
  }

  // 创建提供商配置
  createProviderConfig(providerName) {
    try {
      const keyInfo = this.getNextApiKey(providerName)
      return {
        name: providerName,
        apiKey: keyInfo.key,
        keyIndex: keyInfo.index,
        baseUrl: keyInfo.baseUrl,
        model: keyInfo.model
      }
    } catch (error) {
      console.error(`Failed to create provider config for ${providerName}:`, error)
      throw error
    }
  }

  async callAI(provider, context, env) {
    const startTime = Date.now()
    let lastError = null

    // 尝试调用AI，如果失败则轮换密钥重试
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        switch (provider.name) {
          // 国外主流平台
          case 'openai':
            return await this.callOpenAI(provider, context, startTime)
          case 'anthropic':
            return await this.callAnthropic(provider, context, startTime)
          case 'gemini':
            return await this.callGemini(provider, context, startTime, env)
          case 'cohere':
            return await this.callCohere(provider, context, startTime)
          case 'mistral':
            return await this.callMistral(provider, context, startTime)
          case 'perplexity':
            return await this.callPerplexity(provider, context, startTime)
          case 'groq':
            return await this.callGroq(provider, context, startTime)
          case 'together':
            return await this.callTogether(provider, context, startTime)
          case 'fireworks':
            return await this.callFireworks(provider, context, startTime)
          case 'replicate':
            return await this.callReplicate(provider, context, startTime)
          case 'huggingface':
            return await this.callHuggingFace(provider, context, startTime)

          // 国内平台
          case 'qwen':
            return await this.callQwen(provider, context, startTime)
          case 'baidu':
            return await this.callBaidu(provider, context, startTime)
          case 'zhipu':
            return await this.callZhipu(provider, context, startTime)
          case 'moonshot':
            return await this.callMoonshot(provider, context, startTime)
          case 'deepseek':
            return await this.callDeepseek(provider, context, startTime)
          case 'minimax':
            return await this.callMinimax(provider, context, startTime)
          default:
            throw new Error(`Unsupported AI provider: ${provider.name}`)
        }
      } catch (error) {
        lastError = error
        console.error(`Attempt ${attempt + 1} failed for ${provider.name}:`, error.message)

        // 更新配额状态（失败）
        await this.updateQuotaStatus(provider.name, false, error.message, env)

        // 如果是密钥相关的错误，标记当前密钥为失败并尝试下一个
        if (this.isKeyRelatedError(error)) {
          this.markKeyAsFailed(provider.name, provider.keyIndex, error.message)

          // 尝试获取下一个密钥
          try {
            const newKeyInfo = this.getNextApiKey(provider.name)
            provider.apiKey = newKeyInfo.key
            provider.keyIndex = newKeyInfo.index
            console.log(`Switched to next key for ${provider.name}`)
          } catch (keyError) {
            console.error(`No more keys available for ${provider.name}:`, keyError.message)
            break // 没有更多密钥可用，退出重试循环
          }
        } else {
          // 非密钥相关错误，不重试
          break
        }
      }
    }

    // 所有重试都失败了
    throw lastError || new Error(`Failed to call ${provider.name} after ${maxRetries} attempts`)
  }

  // 判断是否为密钥相关的错误
  isKeyRelatedError(error) {
    const keyErrorPatterns = [
      'invalid api key',
      'unauthorized',
      'authentication failed',
      'quota exceeded',
      'rate limit',
      'insufficient quota',
      'api key not found',
      '401',
      '403',
      '429'
    ]

    const errorMessage = error.message.toLowerCase()
    return keyErrorPatterns.some(pattern => errorMessage.includes(pattern))
  }

  async callOpenAI(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        max_tokens: 100000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  async callAnthropic(provider, context, startTime) {
    // 构建包含对话历史的消息数组
    const messages = []

    // 添加对话历史
    context.conversationHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: this.formatContextForAnthropic(context)
    })

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 100000,
        system: this.getSystemPrompt(), // Anthropic使用system参数
        messages: messages
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.content[0].text,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      processingTime,
      confidence: 0.95
    }
  }

  // 通义千问 API 调用
  async callQwen(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForQwen(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      input: {
        messages: messages
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 100000,
        top_p: 0.9
      }
    }

    const response = await fetch(`${provider.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Qwen API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    if (data.output && data.output.text) {
      return {
        content: data.output.text,
        tokensUsed: data.usage?.total_tokens || 0,
        processingTime,
        confidence: 0.9
      }
    } else {
      throw new Error('Invalid response from Qwen API')
    }
  }

  // 智谱AI API 调用
  async callZhipu(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context) // 使用OpenAI格式
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000,
      top_p: 0.9
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Zhipu API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // 月之暗面 API 调用
  async callMoonshot(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Moonshot API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // DeepSeek API 调用
  async callDeepseek(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // 百度文心一言 API 调用
  async callBaidu(provider, context, startTime) {
    // 百度API需要先获取access_token
    const accessToken = await this.getBaiduAccessToken(provider.apiKey)

    // 构建包含对话历史的消息数组
    const messages = []

    // 添加对话历史
    context.conversationHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // 添加系统提示和当前用户消息
    messages.push({
      role: 'user',
      content: `${this.getSystemPrompt()}\n\n${this.formatContextForOpenAI(context)}`
    })

    const requestBody = {
      messages: messages,
      temperature: 0.7,
      top_p: 0.9,
      penalty_score: 1.0
    }

    const response = await fetch(`${provider.baseUrl}/${provider.model}?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Baidu API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.result,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // MiniMax API 调用
  async callMinimax(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // 获取百度Access Token
  async getBaiduAccessToken(apiKey) {
    // 假设apiKey格式为 "client_id:client_secret"
    const [clientId, clientSecret] = apiKey.split(':')

    const response = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    })

    const data = await response.json()
    return data.access_token
  }

  // 通义千问格式化上下文
  formatContextForQwen(context) {
    let content = context.userMessage

    // 添加附件内容
    if (context.attachments && context.attachments.length > 0) {
      content += '\n\n附件内容:\n'
      context.attachments.forEach((att, index) => {
        content += `${index + 1}. ${att.name} (${att.type}):\n${att.content}\n\n`
      })
    }

    // 添加URL内容
    if (context.urlContent && context.urlContent.length > 0) {
      content += '\n\n网页内容:\n'
      context.urlContent.forEach((url, index) => {
        content += `${index + 1}. ${url.title} (${url.url}):\n${url.content}\n\n`
      })
    }

    return content
  }

  async callGemini(provider, context, startTime, env) {
    // 检查配额
    const quotaStatus = await this.checkQuotaStatus('gemini', env)
    if (!quotaStatus.canUse) {
      const error = `Gemini API 每日配额已用完 (${quotaStatus.used}/${quotaStatus.dailyLimit})。配额将在明天重置。`
      console.log(error)
      throw new Error(error)
    }

    // 检查是否有图片附件
    const imageAttachments = context.attachments.filter(att => att.contentType === 'image')
    const parts = []

    // 构建包含对话历史的文本内容
    let textContent = this.getSystemPrompt() + '\n\n'

    // 添加对话历史
    if (context.conversationHistory.length > 0) {
      textContent += '对话历史:\n'
      context.conversationHistory.forEach(msg => {
        const role = msg.type === 'user' ? '用户' : '助手'
        textContent += `${role}: ${msg.content}\n`
      })
      textContent += '\n'
    }

    // 添加当前用户消息
    textContent += `当前用户消息: ${this.formatContextForGemini(context)}`

    parts.push({
      text: textContent
    })

    // 添加图片内容
    if (imageAttachments.length > 0) {
      for (const attachment of imageAttachments) {
        try {
          // 从R2存储读取图片数据
          const imageData = await env.FILE_STORAGE.get(attachment.imageData.storagePath)
          if (imageData) {
            const arrayBuffer = await imageData.arrayBuffer()

            // 验证图片数据
            const uint8Array = new Uint8Array(arrayBuffer)
            console.log(`Image data size: ${uint8Array.length} bytes`)
            console.log(`Image data signature: ${Array.from(uint8Array.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`)

            // 转换为base64 - 使用正确的方法
            const base64Data = btoa(String.fromCharCode.apply(null, uint8Array))

            // 确保MIME类型正确
            let mimeType = attachment.type
            if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
              // RIFF header - 可能是WebP
              if (uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
                mimeType = 'image/webp'
                console.log('Detected WebP format from binary signature')
              }
            }

            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            })
            console.log(`Added image to Gemini request: ${attachment.name} (${mimeType}, ${base64Data.length} base64 chars)`)
          }
        } catch (error) {
          console.error('Failed to load image for Gemini:', error)
        }
      }
    }

    const response = await fetch(
      `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100000
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      // 更新配额状态（记录错误）
      let errorMessage = `Gemini API error: ${response.status} - ${errorText}`

      // 特殊处理配额用完的错误
      if (response.status === 429) {
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error && errorData.error.message.includes('quota')) {
            await this.updateQuotaStatus('gemini', false, 'quota_exceeded', env)
            const quota = await this.checkQuotaStatus('gemini', env)
            errorMessage = `🚫 Gemini API 配额已用完！\n\n📊 当前状态：${quota.used}/${quota.dailyLimit} 请求已使用\n⏰ 配额将在明天重置\n\n💡 建议：请明天再试，或考虑升级到付费版本以获得更多配额。`
          }
        } catch (e) {
          // 解析错误，使用默认消息
        }
      } else {
        await this.updateQuotaStatus('gemini', false, `api_error_${response.status}`, env)
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    console.log('Gemini API response:', JSON.stringify(data, null, 2))

    // 检查响应格式
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response format:', data)
      await this.updateQuotaStatus('gemini', false, 'invalid_response', env)
      throw new Error('Invalid response format from Gemini API')
    }

    // 成功调用，更新配额
    await this.updateQuotaStatus('gemini', true, null, env)

    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      processingTime,
      confidence: 0.85,
      quotaStatus: await this.checkQuotaStatus('gemini', env) // 返回配额状态
    }
  }

  getSystemPrompt() {
    // 获取当前北京时间
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // UTC+8

    // 手动格式化日期和时间，避免本地化问题
    const year = beijingTime.getFullYear()
    const month = beijingTime.getMonth() + 1
    const day = beijingTime.getDate()
    const hour = beijingTime.getHours().toString().padStart(2, '0')
    const minute = beijingTime.getMinutes().toString().padStart(2, '0')

    // 获取星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[beijingTime.getDay()]

    const currentDate = `${year}年${month}月${day}日 ${weekday}`
    const currentTime = `${hour}:${minute}`

    return `你是 𝒞𝒽𝒶𝓉𝒜𝐼，一个智能助手。

当前时间信息：
- 今天是：${currentDate}
- 北京时间：${currentTime}

你的特点：
1. 友好、专业、有帮助
2. 能够处理文本、图片、代码等多种内容
3. 可以分析网站链接内容 - 当用户提供网站链接时，我会自动获取并分析网站内容
4. 联系上下文进行对话
5. 回答条理清晰明了，重点突出
6. 支持中英文对话
7. 当收到网站内容时，会基于实际获取的内容进行分析和回答
8. 当用户询问时间、日期相关问题时，请使用上面提供的准确时间信息
9. 回复用户时添加一些匹配的表情符号增加趣味性

请根据用户的问题和提供的内容（包括网站内容、图片、文件等）提供准确、有用的回答。`
  }

  formatContextForOpenAI(context) {
    let content = context.userMessage

    if (context.attachments.length > 0) {
      content += '\n\n附件内容：\n'
      context.attachments.forEach(att => {
        content += `- ${att.name} (${att.type}): ${att.content.substring(0, 1000)}\n`
      })
    }

    if (context.urlContent.length > 0) {
      content += '\n\n网站内容：\n'
      context.urlContent.forEach(url => {
        content += `- ${url.title}: ${url.description}\n${url.content.substring(0, 1000)}\n`
      })
    }

    return content
  }

  formatContextForAnthropic(context) {
    return this.formatContextForOpenAI(context) // 使用相同格式
  }

  formatContextForGemini(context) {
    let content = context.userMessage

    // 添加URL内容
    if (context.urlContent.length > 0) {
      content += '\n\n网站内容分析：\n'
      context.urlContent.forEach(url => {
        content += `\n网站: ${url.url}\n`
        content += `标题: ${url.title}\n`
        if (url.description) {
          content += `描述: ${url.description}\n`
        }
        if (url.text) {
          content += `内容摘要: ${url.text.substring(0, 1500)}\n`
        }
        content += '---\n'
      })
    }

    // 添加文件内容
    if (context.attachments.length > 0) {
      content += '\n\n附件内容：\n'
      context.attachments.forEach(att => {
        content += `- ${att.name} (${att.type}): ${att.content.substring(0, 1000)}\n`
      })
    }

    return content
  }

  async processFile(file, env = null) {
    // 根据文件类型处理内容
    if (file.type.startsWith('text/')) {
      return {
        type: 'text',
        content: file.content || '文本文件内容'
      }
    } else if (file.type.startsWith('image/')) {
      // 图片文件 - 返回图片信息，实际处理在API调用时进行
      return {
        type: 'image',
        content: `图片文件: ${file.name} (${file.type}, ${file.size} bytes)`,
        imageData: file // 保留原始文件信息用于后续处理
      }
    } else if (file.type.includes('json')) {
      return {
        type: 'text',
        content: JSON.stringify(JSON.parse(file.content), null, 2)
      }
    } else {
      return {
        type: 'text',
        content: `文件类型: ${file.type}, 大小: ${file.size} bytes`
      }
    }
  }

  async fetchUrlContent(url) {
    try {
      console.log('Fetching URL content:', url)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatAI/1.0; +https://github.com/your-username/FloChatAI)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        cf: {
          timeout: 10000 // 10秒超时
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log('Fetched HTML length:', html.length)

      // 改进的HTML解析
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)

      // 提取主要文本内容
      let textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000)

      const result = {
        title: titleMatch ? titleMatch[1].trim() : url,
        description: descMatch ? descMatch[1].trim() : '',
        text: textContent
      }

      console.log('Parsed URL content:', {
        url,
        title: result.title,
        descriptionLength: result.description.length,
        textLength: result.text.length
      })

      return result

    } catch (error) {
      console.error('URL fetch error:', error)
      return {
        title: url,
        description: `无法获取网站内容: ${error.message}`,
        text: ''
      }
    }
  }

  // === 新增国外AI平台API调用方法 ===

  // Cohere API 调用
  async callCohere(provider, context, startTime) {
    // 构建包含对话历史的消息
    let message = this.getSystemPrompt() + '\n\n'

    // 添加对话历史
    if (context.conversationHistory.length > 0) {
      message += '对话历史:\n'
      context.conversationHistory.forEach(msg => {
        const role = msg.type === 'user' ? '用户' : '助手'
        message += `${role}: ${msg.content}\n`
      })
      message += '\n'
    }

    // 添加当前用户消息
    message += `当前用户消息: ${this.formatContextForOpenAI(context)}`

    const requestBody = {
      model: provider.model,
      message: message,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cohere API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.text,
      tokensUsed: data.meta?.tokens?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Mistral AI API 调用
  async callMistral(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Groq API 调用 (兼容OpenAI格式)
  async callGroq(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Perplexity API 调用
  async callPerplexity(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Together AI API 调用
  async callTogether(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Together API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Fireworks AI API 调用
  async callFireworks(provider, context, startTime) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      // 添加对话历史
      ...context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: this.formatContextForOpenAI(context)
      }
    ]

    const requestBody = {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 100000
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fireworks API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      processingTime,
      confidence: 0.9
    }
  }

  // Replicate API 调用
  async callReplicate(provider, context, startTime) {
    const requestBody = {
      version: provider.model,
      input: {
        prompt: `${this.getSystemPrompt()}\n\n${this.formatContextForOpenAI(context)}`,
        temperature: 0.7,
        max_tokens: 100000
      }
    }

    const response = await fetch(`${provider.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    // Replicate 是异步的，这里简化处理
    return {
      content: data.output || 'Processing...',
      tokensUsed: 0,
      processingTime,
      confidence: 0.8
    }
  }

  // Hugging Face API 调用
  async callHuggingFace(provider, context, startTime) {
    const requestBody = {
      inputs: `${this.getSystemPrompt()}\n\n${this.formatContextForOpenAI(context)}`,
      parameters: {
        temperature: 0.7,
        max_length: 2000
      }
    }

    const response = await fetch(`${provider.baseUrl}/${provider.model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data[0]?.generated_text || data.generated_text || 'No response',
      tokensUsed: 0,
      processingTime,
      confidence: 0.8
    }
  }
}
