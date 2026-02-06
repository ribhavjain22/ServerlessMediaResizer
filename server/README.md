# PDF Resizer Service

This is a Python/Flask service designed to be deployed on Render. It handles PDF compression using Ghostscript with support for target file sizes.

## Local Development

1.  **Install Prerequisites**:
    - Python 3.9+
    - Ghostscript (Must be installed on your system and in PATH)

    *On Windows (using Chocolatey)*: `choco install ghostscript`
    *On macOS*: `brew install ghostscript`

2.  **Install Python Dependencies**:
    ```bash
    cd server
    pip install -r requirements.txt
    ```

3.  **Run the Server**:
    ```bash
    python app.py
    ```
    The server will start on `http://localhost:5000`.

## Deployment to Render

1.  Create a new **Web Service** on Render.
2.  Connect your repository.
3.  **Settings**:
    - **Root Directory**: `server`
    - **Runtime**: **Python 3**
    - **Build Command**: `pip install -r requirements.txt && pip install gunicorn` 
      *(Note: Render needs gunicorn installed here if it's not in requirements.txt)*
    - **Start Command**: `gunicorn app:app`
4.  **Environment Variables**:
    - No special variables required for basic functionality.
5.  **Deploy**: Render will install dependencies and start the service.

## Frontend Connection

In your frontend project (Vercel), set the environment variable:
`VITE_PDF_SERVICE_URL=https://your-render-service-name.onrender.com`

For local development, create a `.env.local` file in the root:
```
VITE_PDF_SERVICE_URL=http://localhost:5000
```
