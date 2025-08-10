#!/bin/bash

# ChatAI Workers 部署脚本
# 一键部署到 Cloudflare Workers

set -e

echo "🚀 开始部署 ChatAI Workers..."

# 检查必要的工具
check_dependencies() {
    echo "📋 检查依赖..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi
    
    echo "✅ 依赖检查完成"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    npm install
    
    # 安装 wrangler (如果没有)
    if ! command -v wrangler &> /dev/null; then
        echo "📦 安装 Wrangler CLI..."
        npm install -g wrangler
    fi
    
    echo "✅ 依赖安装完成"
}

# 配置环境
setup_environment() {
    echo "⚙️  配置环境..."
    
    # 检查是否已登录 Cloudflare
    if ! wrangler whoami &> /dev/null; then
        echo "🔐 请登录 Cloudflare..."
        wrangler login
    fi
    
    # 检查配置文件
    if [ ! -f "wrangler.toml" ]; then
        echo "❌ wrangler.toml 配置文件不存在"
        exit 1
    fi
    
    echo "✅ 环境配置完成"
}

# 创建 KV 存储
create_kv_storage() {
    echo "🗄️  创建 KV 存储..."
    
    # 创建生产环境 KV
    PROD_KV_ID=$(wrangler kv:namespace create "CHAT_STORAGE" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    # 创建预览环境 KV
    PREVIEW_KV_ID=$(wrangler kv:namespace create "CHAT_STORAGE" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    echo "📝 请更新 wrangler.toml 中的 KV namespace ID:"
    echo "   生产环境 ID: $PROD_KV_ID"
    echo "   预览环境 ID: $PREVIEW_KV_ID"
    
    # 自动更新 wrangler.toml
    if command -v sed &> /dev/null; then
        sed -i.bak "s/id = \"your-kv-namespace-id\"/id = \"$PROD_KV_ID\"/" wrangler.toml
        sed -i.bak "s/preview_id = \"your-preview-kv-namespace-id\"/preview_id = \"$PREVIEW_KV_ID\"/" wrangler.toml
        echo "✅ wrangler.toml 已自动更新"
    fi
}

# 创建 R2 存储
create_r2_storage() {
    echo "📁 创建 R2 存储..."
    
    # 创建 R2 bucket
    wrangler r2 bucket create chatai-files || echo "⚠️  R2 bucket 可能已存在"
    wrangler r2 bucket create chatai-files-preview || echo "⚠️  R2 preview bucket 可能已存在"
    
    echo "✅ R2 存储创建完成"
}

# 设置环境变量
setup_secrets() {
    echo "🔐 设置环境变量..."
    echo "支持多密钥轮换，用逗号分隔多个密钥"
    echo "示例: key1,key2,key3"
    echo ""

    # 国外AI平台
    echo "=== 国外AI平台 ==="

    # OpenAI API Keys
    read -p "OpenAI API Keys (多个用逗号分隔，可选): " OPENAI_KEYS
    if [ ! -z "$OPENAI_KEYS" ]; then
        echo "$OPENAI_KEYS" | wrangler secret put OPENAI_API_KEYS
    fi

    # Anthropic API Keys
    read -p "Anthropic API Keys (多个用逗号分隔，可选): " ANTHROPIC_KEYS
    if [ ! -z "$ANTHROPIC_KEYS" ]; then
        echo "$ANTHROPIC_KEYS" | wrangler secret put ANTHROPIC_API_KEYS
    fi

    # Gemini API Keys
    read -p "Gemini API Keys (多个用逗号分隔，可选): " GEMINI_KEYS
    if [ ! -z "$GEMINI_KEYS" ]; then
        echo "$GEMINI_KEYS" | wrangler secret put GEMINI_API_KEYS
    fi

    echo ""
    echo "=== 中国国内AI平台 ==="

    # 通义千问 API Keys
    read -p "通义千问 API Keys (多个用逗号分隔，可选): " QWEN_KEYS
    if [ ! -z "$QWEN_KEYS" ]; then
        echo "$QWEN_KEYS" | wrangler secret put QWEN_API_KEYS
    fi

    # 百度文心一言 API Keys
    read -p "百度文心一言 API Keys (格式: client_id:secret，多个用逗号分隔，可选): " BAIDU_KEYS
    if [ ! -z "$BAIDU_KEYS" ]; then
        echo "$BAIDU_KEYS" | wrangler secret put BAIDU_API_KEYS
    fi

    # 智谱AI API Keys
    read -p "智谱AI API Keys (多个用逗号分隔，可选): " ZHIPU_KEYS
    if [ ! -z "$ZHIPU_KEYS" ]; then
        echo "$ZHIPU_KEYS" | wrangler secret put ZHIPU_API_KEYS
    fi

    # 月之暗面 API Keys
    read -p "月之暗面 API Keys (多个用逗号分隔，可选): " MOONSHOT_KEYS
    if [ ! -z "$MOONSHOT_KEYS" ]; then
        echo "$MOONSHOT_KEYS" | wrangler secret put MOONSHOT_API_KEYS
    fi

    # DeepSeek API Keys
    read -p "DeepSeek API Keys (多个用逗号分隔，可选): " DEEPSEEK_KEYS
    if [ ! -z "$DEEPSEEK_KEYS" ]; then
        echo "$DEEPSEEK_KEYS" | wrangler secret put DEEPSEEK_API_KEYS
    fi

    # MiniMax API Keys
    read -p "MiniMax API Keys (多个用逗号分隔，可选): " MINIMAX_KEYS
    if [ ! -z "$MINIMAX_KEYS" ]; then
        echo "$MINIMAX_KEYS" | wrangler secret put MINIMAX_API_KEYS
    fi

    echo ""
    echo "✅ 环境变量设置完成"
    echo "💡 提示: 系统会自动在密钥间轮换，确保服务稳定性"
}

# 部署到开发环境
deploy_development() {
    echo "🚧 部署到开发环境..."
    wrangler deploy --env development
    echo "✅ 开发环境部署完成"
}

# 部署到生产环境
deploy_production() {
    echo "🚀 部署到生产环境..."
    wrangler deploy --env production
    echo "✅ 生产环境部署完成"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "📋 部署信息:"
    echo "   Workers URL: https://chatai-workers.your-subdomain.workers.dev"
    echo "   管理面板: https://dash.cloudflare.com/"
    echo ""
    echo "📝 下一步:"
    echo "   1. 更新前端项目中的 NEXT_PUBLIC_CHATAI_WORKER_URL 环境变量"
    echo "   2. 在 Cloudflare 面板中配置自定义域名（可选）"
    echo "   3. 测试 ChatAI 功能"
    echo ""
    echo "🔧 有用的命令:"
    echo "   查看日志: wrangler tail"
    echo "   本地开发: wrangler dev"
    echo "   更新部署: wrangler deploy"
}

# 主函数
main() {
    echo "🤖 ChatAI Workers 部署工具"
    echo "=========================="
    
    # 检查参数
    ENVIRONMENT=${1:-"development"}
    
    if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
        echo "❌ 无效的环境参数。使用: development 或 production"
        exit 1
    fi
    
    echo "🎯 目标环境: $ENVIRONMENT"
    echo ""
    
    # 执行部署步骤
    check_dependencies
    install_dependencies
    setup_environment
    
    # 询问是否创建资源
    read -p "是否需要创建 KV 和 R2 存储？(y/N): " CREATE_RESOURCES
    if [[ $CREATE_RESOURCES =~ ^[Yy]$ ]]; then
        create_kv_storage
        create_r2_storage
    fi
    
    # 询问是否设置环境变量
    read -p "是否需要设置 API Keys？(y/N): " SETUP_SECRETS
    if [[ $SETUP_SECRETS =~ ^[Yy]$ ]]; then
        setup_secrets
    fi
    
    # 部署
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_production
    else
        deploy_development
    fi
    
    show_deployment_info
}

# 运行主函数
main "$@"
