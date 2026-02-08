# 🎙️ 机场广播系统 | Airport Broadcast System

支持中文 / English / 闽南语的机场广播管理系统

A multi-language airport broadcast management system supporting Chinese, English, and Hokkien (Min Nan).

## ✨ 功能特点 | Features

- 📻 **分类管理** - 登机广播、三超行李、延误通知、安检提醒、通用广播
- 🌐 **三语支持** - 中文 / English / 闽南语
- 🎵 **音频播放器** - 播放进度、音量控制、上一首/下一首
- ➕ **添加广播** - 可上传三种语言的音频文件
- 🔍 **搜索过滤** - 按名称搜索、按语言筛选
- 📱 **响应式设计** - 完美适配手机和桌面端
- 💾 **本地存储** - 数据保存在浏览器 localStorage

## 🚀 一键部署 | Deploy

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chocolate-bot/airport-broadcast)

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chocolate-bot/airport-broadcast)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/chocolate-bot/airport-broadcast)

## 📦 本地运行 | Run Locally

```bash
# 克隆仓库
git clone https://github.com/chocolate-bot/airport-broadcast.git
cd airport-broadcast

# 使用任意静态服务器运行
python3 -m http.server 8080
# 或
npx serve .
```

然后访问 http://localhost:8080

## 📁 项目结构 | Structure

```
airport-broadcast/
├── index.html    # 主页面
├── styles.css    # 样式文件
├── app.js        # 应用逻辑
└── README.md     # 说明文档
```

## 🎯 使用方法 | Usage

1. 点击 **添加广播** 按钮
2. 输入广播名称，选择分类
3. 为每种语言上传对应音频文件
4. 点击广播卡片播放，或点击语言标签播放指定语言版本

## 📝 License

MIT
