/**
 * 文件处理器
 * 处理文件上传、存储和检索
 */

import { Hono } from 'hono'
import { generateId, formatFileSize, getMimeType } from '../utils/helpers'

// 二进制安全的multipart解析器
function parseMultipartBinary(body, boundary) {
  try {
    const bodyBytes = new Uint8Array(body)
    const boundaryBytes = new TextEncoder().encode(`--${boundary}`)
    const crlfBytes = new TextEncoder().encode('\r\n')
    const doublecrlfBytes = new TextEncoder().encode('\r\n\r\n')

    // 查找boundary位置
    const parts = []
    let start = 0

    while (start < bodyBytes.length) {
      const boundaryIndex = findBytes(bodyBytes, boundaryBytes, start)
      if (boundaryIndex === -1) break

      const nextBoundaryIndex = findBytes(bodyBytes, boundaryBytes, boundaryIndex + boundaryBytes.length)
      const partEnd = nextBoundaryIndex === -1 ? bodyBytes.length : nextBoundaryIndex

      if (boundaryIndex + boundaryBytes.length < partEnd) {
        const partBytes = bodyBytes.slice(boundaryIndex + boundaryBytes.length, partEnd)
        parts.push(partBytes)
      }

      start = boundaryIndex + boundaryBytes.length
    }

    console.log('Binary parts found:', parts.length)

    // 查找文件部分
    for (const partBytes of parts) {
      const partText = new TextDecoder().decode(partBytes.slice(0, Math.min(500, partBytes.length)))

      if (partText.includes('Content-Disposition: form-data; name="file"')) {
        console.log('Found file part (binary)')

        // 提取文件名
        let fileName = 'unknown'
        const fileNameMatch = partText.match(/filename="([^"]*)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
          console.log('Extracted filename:', fileName)
        }

        // 提取文件类型
        let fileType = 'application/octet-stream'
        const contentTypeMatch = partText.match(/Content-Type: ([^\r\n]*)/)
        if (contentTypeMatch) {
          fileType = contentTypeMatch[1]
          console.log('Extracted content type:', fileType)
        }

        // 查找数据开始位置（\r\n\r\n之后）
        const headerEndIndex = findBytes(partBytes, doublecrlfBytes, 0)
        if (headerEndIndex !== -1) {
          const fileDataStart = headerEndIndex + doublecrlfBytes.length
          let fileDataEnd = partBytes.length

          // 移除结尾的\r\n
          if (fileDataEnd >= 2 &&
              partBytes[fileDataEnd - 2] === 13 &&
              partBytes[fileDataEnd - 1] === 10) {
            fileDataEnd -= 2
          }

          const fileData = partBytes.slice(fileDataStart, fileDataEnd)
          console.log('Binary file data extracted, length:', fileData.length)

          // 检测文件格式
          if (fileData.length >= 12) {
            const signature = Array.from(fileData.slice(0, 12)).map(b => String.fromCharCode(b)).join('')
            console.log('File signature:', signature.substring(0, 10))

            if (signature.startsWith('RIFF') && signature.includes('WEBP')) {
              fileType = 'image/webp'
              console.log('Detected WebP format from binary signature')
            } else if (fileData[0] === 0x89 && fileData[1] === 0x50 && fileData[2] === 0x4E && fileData[3] === 0x47) {
              fileType = 'image/png'
              console.log('Detected PNG format from binary signature')
            } else if (fileData[0] === 0xFF && fileData[1] === 0xD8 && fileData[2] === 0xFF) {
              fileType = 'image/jpeg'
              console.log('Detected JPEG format from binary signature')
            }
          }

          return {
            success: true,
            fileName,
            fileType,
            fileData
          }
        }
      }
    }

    return { success: false, error: 'No file found in multipart data' }
  } catch (error) {
    console.error('Binary multipart parsing error:', error)
    return { success: false, error: 'Failed to parse multipart data' }
  }
}

// 在字节数组中查找子数组
function findBytes(haystack, needle, startIndex = 0) {
  for (let i = startIndex; i <= haystack.length - needle.length; i++) {
    let found = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }
  return -1
}

const app = new Hono()

// 上传文件
app.post('/upload', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session')

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    // 简化的文件上传处理
    const contentType = c.req.header('content-type') || ''
    console.log('Content-Type:', contentType)

    if (!contentType.includes('multipart/form-data')) {
      return c.json({
        error: 'Invalid content type',
        message: 'Expected multipart/form-data'
      }, 400)
    }

    // 获取原始请求体
    const body = await c.req.arrayBuffer()
    console.log('Raw body length:', body.byteLength)

    if (body.byteLength === 0) {
      return c.json({ error: 'Empty request body' }, 400)
    }

    // 二进制安全的multipart解析
    const boundary = contentType.split('boundary=')[1]

    if (!boundary) {
      return c.json({ error: 'No boundary found in content-type' }, 400)
    }

    console.log('Boundary:', boundary)
    console.log('Raw body length:', body.byteLength)

    // 使用二进制安全的multipart解析
    const result = parseMultipartBinary(body, boundary)
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    const { fileName, fileType, fileData } = result



    if (!fileData) {
      return c.json({ error: 'No file data found' }, 400)
    }

    console.log('Parsed file:', { fileName, fileType, size: fileData.length })

    // 文件大小限制 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (fileData.length > maxSize) {
      return c.json({
        error: 'File too large',
        maxSize: formatFileSize(maxSize)
      }, 400)
    }

    // 生成文件ID和路径
    const fileId = generateId()
    const fileExtension = fileName.split('.').pop() || ''
    const storagePath = `${sessionId}/${fileId}.${fileExtension}`

    // 使用解析出的文件数据
    const fileContent = fileData
    console.log('Using parsed file data, length:', fileContent.length)

    // 存储到R2
    await c.env.FILE_STORAGE.put(storagePath, fileContent, {
      httpMetadata: {
        contentType: fileType || getMimeType(fileName),
        contentDisposition: `attachment; filename="${fileName}"`
      },
      customMetadata: {
        originalName: fileName,
        uploadedBy: sessionId,
        uploadedAt: new Date().toISOString(),
        fileId: fileId
      }
    })

    // 处理文件内容
    let processedContent = null
    if (fileType?.startsWith('text/') ||
        fileType?.includes('json') ||
        fileType?.includes('javascript') ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.js') ||
        fileName.endsWith('.json') ||
        fileName.endsWith('.html') ||
        fileName.endsWith('.css')) {
      try {
        processedContent = new TextDecoder('utf-8').decode(fileContent)
        console.log('Decoded text content length:', processedContent.length)
        console.log('Text content preview:', processedContent.substring(0, 200))
      } catch (error) {
        console.warn('Failed to decode text file:', error)
        // 尝试其他编码
        try {
          processedContent = new TextDecoder('latin1').decode(fileContent)
          console.log('Decoded with latin1, length:', processedContent.length)
        } catch (error2) {
          console.error('Failed to decode with any encoding:', error2)
        }
      }
    } else if (fileType?.startsWith('image/')) {
      // 对于图片，提供基本信息
      processedContent = `[Image file: ${fileName}, Type: ${fileType}, Size: ${fileContent.length} bytes]`
      console.log('Image file processed:', processedContent)
    } else {
      // 对于其他文件类型，提供基本信息
      processedContent = `[Binary file: ${fileName}, Type: ${fileType}, Size: ${fileContent.length} bytes]`
      console.log('Binary file processed:', processedContent)
    }

    const fileInfo = {
      id: fileId,
      name: fileName,
      type: fileType || getMimeType(fileName),
      size: fileContent.length,
      url: `/api/file/${fileId}`,
      storagePath: storagePath,
      content: processedContent,
      uploadedAt: new Date().toISOString()
    }

    return c.json({
      success: true,
      file: fileInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('File upload error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      fileType: typeof file,
      fileMethods: file ? Object.getOwnPropertyNames(file) : 'no file'
    })
    return c.json({
      error: 'Failed to upload file',
      message: error.message
    }, 500)
  }
})

// 获取文件
app.get('/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    const sessionId = c.req.header('X-Chat-Session')

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    // 查找文件
    const objects = await c.env.FILE_STORAGE.list({
      prefix: `${sessionId}/`
    })

    let targetObject = null
    for (const obj of objects.objects) {
      if (obj.customMetadata?.fileId === fileId) {
        targetObject = obj
        break
      }
    }

    if (!targetObject) {
      return c.json({ error: 'File not found' }, 404)
    }

    // 获取文件内容
    const object = await c.env.FILE_STORAGE.get(targetObject.key)
    if (!object) {
      return c.json({ error: 'File content not found' }, 404)
    }

    // 返回文件
    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
    headers.set('Content-Disposition', object.httpMetadata?.contentDisposition || 'attachment')
    headers.set('Content-Length', object.size.toString())

    return new Response(object.body, {
      headers: headers
    })

  } catch (error) {
    console.error('Get file error:', error)
    return c.json({
      error: 'Failed to get file',
      message: error.message
    }, 500)
  }
})

// 获取文件信息
app.get('/:fileId/info', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    const sessionId = c.req.header('X-Chat-Session')

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    // 查找文件
    const objects = await c.env.FILE_STORAGE.list({
      prefix: `${sessionId}/`
    })

    let targetObject = null
    for (const obj of objects.objects) {
      if (obj.customMetadata?.fileId === fileId) {
        targetObject = obj
        break
      }
    }

    if (!targetObject) {
      return c.json({ error: 'File not found' }, 404)
    }

    const fileInfo = {
      id: fileId,
      name: targetObject.customMetadata?.originalName || 'unknown',
      size: targetObject.size,
      type: targetObject.httpMetadata?.contentType || 'application/octet-stream',
      uploadedAt: targetObject.customMetadata?.uploadedAt,
      url: `/api/file/${fileId}`
    }

    return c.json({
      success: true,
      file: fileInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get file info error:', error)
    return c.json({
      error: 'Failed to get file info',
      message: error.message
    }, 500)
  }
})

// 删除文件
app.delete('/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    const sessionId = c.req.header('X-Chat-Session')

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    // 查找文件
    const objects = await c.env.FILE_STORAGE.list({
      prefix: `${sessionId}/`
    })

    let targetObject = null
    for (const obj of objects.objects) {
      if (obj.customMetadata?.fileId === fileId) {
        targetObject = obj
        break
      }
    }

    if (!targetObject) {
      return c.json({ error: 'File not found' }, 404)
    }

    // 删除文件
    await c.env.FILE_STORAGE.delete(targetObject.key)

    return c.json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Delete file error:', error)
    return c.json({
      error: 'Failed to delete file',
      message: error.message
    }, 500)
  }
})

// 列出用户文件
app.get('/list', async (c) => {
  try {
    const sessionId = c.req.header('X-Chat-Session')

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400)
    }

    const objects = await c.env.FILE_STORAGE.list({
      prefix: `${sessionId}/`
    })

    const files = objects.objects.map(obj => ({
      id: obj.customMetadata?.fileId || obj.key,
      name: obj.customMetadata?.originalName || obj.key,
      size: obj.size,
      type: obj.httpMetadata?.contentType || 'application/octet-stream',
      uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded,
      url: `/api/file/${obj.customMetadata?.fileId || obj.key}`
    }))

    // 按上传时间排序
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

    return c.json({
      success: true,
      files: files,
      total: files.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('List files error:', error)
    return c.json({
      error: 'Failed to list files',
      message: error.message
    }, 500)
  }
})

export { app as FileHandler }
