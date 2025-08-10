/**
 * AI平台配额状态显示组件
 */

import { useState, useEffect } from 'react'

// 平台显示信息
const PROVIDER_INFO = {
  auto: { name: '智能选择', icon: '🤖', description: '自动选择最佳平台' },
  gemini: { name: 'Google Gemini', icon: '🔮', description: '免费额度大' },
  groq: { name: 'Groq', icon: '⚡', description: '超快推理速度' },
  qwen: { name: '通义千问', icon: '🇨🇳', description: '中文能力强' },
  zhipu: { name: '智谱AI', icon: '🇨🇳', description: '推理能力好' },
  deepseek: { name: 'DeepSeek', icon: '🇨🇳', description: '代码能力强' },
  moonshot: { name: '月之暗面', icon: '🇨🇳', description: '长文本处理' },
  baidu: { name: '文心一言', icon: '🇨🇳', description: '稳定可靠' },
  minimax: { name: 'MiniMax', icon: '🇨🇳', description: '多模态能力' },
  openai: { name: 'OpenAI GPT', icon: '🚀', description: '最强通用能力' },
  anthropic: { name: 'Anthropic Claude', icon: '🧠', description: '安全推理强' },
  mistral: { name: 'Mistral AI', icon: '🇫🇷', description: '欧洲AI' },
  cohere: { name: 'Cohere', icon: '🔗', description: '企业级AI' },
  perplexity: { name: 'Perplexity', icon: '🔍', description: '搜索增强' },
  together: { name: 'Together AI', icon: '🤝', description: '开源模型' },
  fireworks: { name: 'Fireworks AI', icon: '🎆', description: '高性能推理' },
  replicate: { name: 'Replicate', icon: '🔄', description: '模型复制' },
  huggingface: { name: 'Hugging Face', icon: '🤗', description: '开源社区' }
}

const QuotaStatus = ({ apiUrl, selectedProvider = 'auto', compact = false }) => {
  const [quotaStatus, setQuotaStatus] = useState(null)
  const [allQuotas, setAllQuotas] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refreshingReal, setRefreshingReal] = useState(false)

  // 获取所有平台的配额状态
  const fetchAllQuotaStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/chat/quota`)
      const data = await response.json()

      if (data.success) {
        setAllQuotas(data.quotas || {})

        // 如果选择了特定平台，设置该平台的配额状态
        if (selectedProvider !== 'auto' && data.quotas[selectedProvider]) {
          setQuotaStatus(data.quotas[selectedProvider])
        } else {
          setQuotaStatus(null) // 智能选择模式不显示特定配额
        }
      } else {
        setError(data.error || 'Failed to fetch quota status')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 获取特定平台的配额状态
  const fetchProviderQuotaStatus = async (provider) => {
    if (provider === 'auto') {
      setQuotaStatus(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/chat/quota/${provider}`)
      const data = await response.json()

      if (data.success) {
        setQuotaStatus(data.quota)
      } else {
        setError(data.error || 'Failed to fetch quota status')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 刷新真实配额信息
  const refreshRealQuota = async () => {
    setRefreshingReal(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/chat/quota/refresh`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        // 刷新成功后重新获取配额状态
        if (selectedProvider === 'auto') {
          await fetchAllQuotaStatus()
        } else {
          await fetchProviderQuotaStatus(selectedProvider)
        }
      } else {
        setError(data.error || '刷新配额失败')
      }
    } catch (err) {
      console.error('刷新真实配额失败:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setRefreshingReal(false)
    }
  }

  // 当选择的平台改变时，获取对应的配额状态
  useEffect(() => {
    if (selectedProvider === 'auto') {
      fetchAllQuotaStatus()
    } else {
      fetchProviderQuotaStatus(selectedProvider)
    }
  }, [apiUrl, selectedProvider])

  // 计算配额百分比
  const getQuotaPercentage = () => {
    if (!quotaStatus) return 0
    return (quotaStatus.used / quotaStatus.dailyLimit) * 100
  }

  // 标准彩虹色谱定义 (红、橙、黄、绿、蓝、靛、紫)
  const rainbowColors = [
    '#FF0000', // 红色
    '#FF8000', // 橙色
    '#FFFF00', // 黄色
    '#00FF00', // 绿色
    '#0080FF', // 蓝色
    '#4B0082', // 靛色
    '#8000FF'  // 紫色
  ]

  // 获取配额状态颜色 (动态彩虹渐变)
  const getQuotaColor = () => {
    const percentage = getQuotaPercentage()
    const ratio = Math.min(percentage / 100, 1)

    // 根据百分比计算在彩虹色谱中的位置
    const colorIndex = ratio * (rainbowColors.length - 1)
    const lowerIndex = Math.floor(colorIndex)
    const upperIndex = Math.min(lowerIndex + 1, rainbowColors.length - 1)
    const localRatio = colorIndex - lowerIndex

    // 获取两个相邻颜色
    const lowerColor = rainbowColors[lowerIndex]
    const upperColor = rainbowColors[upperIndex]

    // 解析颜色值
    const lowerRGB = {
      r: parseInt(lowerColor.slice(1, 3), 16),
      g: parseInt(lowerColor.slice(3, 5), 16),
      b: parseInt(lowerColor.slice(5, 7), 16)
    }
    const upperRGB = {
      r: parseInt(upperColor.slice(1, 3), 16),
      g: parseInt(upperColor.slice(3, 5), 16),
      b: parseInt(upperColor.slice(5, 7), 16)
    }

    // 线性插值计算最终颜色
    const r = Math.round(lowerRGB.r + (upperRGB.r - lowerRGB.r) * localRatio)
    const g = Math.round(lowerRGB.g + (upperRGB.g - lowerRGB.g) * localRatio)
    const b = Math.round(lowerRGB.b + (upperRGB.b - lowerRGB.b) * localRatio)

    return `rgb(${r}, ${g}, ${b})`
  }

  // 获取时间切换的彩虹渐变背景
  const getGradientBackground = () => {
    const currentColor = getQuotaColor()
    // 创建完整的彩虹渐变，每4秒切换一个颜色周期
    return `linear-gradient(45deg,
      #FF0000 0%,      /* 红色 */
      #FF8000 14.3%,   /* 橙色 */
      #FFFF00 28.6%,   /* 黄色 */
      #00FF00 42.9%,   /* 绿色 */
      #0080FF 57.1%,   /* 蓝色 */
      #4B0082 71.4%,   /* 靛色 */
      #8000FF 85.7%,   /* 紫色 */
      ${currentColor} 100%
    )`
  }

  // 获取智能选择模式的流动渐变
  const getSmartGradientBackground = (percentage) => {
    const ratio = Math.min(percentage / 100, 1)
    const r = Math.round(0 + (239 - 0) * ratio)
    const g = Math.round(123 + (68 - 123) * ratio)
    const b = Math.round(255 + (68 - 255) * ratio)
    const endColor = `rgb(${r}, ${g}, ${b})`

    return `linear-gradient(90deg,
      #007bff 0%,
      #0056b3 25%,
      ${endColor} 50%,
      ${endColor} 75%,
      #007bff 100%
    )`
  }

  // 获取配额状态文本
  const getQuotaStatusText = () => {
    if (!quotaStatus) return ''
    
    const percentage = getQuotaPercentage()
    if (percentage >= 100) return '配额已用完'
    if (percentage >= 90) return '配额即将用完'
    if (percentage >= 70) return '配额使用较多'
    return '配额充足'
  }

  // 获取当前平台信息
  const getCurrentProviderInfo = () => {
    return PROVIDER_INFO[selectedProvider] || PROVIDER_INFO.auto
  }

  if (loading) {
    return (
      <div className="quota-status loading">
        <div className="quota-icon">📊</div>
        <span>加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quota-status error" onClick={() => {
        if (selectedProvider === 'auto') {
          fetchAllQuotaStatus()
        } else {
          fetchProviderQuotaStatus(selectedProvider)
        }
      }}>
        <div className="quota-icon">⚠️</div>
        <span>配额状态获取失败，点击重试</span>
      </div>
    )
  }

  // 智能选择模式显示Google Gemini的配额状态
  if (selectedProvider === 'auto') {
    // 优先显示Gemini的配额信息，使用简化的样式
    const geminiQuota = allQuotas.gemini
    if (geminiQuota && geminiQuota.dailyLimit) {
      const geminiInfo = PROVIDER_INFO.gemini
      const percentage = (geminiQuota.used / geminiQuota.dailyLimit) * 100
      // 智能选择模式的彩虹渐变色计算
      const getRainbowColor = () => {
        const ratio = Math.min(percentage / 100, 1)

        // 根据百分比计算在彩虹色谱中的位置
        const colorIndex = ratio * (rainbowColors.length - 1)
        const lowerIndex = Math.floor(colorIndex)
        const upperIndex = Math.min(lowerIndex + 1, rainbowColors.length - 1)
        const localRatio = colorIndex - lowerIndex

        // 获取两个相邻颜色
        const lowerColor = rainbowColors[lowerIndex]
        const upperColor = rainbowColors[upperIndex]

        // 解析颜色值
        const lowerRGB = {
          r: parseInt(lowerColor.slice(1, 3), 16),
          g: parseInt(lowerColor.slice(3, 5), 16),
          b: parseInt(lowerColor.slice(5, 7), 16)
        }
        const upperRGB = {
          r: parseInt(upperColor.slice(1, 3), 16),
          g: parseInt(upperColor.slice(3, 5), 16),
          b: parseInt(upperColor.slice(5, 7), 16)
        }

        // 线性插值计算最终颜色
        const r = Math.round(lowerRGB.r + (upperRGB.r - lowerRGB.r) * localRatio)
        const g = Math.round(lowerRGB.g + (upperRGB.g - lowerRGB.g) * localRatio)
        const b = Math.round(lowerRGB.b + (upperRGB.b - lowerRGB.b) * localRatio)

        return `rgb(${r}, ${g}, ${b})`
      }

      // 获取流动的彩虹渐变背景
      const getRainbowGradient = () => {
        const currentColor = getRainbowColor()
        return `linear-gradient(45deg,
          #FF0000 0%,      /* 红色 */
          #FF8000 14.3%,   /* 橙色 */
          #FFFF00 28.6%,   /* 黄色 */
          #00FF00 42.9%,   /* 绿色 */
          #0080FF 57.1%,   /* 蓝色 */
          #4B0082 71.4%,   /* 靛色 */
          #8000FF 85.7%,   /* 紫色 */
          ${currentColor} 100%)`
      }

      return (
        <div className="quota-status-simple" onClick={() => fetchAllQuotaStatus()} title="点击刷新配额状态">
          {/* 标题行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              {geminiInfo.icon} {geminiInfo.name} 配额
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); refreshRealQuota(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: refreshingReal ? 0.5 : 1
                }}
                disabled={refreshingReal}
                title="刷新真实配额"
                aria-label="刷新真实配额"
              >
                {refreshingReal ? '⏳' : '🔄'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fetchAllQuotaStatus(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                title="刷新本地配额"
                aria-label="刷新本地配额"
              >
                📊
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              width: '100%',
              height: '16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              <div
                className="flowing-gradient"
                style={{
                  width: percentage === 0 ? '16px' : `${Math.max(percentage, 3)}%`,
                  height: '100%',
                  background: getRainbowGradient(),
                  borderRadius: '7px',
                  position: 'relative',
                  minWidth: '16px',
                  transition: 'width 0.8s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}></div>
            </div>


            {/* 进度条标签 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
              <span>0</span>
              <span>{geminiQuota.dailyLimit}</span>
            </div>
          </div>

          {/* 剩余配额显示 */}
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#059669',
            fontWeight: '600',
            padding: '4px 8px',
            backgroundColor: '#d1fae5',
            borderRadius: '6px',
            border: '1px solid #a7f3d0'
          }}>
            剩余 {geminiQuota.dailyLimit - geminiQuota.used} 次请求
          </div>
        </div>
      )
    }

    // 如果没有Gemini配额信息，显示默认的智能选择模式
    const availableProviders = Object.keys(allQuotas).slice(0, 3)
    return (
      <div className="quota-status auto-mode" onClick={() => fetchAllQuotaStatus()} title="点击刷新配额状态">
        <div className="quota-header">
          <span className="quota-title">🤖 智能选择模式</span>
          <button className={`quota-refresh-hint${loading ? ' loading' : ''}`} onClick={(e) => { e.stopPropagation(); fetchAllQuotaStatus(); }} aria-label="刷新配额">🔄</button>
        </div>
        <div className="auto-providers">
          {availableProviders.length > 0 ? (
            availableProviders.map(provider => {
              const quota = allQuotas[provider]
              const info = PROVIDER_INFO[provider]
              return (
                <div key={provider} className="provider-item">
                  <span className="provider-icon">{info?.icon || '🤖'}</span>
                  <span className="provider-name">{info?.name || provider}</span>
                  {quota.dailyLimit && (
                    <span className="provider-usage">
                      {quota.used}/{quota.dailyLimit}
                    </span>
                  )}
                </div>
              )
            })
          ) : (
            <div className="no-providers">暂无可用平台</div>
          )}
        </div>
      </div>
    )
  }

  // 特定平台模式
  if (!quotaStatus) {
    return (
      <div className="quota-status no-quota">
        <div className="quota-icon">{getCurrentProviderInfo().icon}</div>
        <span>该平台暂无配额信息</span>
      </div>
    )
  }

  const providerInfo = getCurrentProviderInfo()

  return (
    <div className="quota-status" onClick={() => fetchProviderQuotaStatus(selectedProvider)} title="点击刷新配额状态">
      <div className="quota-detailed">
        {/* 标题行 */}
        <div className="quota-header">
          <span className="quota-title">{providerInfo.icon} {providerInfo.name} 配额</span>
          <button className={`quota-refresh-hint${loading ? ' loading' : ''}`} onClick={(e) => { e.stopPropagation(); fetchProviderQuotaStatus(selectedProvider); }} aria-label="刷新配额">🔄</button>
        </div>

        {/* 使用情况 */}
        <div className="quota-usage">
          <div className="quota-usage-text">
            <span className="used">{quotaStatus.used}</span>
            <span className="separator">/</span>
            <span className="total">{quotaStatus.dailyLimit}</span>
          </div>
        </div>

        {/* 详细进度条 */}
        <div className="quota-progress-container">
          <div className="quota-progress-bar">
            <div
              className="quota-progress-used"
              style={{
                width: getQuotaPercentage() === 0 ? '14px' : `${Math.max(getQuotaPercentage(), 3)}%`,
                background: getGradientBackground(),
                minWidth: '14px'
              }}
            />
          </div>

          {/* 进度条标签 */}
          <div className="quota-progress-labels">
            <span className="label-start">0</span>
            <span className="label-end">{quotaStatus.dailyLimit}</span>
          </div>
        </div>

        {/* 百分比显示 */}
        <div className="quota-percentage">
          <span style={{ color: getQuotaColor(), fontWeight: '600' }}>
            {getQuotaPercentage().toFixed(1)}% 已使用
          </span>
        </div>

        {/* 剩余配额显示 */}
        <div className="quota-remaining">
          剩余 {quotaStatus.dailyLimit - quotaStatus.used} 次请求
        </div>
      </div>

      <style jsx>{`
        .quota-status-minimal {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          padding: 2px;
        }

        .quota-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .quota-status-minimal:hover .quota-dot {
          transform: scale(1.2);
        }

        .quota-status {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 11px;
        }

        .quota-status:hover {
          opacity: 0.8;
        }

        .quota-status.loading {
          opacity: 0.6;
          cursor: default;
        }

        .quota-status.error {
          color: #ef4444;
        }

        .quota-detailed {
          width: 100%;
          padding: 6px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .quota-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .quota-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .quota-refresh-hint {
          font-size: 10px;
          opacity: 0.6;
        }

        .quota-usage {
          margin-bottom: 6px;
        }

        .quota-usage-text {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .quota-usage-text .used {
          color: #1d4ed8;
        }

        .quota-usage-text .separator {
          color: #6b7280;
          font-weight: 400;
        }

        .quota-usage-text .total {
          color: #6b7280;
        }

        .quota-progress-container {
          margin-bottom: 8px;
          position: relative;
        }

        .quota-progress-bar {
          width: 100%;
          height: 14px;
          background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
          position: relative;
        }

        .quota-progress-used {
          height: 100%;
          border-radius: 6px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
          min-width: 14px;
          background-size: 280px 280px !important;
          animation: rainbowFlow 28s linear infinite;
        }

        @keyframes rainbowFlow {
          0% { background-position: 0% 0%; }
          14.3% { background-position: -40px 0%; }   /* 橙色 */
          28.6% { background-position: -80px 0%; }   /* 黄色 */
          42.9% { background-position: -120px 0%; }  /* 绿色 */
          57.1% { background-position: -160px 0%; }  /* 蓝色 */
          71.4% { background-position: -200px 0%; }  /* 靛色 */
          85.7% { background-position: -240px 0%; }  /* 紫色 */
          100% { background-position: -280px 0%; }   /* 回到红色 */
        }

        @keyframes flowingGradient {
          0% { background-position: 0% 0%; }
          14.3% { background-position: -40px 0%; }   /* 每4秒切换 */
          28.6% { background-position: -80px 0%; }
          42.9% { background-position: -120px 0%; }
          57.1% { background-position: -160px 0%; }
          71.4% { background-position: -200px 0%; }
          85.7% { background-position: -240px 0%; }
          100% { background-position: -280px 0%; }
        }

        /* 全局流动动画类 */
        .flowing-gradient {
          background-size: 280px 280px !important;
          animation: flowingGradient 28s linear infinite !important;
        }

        .quota-progress-used::after {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          height: 3px;
          background: linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%);
          border-radius: 3px;
        }

        .quota-progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
        }

        .label-start {
          color: #10b981;
          background: #ecfdf5;
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid #d1fae5;
          font-weight: 600;
        }

        .label-end {
          color: #475569;
          background: #f8fafc;
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid #e2e8f0;
          font-weight: 600;
        }

        .quota-status-info {
          margin-bottom: 6px;
        }

        .status-message {
          font-size: 10px;
          font-weight: 500;
          padding: 4px 6px;
          border-radius: 4px;
          text-align: center;
        }

        .status-message.good {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-message.caution {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .status-message.warning {
          background: #fed7aa;
          color: #9a3412;
          border: 1px solid #fdba74;
        }

        /* Gemini专用样式 */
        .quota-status.gemini-focused {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #93c5fd;
        }

        .quota-status.gemini-focused .quota-title {
          color: #1d4ed8;
          font-weight: 700;
        }

        .quota-status.gemini-focused .quota-usage-text {
          justify-content: center;
          gap: 2px;
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
        }

        .quota-status.gemini-focused .quota-progress-bar {
          height: 14px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .quota-status.gemini-focused .quota-progress-used {
          background: linear-gradient(45deg,
            #FF0000 0%, #FF8000 14.3%, #FFFF00 28.6%, #00FF00 42.9%,
            #0080FF 57.1%, #4B0082 71.4%, #8000FF 85.7%, #FF0000 100%) !important;
          background-size: 280px 280px !important;
          animation: rainbowFlow 28s linear infinite !important;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(128, 0, 255, 0.3);
        }

        .quota-status.gemini-focused .quota-percentage {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          margin-top: 6px;
        }

        /* 智能选择模式样式 */
        .quota-status.auto-mode {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border: 1px solid #d1d5db;
        }

        .auto-providers {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }

        .provider-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 6px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 4px;
          font-size: 10px;
        }

        .provider-icon {
          font-size: 12px;
        }

        .provider-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }

        .provider-usage {
          font-size: 9px;
          color: #6b7280;
          background: #f9fafb;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .no-providers {
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
          padding: 8px;
        }

        /* 无配额信息样式 */
        .quota-status.no-quota {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }
        }

        .status-message.error {
          background: #fecaca;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .quota-percentage {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }

        .quota-remaining {
          text-align: center;
          font-size: 10px;
          color: #059669;
          font-weight: 500;
          margin-top: 4px;
          padding: 4px 8px;
          background: #d1fae5;
          border-radius: 6px;
          border: 1px solid #a7f3d0;
        }

        @media (max-width: 768px) {
          .quota-detailed {
            padding: 6px;
          }

          .quota-title {
            font-size: 11px;
          }

          .quota-usage-text {
            font-size: 9px;
          }

          .quota-progress-bar {
            height: 10px;
          }

          .quota-progress-labels {
            font-size: 8px;
          }

          .label-current {
            font-size: 7px;
            padding: 1px 3px;
          }

          .status-message {
            font-size: 9px;
            padding: 3px 5px;
          }

          .quota-percentage {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  )
}

export default QuotaStatus
