/**
 * 通用资源加载组件
 * 用于加载各种外部资源，支持本地优先、CDN备用策略
 */

import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'

/**
 * 增强的资源加载函数
 * @param {string} localPath 本地路径
 * @param {string} type 资源类型
 * @param {Array<string>} fallbackUrls 备用CDN地址
 */
async function loadResourceWithFallback(localPath, type, fallbackUrls = []) {
  // 首先尝试本地资源
  try {
    await loadExternalResource(localPath, type)
    console.log(`✅ 本地资源加载成功: ${localPath}`)
    return localPath
  } catch (error) {
    console.warn(`⚠️ 本地资源加载失败: ${localPath}，尝试CDN备用`)
    
    // 依次尝试备用CDN
    for (const cdnUrl of fallbackUrls) {
      try {
        await loadExternalResource(cdnUrl, type)
        console.log(`✅ CDN备用资源加载成功: ${cdnUrl}`)
        return cdnUrl
      } catch (cdnError) {
        console.warn(`⚠️ CDN备用资源加载失败: ${cdnUrl}`)
      }
    }
    
    throw new Error(`所有资源加载失败: ${localPath}`)
  }
}

/**
 * Mermaid图表加载器
 */
export function MermaidLoader() {
  useEffect(() => {
    const loadMermaid = async () => {
      try {
        await loadResourceWithFallback(
          '/js/mermaid.min.js',
          'js',
          [
            'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.min.js',
            'https://unpkg.com/mermaid@11.4.0/dist/mermaid.min.js'
          ]
        )
        
        // 初始化Mermaid
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: true,
            theme: 'default'
          })
        }
      } catch (error) {
        console.error('Mermaid加载失败:', error)
      }
    }
    
    loadMermaid()
  }, [])
  
  return null
}

/**
 * Animate.css加载器
 */
export function AnimateCSSLoader() {
  useEffect(() => {
    const loadAnimateCSS = async () => {
      try {
        await loadResourceWithFallback(
          '/css/animate.min.css',
          'css',
          [
            'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
            'https://unpkg.com/animate.css@4.1.1/animate.min.css'
          ]
        )
      } catch (error) {
        console.error('Animate.css加载失败:', error)
      }
    }
    
    loadAnimateCSS()
  }, [])
  
  return null
}

/**
 * Gitalk评论系统加载器
 */
export function GitalkLoader() {
  useEffect(() => {
    const loadGitalk = async () => {
      try {
        // 加载CSS
        await loadResourceWithFallback(
          '/css/gitalk.css',
          'css',
          [
            'https://cdn.jsdelivr.net/npm/gitalk@1/dist/gitalk.css',
            'https://unpkg.com/gitalk@1/dist/gitalk.css'
          ]
        )
        
        // 加载JS
        await loadResourceWithFallback(
          '/js/gitalk.min.js',
          'js',
          [
            'https://cdn.jsdelivr.net/npm/gitalk@1/dist/gitalk.min.js',
            'https://unpkg.com/gitalk@1/dist/gitalk.min.js'
          ]
        )
      } catch (error) {
        console.error('Gitalk加载失败:', error)
      }
    }
    
    loadGitalk()
  }, [])
  
  return null
}

/**
 * Valine评论系统加载器
 */
export function ValineLoader() {
  useEffect(() => {
    const loadValine = async () => {
      try {
        await loadResourceWithFallback(
          '/js/valine.min.js',
          'js',
          [
            'https://unpkg.com/valine@1.5.1/dist/Valine.min.js',
            'https://cdn.jsdelivr.net/npm/valine@1.5.1/dist/Valine.min.js'
          ]
        )
      } catch (error) {
        console.error('Valine加载失败:', error)
      }
    }
    
    loadValine()
  }, [])
  
  return null
}

/**
 * 通用资源加载器组件
 * @param {Object} props
 * @param {string} props.localPath 本地路径
 * @param {string} props.type 资源类型
 * @param {Array<string>} props.fallbackUrls 备用URL列表
 * @param {Function} props.onLoad 加载成功回调
 * @param {Function} props.onError 加载失败回调
 */
export function ResourceLoader({ localPath, type, fallbackUrls = [], onLoad, onError }) {
  useEffect(() => {
    const loadResource = async () => {
      try {
        const loadedUrl = await loadResourceWithFallback(localPath, type, fallbackUrls)
        onLoad && onLoad(loadedUrl)
      } catch (error) {
        onError && onError(error)
      }
    }
    
    if (localPath) {
      loadResource()
    }
  }, [localPath, type, fallbackUrls, onLoad, onError])
  
  return null
}

export default ResourceLoader
