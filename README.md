# Ollama Chat Website Template

A clean, responsive AI chat website powered by models installed on your local Ollama instance.

## Features

- Model selector populated from your installed Ollama models
- Refresh button to reload the model list
- Chat with the selected model
- Press **Enter** to send and **Shift + Enter** for a new line
- Streaming responses with a three-dot thinking indicator
- Automatic scrolling as new response text arrives
- New chat button
- Responsive dark interface

## Requirements

- Node.js 20+
- [Ollama](https://ollama.com/) installed and running

## Run locally

1. Install and start Ollama.
2. Pull a model, for example:

   ```bash
   ollama pull llama3.2
   ```

3. Install dependencies and start the website:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000.

The Next.js API routes connect to Ollama at `http://127.0.0.1:11434`. The browser talks to the local website, so you do not need to expose Ollama's API or configure browser CORS for local development.

## Configuration

By default, Ollama is expected at `http://127.0.0.1:11434`. Change that address in:

- `app/api/models/route.ts`
- `app/api/chat/route.ts`

## Deployment note

This template is designed to run on the same machine as Ollama. A remotely hosted deployment cannot access the Ollama instance on a visitor's computer through `127.0.0.1`; for that use case, run a local backend/agent on the user's machine or configure a secure, reachable Ollama gateway. Do not expose Ollama directly to the public internet.

## Production build

```bash
npm run build
npm start
```
