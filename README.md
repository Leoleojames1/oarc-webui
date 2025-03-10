<p align="center">
  <img src="icons/oarc_webui.jpg" alt="OARC LOGO" width="250"/>
</p>
<p align="center">
  <a href="https://ko-fi.com/theborch"><img src="icons/buy me a coffee button.png" height="48"></a>
  <a href="https://discord.gg/mNeQZzBHuW"><img src="icons/Discord button.png" height="48"></a>
</p>

# 🌐 OARC-WebUI 🖥️ V0.1.0
***[🦙 Ollama Discord Server 🦙](https://discord.gg/ollama)*** 

***[C-3P0 Demo](https://vimeo.com/1022776731?share=copy)*** ***[snake demo](https://vimeo.com/manage/videos/1036385433)***

## About
**OARC-WebUI** is a modern web interface for the Ollama Agent Roll Cage (OARC) framework, built with Next.js 14 and shadcn/ui. It provides a sleek, responsive frontend for interacting with OARC's powerful local AI capabilities including chat, speech-to-text, text-to-speech, and vision features. Now with markdown code rendering, as well as LaTeX mathematics formulas, just say "please use latex to explain..." or "please code me a python script for a transformers chatbot that ...." you'll get the hang of it :) welp! I off for vacation, I will fix the broken tts beta branch when I get back. Best of luck!

<p align="center">
  <img src="icons/oarc_webui1.png" alt="OARC LOGO" width="1000"/>
</p>

## Features
- 🎨 Modern, responsive UI built with Next.js 14 and shadcn/ui
- 💬 Real-time chat interface with streaming responses
- 🎙️ Integrated speech recognition and text-to-speech
- 👁️ Vision model integration with LLaVA
- 📊 Customizable dashboard with draggable components
- 🎭 Avatar visualization with lip sync support (not ready)
- 🌗 Dark/Light theme switching
- ⚡ WebSocket-based real-time communication

## Prerequisites
- Node.js 18+
- OARC Python API Server running locally
- Ollama installed with desired models

## Quick Start
1. Step one, install [ollama_agent_roll_cage](https://github.com/Leoleojames1/ollama_agent_roll_cage)

2. Step two, bring the roll cage to life with oarc-webui
```bash
# Clone the repository
git clone https://github.com/Leoleojames1/oarc-webui.git

# Install dependencies
cd oarc-next
npm install

# Start the development server
npm run dev
