# Deployment Checklist: Vercel (Frontend) + Render (Backend)

## 1. Pre-Deployment Verification
- [x] Backend syntax verified with `node -c server.js`.
- [x] Client production build succeeds (`npm run build` generates `dist/index.html` and assets).
- [x] Root build script configured (`npm run build` builds client).
- [x] Node engine compatibility set (`>=18.0.0`).
- [x] CORS configured for Vercel domains (`*.vercel.app`), Render domains (`*.onrender.com`), and custom domains.
- [x] MongoDB connection optimized for Atlas pooling, timeouts, and IP whitelist diagnostics.
- [x] Frontend `api.js` automatically detects and formats `VITE_API_URL` (whether with or without `/api/v1` or trailing slashes).
- [x] `vercel.json` configured for SPA routing.
- [x] `render.yaml` configured with health check `/health` and production environment variables.

---

## 2. MongoDB Atlas Configuration
1. Open [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Network Access**:
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. (Required for Render servers as dynamic IPs change).
3. Go to **Database Access**:
   - Create a database user (e.g. `uniassist_admin`).
   - Assign **Read and write to any database** privileges.
   - Note the password (avoid special characters like `@` or `:`, or URL-encode them).
4. Go to **Database** -> Click **Connect** -> Choose **Drivers (Node.js)**:
   - Copy connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/uniassist_db?retryWrites=true&w=majority&appName=Cluster0`

---

## 3. Backend Deployment (Render)
1. Push your code to your GitHub repository.
2. Log in to [Render](https://render.com).
3. Click **New +** -> Select **Web Service** (or Blueprint to use `render.yaml`).
4. Select your GitHub repository.
5. Configure Settings:
   - **Name:** `uniassist-backend`
   - **Region:** Choose closest to your database (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** Leave empty (root)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = your Atlas connection string from Step 2
   - `JWT_SECRET` = (Render can auto-generate or use a strong 32+ char secret)
   - `JWT_REFRESH_SECRET` = (Render can auto-generate or use a strong 32+ char secret)
   - `CLIENT_URL` = `https://<your-vercel-app-name>.vercel.app` (Can be added after frontend deployment or updated)
   - `AZURE_OPENAI_ENDPOINT` = (Optional / if Azure AI enabled)
   - `AZURE_OPENAI_API_KEY` = (Optional / if Azure AI enabled)
   - `AZURE_OPENAI_DEPLOYMENT_NAME` = `gpt-4o-mini`
7. Click **Create Web Service**.
8. Wait for deploy logs to show:
   `[UniAssist AI Backend Running] Mode: production | Port: 10000`
   `[MongoDB Connected] Host: ... | Database: uniassist_db`
9. Copy your Render Backend URL:
   `https://uniassist-backend.onrender.com`

---

## 4. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository.
4. Configure Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client` (or leave as root since root `vercel.json` is provided)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-backend-name>.onrender.com/api/v1`
     *(Replace with your actual Render service URL from Step 3)*
6. Click **Deploy**.
7. In ~60 seconds, your site will be live at:
   `https://<your-project>.vercel.app`

---

## 5. Post-Deployment Smoke Test
1. Visit `https://<your-backend-name>.onrender.com/health` -> Expect `{ "status": "healthy" }`.
2. Visit `https://<your-project>.vercel.app` -> App loads smoothly.
3. Register a test user or login with teacher/student credentials.
4. Verify student/teacher dashboard loads data from MongoDB without CORS errors in DevTools Console.
