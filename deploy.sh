#!/bin/bash

# 部署脚本 - ECS服务器部署
echo "开始部署项目..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
else
    echo "依赖已存在，跳过安装"
fi

# 编译SCSS
echo "编译SCSS样式..."
npx gulp styles

# 构建生产版本
echo "构建生产版本..."
npm run build

# 复制到Nginx目录
echo "复制文件到Nginx目录..."
sudo cp -r build/* /var/www/html/

echo "部署完成！"
echo "网站已部署到 /var/www/html/"
echo "请访问您的域名查看效果"
