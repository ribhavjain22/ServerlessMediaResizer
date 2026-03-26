# Serverless Media Resizer

Next.js + React rebuild of the media resizer with:

- a fully client-side image converter
- a new PDF compression service exposed through a Next.js route handler
- a glossy Apple-inspired UI

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product shape

- **Image converter** stays browser-native for privacy and speed.
- **PDF compressor** runs through `/api/pdf/compress`.
- Compression modes are explicit:
  - `preserve`
  - `balanced`
  - `maximum`

## Deployment

### Vercel

This app is ready for a standard Next.js deployment on Vercel.

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output: managed by Vercel automatically

A minimal [`vercel.json`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/vercel.json) is included, but Vercel can deploy this repo with its defaults.

### Render

This app can also run as a Node web service on Render.

- Runtime: `Node`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Node version: `20`

A ready-to-use [`render.yaml`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/render.yaml) is included for blueprint-based setup.

## MCP note

You shared MCP configs for Vercel and Render, but those MCP servers are not registered in this Codex session, so I could not invoke them directly from here. Once they are available in-session, this repo is ready to deploy through either provider.

## Notes

- The PDF service is rebuilt from scratch around a clean request/response contract.
- This version intentionally removes the old Vue, Flask, Ghostscript, and duplicate scaffold code.
