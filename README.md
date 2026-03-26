# Serverless Media Resizer

Next.js + React frontend plus a Python PDF backend with:

- a fully client-side image converter
- a Render-hosted PDF compression service
- a glossy Apple-inspired UI

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Start the PDF backend separately:

```bash
cd server
python -m pip install -r requirements.txt
python app.py
```

Then set:

```bash
NEXT_PUBLIC_PDF_API_URL=http://localhost:10000
```

## Product shape

- **Image converter** stays browser-native for privacy and speed.
- **PDF compressor** calls an external backend configured through `NEXT_PUBLIC_PDF_API_URL`.
- The PDF flow targets the closest result under the selected size cap.

## Deployment

### Vercel

This app is ready for a standard Next.js deployment on Vercel.

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output: managed by Vercel automatically
- Environment variable: `NEXT_PUBLIC_PDF_API_URL=https://your-render-service.onrender.com`

A minimal [`vercel.json`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/vercel.json) is included, but Vercel can deploy this repo with its defaults.

### Render Backend

The PDF compressor should run as a Python web service on Render.

- Runtime: `Python`
- Root directory: `server`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`

A ready-to-use [`render.yaml`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/server/render.yaml) is included for blueprint-based setup.

## MCP note

You shared MCP configs for Vercel and Render, but those MCP servers are not registered in this Codex session, so I could not invoke them directly from here. Once they are available in-session, this repo is ready to deploy through either provider.

## Notes

- Vercel hosts the frontend.
- Render hosts the Python PDF compression service.
- This split is intentional because the stronger PDF path depends on Python libraries that are a poor fit for a plain Vercel function deployment.
