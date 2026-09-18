# CareLink AI Chatbot — AWS Lambda Function

This directory contains the AWS Lambda backend for the CareLink AI Help Center chatbot.

## Files

- `lambda/index.mjs` — The Lambda function handler (Node.js 18+ / ESM).
- `lambda/carelinkAI.json` — CareLink AI Assistant Knowledge Base and prompt rules.

---

## AWS Lambda Configuration

### 1. Environment Variables
In the AWS Lambda Console, navigate to **Configuration → Environment variables** and configure:

| Variable | Recommended Value | Description |
|---|---|---|
| `NIM_API_KEY` | `nvapi-...` *(your key)* | Your NVIDIA NIM API key (also supports `LLM_API_KEY`, `NVIDIA_API_KEY`, or `API_KEY`). |
| `NIM_MODEL` | `meta/llama-3.2-11b-vision-instruct` | *(Optional, defaults to `meta/llama-3.2-11b-vision-instruct`)*. |
| `NIM_HOST` | `integrate.api.nvidia.com` | *(Optional, defaults to `integrate.api.nvidia.com`)*. |

### 2. Runtime
- **Runtime**: Node.js 18.x, 20.x, or 22.x
- **Handler**: `index.handler`

### 3. Function URL & CORS
If using AWS Lambda Function URL:
- Auth type: `NONE`
- CORS is handled automatically by `index.mjs` (including `OPTIONS` preflight requests).

---

## What was fixed

1. **API Key from Environment Variable**: Removed reliance on AWS Secrets Manager and the localhost:2773 Extension layer, reading directly from `process.env.NIM_API_KEY`.
2. **CORS Preflight (`OPTIONS`)**: Added handling for HTTP `OPTIONS` requests so browser `fetch()` preflight does not fail with CORS errors.
3. **Response Key Compatibility**: Returns `{ reply, message, model }` matching React frontend expectations (`data.reply` in `src/services/aiService.js`).
4. **Conversation History**: Supports multi-turn conversation context passed from React.
5. **Knowledge Base Integration**: Automatically loads instructions and safety rules from `carelinkAI.json`.

