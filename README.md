# Serverless Media Resizer

A split media utility app with:

- a Next.js + React frontend
- a fully client-side image converter
- a Python PDF compression backend
- a glossy Apple-inspired UI

## Live deployment

- Frontend: [https://serverless-media-resizer.vercel.app](https://serverless-media-resizer.vercel.app)
- PDF backend: [https://serverless-media-resizer-pdf.onrender.com](https://serverless-media-resizer-pdf.onrender.com)

## How it works

### Frontend

The UI lives in the root app and is deployed to Vercel.

- Entry: [`app/page.js`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/app/page.js)
- Shell: [`components/app-shell.js`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/components/app-shell.js)
- Styling: [`app/globals.css`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/app/globals.css)

### Image workflow

Images are processed entirely in the browser.

- UI: [`components/image-converter.js`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/components/image-converter.js)
- Logic: [`lib/image-service.js`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/lib/image-service.js)

Flow:

1. The user uploads an image in the frontend.
2. The browser reads the file and resolves its dimensions locally.
3. Resize and reduction happen client-side with canvas-based processing.
4. The output is downloaded directly from the browser.

This keeps image handling private, fast, and cheap to host.

### PDF workflow

PDFs are processed by the external Python backend on Render.

- UI: [`components/pdf-compressor.js`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/components/pdf-compressor.js)
- API server: [`server/app.py`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/server/app.py)
- Compression engine: [`server/pdf_compress.py`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/server/pdf_compress.py)

Flow:

1. The user uploads a PDF and picks a target size preset such as `Under 1 MB` or `Under 2 MB`.
2. The frontend sends the file to the URL set in `NEXT_PUBLIC_PDF_API_URL`.
3. The Render backend temporarily stores the upload.
4. The Python service runs structural cleanup first, then stronger compression passes only if needed.
5. The service tries to get as close as possible under the requested target instead of over-compressing blindly.
6. The compressed PDF is streamed back to the browser as a download.

## Deployment layout

### Vercel

Vercel hosts the Next.js frontend from the repository root.

- Framework: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Production URL: [https://serverless-media-resizer.vercel.app](https://serverless-media-resizer.vercel.app)
- Required env var: `NEXT_PUBLIC_PDF_API_URL=https://serverless-media-resizer-pdf.onrender.com`

A minimal [`vercel.json`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/vercel.json) is included.

### Render

Render hosts the Python PDF backend from the [`server`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/server) directory.

- Runtime: `Python`
- Root directory: `server`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app --timeout 300`
- Live URL: [https://serverless-media-resizer-pdf.onrender.com](https://serverless-media-resizer-pdf.onrender.com)

A ready-to-use Render blueprint is included at [`server/render.yaml`](/C:/Users/ribha/Documents/GitHub/ServerlessMediaResizer/server/render.yaml).

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

## Notes

- Vercel hosts the frontend.
- Render hosts the Python PDF compression service.
- This split is intentional because the stronger PDF path depends on Python libraries that are a poor fit for a plain Vercel function deployment.
