/**
 * URL 处理器
 * 处理网站链接解析和内容提取
 */

import { Hono } from 'hono'
import { isValidUrl, stripHtml, truncateText } from '../utils/helpers'

const app = new Hono()

// 解析URL
app.post('/parse', async (c) => {
  try {
    const { url } = await c.req.json()
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400)
    }

    if (!isValidUrl(url)) {
      return c.json({ error: 'Invalid URL format' }, 400)
    }

    // 解析URL内容
    const urlInfo = await parseUrlContent(url)

    return c.json({
      success: true,
      url: urlInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('URL parse error:', error)
    return c.json({
      error: 'Failed to parse URL',
      message: error.message
    }, 500)
  }
})

// 批量解析URL
app.post('/parse-batch', async (c) => {
  try {
    const { urls } = await c.req.json()
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return c.json({ error: 'URLs array is required' }, 400)
    }

    if (urls.length > 10) {
      return c.json({ error: 'Maximum 10 URLs allowed' }, 400)
    }

    // 并行解析所有URL
    const results = await Promise.allSettled(
      urls.map(url => parseUrlContent(url))
    )

    const parsedUrls = results.map((result, index) => ({
      url: urls[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }))

    return c.json({
      success: true,
      urls: parsedUrls,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch URL parse error:', error)
    return c.json({
      error: 'Failed to parse URLs',
      message: error.message
    }, 500)
  }
})

// 获取网站截图 (可选功能)
app.post('/screenshot', async (c) => {
  try {
    const { url } = await c.req.json()
    
    if (!url || !isValidUrl(url)) {
      return c.json({ error: 'Valid URL is required' }, 400)
    }

    // 这里可以集成截图服务，如 Puppeteer 或第三方API
    // 由于 Workers 限制，这里返回占位符
    
    return c.json({
      success: true,
      screenshot: {
        url: url,
        thumbnailUrl: null,
        message: 'Screenshot service not implemented'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Screenshot error:', error)
    return c.json({
      error: 'Failed to capture screenshot',
      message: error.message
    }, 500)
  }
})

// 解析URL内容的核心函数
async function parseUrlContent(url) {
  try {
    // 设置请求头
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; ChatAI-Bot/1.0; +https://chatai.example.com/bot)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    // 获取网页内容
    const response = await fetch(url, {
      headers: headers,
      cf: {
        timeout: 10000 // 10秒超时
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    
    // 检查是否为HTML内容
    if (!contentType.includes('text/html')) {
      return {
        url: url,
        title: getUrlTitle(url),
        description: `${contentType} file`,
        content: '',
        type: 'file',
        contentType: contentType,
        size: response.headers.get('content-length') || 'unknown'
      }
    }

    const html = await response.text()
    
    // 解析HTML内容
    const parsed = parseHtmlContent(html, url)
    
    return {
      url: url,
      title: parsed.title || getUrlTitle(url),
      description: parsed.description || '',
      content: parsed.content || '',
      type: 'webpage',
      contentType: contentType,
      favicon: parsed.favicon,
      image: parsed.image,
      author: parsed.author,
      publishedTime: parsed.publishedTime,
      keywords: parsed.keywords
    }

  } catch (error) {
    console.error(`Failed to parse URL ${url}:`, error)
    
    return {
      url: url,
      title: getUrlTitle(url),
      description: `Failed to load: ${error.message}`,
      content: '',
      type: 'error',
      error: error.message
    }
  }
}

// 解析HTML内容
function parseHtmlContent(html, baseUrl) {
  const result = {
    title: '',
    description: '',
    content: '',
    favicon: '',
    image: '',
    author: '',
    publishedTime: '',
    keywords: []
  }

  try {
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
    if (titleMatch) {
      result.title = stripHtml(titleMatch[1]).trim()
    }

    // 提取meta描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    if (descMatch) {
      result.description = descMatch[1].trim()
    }

    // 提取Open Graph数据
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    if (ogTitle && !result.title) {
      result.title = ogTitle[1].trim()
    }

    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
    if (ogDesc && !result.description) {
      result.description = ogDesc[1].trim()
    }

    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
    if (ogImage) {
      result.image = resolveUrl(ogImage[1], baseUrl)
    }

    // 提取作者
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i)
    if (authorMatch) {
      result.author = authorMatch[1].trim()
    }

    // 提取发布时间
    const timeMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i)
    if (timeMatch) {
      result.publishedTime = timeMatch[1].trim()
    }

    // 提取关键词
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i)
    if (keywordsMatch) {
      result.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k)
    }

    // 提取favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i)
    if (faviconMatch) {
      result.favicon = resolveUrl(faviconMatch[1], baseUrl)
    }

    // 提取主要内容
    let content = html
    
    // 移除脚本和样式
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    content = content.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    
    // 尝试提取主要内容区域
    const mainContentSelectors = [
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i
    ]
    
    for (const selector of mainContentSelectors) {
      const match = content.match(selector)
      if (match) {
        content = match[1]
        break
      }
    }
    
    // 清理HTML标签并提取文本
    content = stripHtml(content)
    content = content.replace(/\s+/g, ' ').trim()
    
    // 截断内容
    result.content = truncateText(content, 2000)

  } catch (error) {
    console.error('HTML parsing error:', error)
  }

  return result
}

// 从URL获取标题
function getUrlTitle(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

// 解析相对URL
function resolveUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export { app as UrlHandler }
