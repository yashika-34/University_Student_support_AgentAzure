# UniAssist AI: Complete Production Deployment Guide
## Deploying MERN Stack + Azure AI Foundry on Vercel, Render & MongoDB Atlas

This guide provides step-by-step instructions to deploy the entire **UniAssist AI** system across production cloud platforms:
- **Frontend (SPA):** [Vercel](https://vercel.com)
- **Backend (API Gateway):** [Render](https://render.com)
- **Database (Replica Set):** [MongoDB Atlas](https://www.mongodb.com/atlas)
- **AI Reasoning & RAG:** [Azure AI Foundry](https://ai.azure.com)

---

## 1. Cloud Architecture Mapping

```
+=====================================================================================+
|                             VERCEL (FRONTEND HOSTING)                               |
|  - Platform: Vercel Edge Network                                                    |
|  - Framework: Vite + React 18 SPA                                                   |
|  - Root Directory: ./client                                                         |
|  - Domain: https://uniassist-client.vercel.app                                      |
|  - Routing: Single Page Rewrites to /index.html via vercel.json                     |
+==========================================+==========================================+
                                           |
                                           | HTTPS REST / SSE Streams
                                           v
+=====================================================================================+
|                             RENDER (BACKEND HOSTING)                                |
|  - Service: Web Service (Node 20 Runtime)                                          |
|  - Domain: https://uniassist-backend.onrender.com                                   |
|  - Root Directory: ./ (Repository Root)                                             |
|  - Build Command: npm install                                                       |
|  - Start Command: npm start                                                         |
|  - Health Check: /health                                                            |
|  - Config: render.yaml Blueprint                                                   |
+======================+===================================+==========================+
                       |                                   |
                       | Mongoose Connection String        | Azure SDK (HTTPS)
                       v                                   v
+=========================================+  +========================================+
|          MONGODB ATLAS CLUSTER          |  |         AZURE AI FOUNDRY SUITE         |
|  - Tier: Shared M0 or Dedicated M10     |  |  - Hub / Project Deployment            |
|  - Whitelist: 0.0.0.0/0 (Render IPs)    |  |  - Model: gpt-4o-mini                  |
|  - DB Name: uniassist_db                |  |  - Azure AI Search (Hybrid RAG)        |
|  - Seeder: npm run seed                 |  |  - Azure Content Safety Guardrails     |
+=========================================+  +========================================+
```

---

## 2. Part 1: MongoDB Atlas Setup

### Step 1: Create Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Click **Create** and select **M0 Free Tier** (or M10+ for dedicated production).
3. Select cloud provider **AWS** or **Azure** in your preferred region (e.g., `us-east-1` or `eastus`).
4. Set Cluster Name to `uniassist-cluster`.

### Step 2: Configure Database User
1. Go to **Security > Database Access > Add New Database User**.
2. Select **Password Authentication**.
3. Username: `uniassist_admin`
4. Password: `StrongPassword123!` (record this securely).
5. Role: **Read and write to any database**.

### Step 3: Configure Network Access (IP Whitelist)
1. Go to **Security > Network Access > Add IP Address**.
2. Render uses dynamic outgoing IP addresses on the free tier. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
3. Click **Confirm**.

### Step 4: Obtain Connection String
1. Go to **Deployments > Database > Connect**.
2. Choose **Drivers** (Node.js version 5.5 or later).
3. Copy the URI string:
   ```
   mongodb+srv://uniassist_admin:<PASSWORD>@uniassist-cluster.mongodb.net/uniassist_db?retryWrites=true&w=majority
   ```
4. Replace `<PASSWORD>` with your database user password and specify `uniassist_db` as the database name.

### Step 5: Seed Cloud Database (Local One-Time Step)
Run the automated seed script locally against your MongoDB Atlas cluster to populate default student, faculty, course, attendance, and FAQ records:
```bash
# In local project root:
# Temporarily set MONGODB_URI in your .env:
MONGODB_URI="mongodb+srv://uniassist_admin:StrongPassword123!@uniassist-cluster.mongodb.net/uniassist_db?retryWrites=true&w=majority"

# Run database seeder:
npm run seed
```

---

## 3. Part 2: Azure AI Foundry Setup

### Step 1: Create Azure AI Foundry Project
1. Log in to [Azure AI Foundry portal](https://ai.azure.com).
2. Click **+ New Project** and assign:
   - Project Name: `uniassist-ai-project`
   - Subscription: Your Azure Subscription
   - Resource Group: `rg-uniassist-prod`
   - Location: `East US` (or preferred Azure region)

### Step 2: Deploy Azure OpenAI Model
1. In your Foundry Project, navigate to **Deployments > + Deploy Model > Deploy Base Model**.
2. Select `gpt-4o-mini`.
3. Set Deployment Name: `gpt-4o-mini`.
4. Leave deployment type as **Standard** and allocate desired TPM (Tokens Per Minute, e.g. 50k TPM).
5. Click **Deploy**.

### Step 3: Provision Azure AI Search (Optional for Document RAG)
1. In the Azure Portal, create an **Azure AI Search** resource (`uniassist-search`).
2. Free (`F`) or Basic (`B`) tier.
3. In Foundry, connect your search resource under **Data + Indexes**.
4. Create Index: `university-knowledge-index`.

### Step 4: Extract Azure Keys & Endpoints
Navigate to **Project Settings > Project API Keys** in Azure AI Foundry:
- **Endpoint:** `https://your-resource-name.openai.azure.com/`
- **API Key:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Deployment Name:** `gpt-4o-mini`
- **API Version:** `2024-02-15-preview`

---

## 4. Part 3: Backend Deployment on Render

The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/HP/OneDrive/Desktop/AzureAi/render.yaml) blueprint.

### Option A: Automatic Deployment via Render Blueprint
1. Push your project code to a **GitHub repository** (e.g. `github.com/your-username/uniassist-ai`).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New > Blueprint**.
4. Select your connected GitHub repository.
5. Render detects `render.yaml` automatically and configures the `uniassist-backend` Web Service.
6. Populate the prompted environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
   - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
7. Click **Apply**.

### Option B: Manual Web Service Setup on Render
If setting up manually without Blueprint:
1. Click **New > Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Name:** `uniassist-backend`
   - **Region:** `Oregon (US West)` or closest to your Atlas cluster
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / root)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. In **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `CLIENT_URL` | `https://uniassist-client.vercel.app` *(update once Vercel URL is created)* |
| `MONGODB_URI` | `mongodb+srv://uniassist_admin:<PASS>@.../uniassist_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | *(Click Generate for a secure 64-char key)* |
| `JWT_EXPIRES_IN` | `1d` |
| `JWT_REFRESH_SECRET` | *(Click Generate for a secure 64-char key)* |
| `JWT_REFRESH_EXPIRES_IN`| `7d` |
| `AZURE_OPENAI_ENDPOINT`| `https://your-resource.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | `your_azure_api_key_here` |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | `gpt-4o-mini` |
| `AZURE_OPENAI_API_VERSION` | `2024-02-15-preview` |

5. Click **Create Web Service**.
6. Wait for the build to finish. Once live, test the health check endpoint:
   ```
   curl https://uniassist-backend.onrender.com/health
   # Expected response: {"status":"healthy","service":"UniAssist AI Backend"}
   ```

---

## 5. Part 4: Frontend Deployment on Vercel

The frontend includes [`client/vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/AzureAi/client/vercel.json) ensuring all SPA client-side routes (`/student/dashboard`, `/attendance`, `/chat`) rewrite to `/index.html` without 404 errors on refresh.

### Step 1: Deploy via Vercel Dashboard
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New > Project**.
3. Import your GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name:** `uniassist-client`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `client` (Critical: do not leave as `./`).
   - **Build Command:** `npm run build` (detected automatically)
   - **Output Directory:** `dist` (detected automatically)
5. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://uniassist-backend.onrender.com/api/v1` *(Your Render backend URL)*
6. Click **Deploy**.

### Step 2: Update Render CORS Configuration
Once Vercel assigns your production domain (e.g., `https://uniassist-client.vercel.app`):
1. Return to **Render Dashboard > uniassist-backend > Environment**.
2. Update `CLIENT_URL` to match your Vercel production domain:
   ```
   CLIENT_URL=https://uniassist-client.vercel.app
   ```
3. Save changes. Render will automatically redeploy the backend with the new CORS origin policy.

---

## 6. End-to-End Verification Checklist

| Verification Task | Test Action | Expected Result |
| :--- | :--- | :--- |
| **1. Backend Health Check** | Visit `https://uniassist-backend.onrender.com/health` | HTTP 200 with `{ "status": "healthy" }` |
| **2. SPA Client-Side Routing** | Visit `https://uniassist-client.vercel.app/attendance` directly in browser | Page loads without Vercel 404 error |
| **3. Seeded Authentication** | Log in with `alex.student@university.edu` / `Password123!` | Success toast; redirects to `/student/dashboard` |
| **4. CORS Handshake** | Inspect browser network tab on login | `Access-Control-Allow-Origin` matches Vercel URL |
| **5. Attendance Simulator** | Adjust simulator slider on Attendance Page | Recomputes percentage live without lag |
| **6. AI Chat Tool Calling** | In `/chat`, ask: *"What is my CS-301 attendance?"* | Agent queries MongoDB and outputs **87.5%** with tool badge |
| **7. Grounded Policy RAG** | In `/chat`, ask: *"What is the attendance debarment rule?"* | Agent cites **Regulation 4.2 (75% minimum threshold)** |
| **8. Support Escalation** | Click **Escalate Ticket** in `/chat` | Generates `#TICK-XXXXXX` and updates chat status in MongoDB |

---

## 7. Troubleshooting & FAQ

### Issue 1: CORS Error (`Access-Control-Allow-Origin`)
- **Cause:** `CLIENT_URL` on Render does not match your Vercel domain.
- **Fix:** In Render environment variables, ensure `CLIENT_URL` has no trailing slash (e.g. `https://uniassist-client.vercel.app`).

### Issue 2: 404 Error when refreshing pages on Vercel
- **Cause:** Vercel treats SPA paths as static files if rewrites are missing.
- **Fix:** Ensure [`client/vercel.json`](file:///c:/Users/HP/OneDrive/Desktop/AzureAi/client/vercel.json) is committed with the `rewrites` rule to `index.html`.

### Issue 3: MongoDB Connection Timeout on Render
- **Cause:** MongoDB Atlas IP access list does not allow Render dynamic IPs.
- **Fix:** In MongoDB Atlas > Network Access, confirm `0.0.0.0/0` is added to the IP Access List.

### Issue 4: Render Free Tier Cold Starts
- **Behavior:** Render free tier instances spin down after 15 minutes of inactivity and take ~45 seconds to wake up on the first request.
- **Recommendation:** Use a free monitor service like [UptimeRobot](https://uptimerobot.com) to ping `https://uniassist-backend.onrender.com/health` every 10 minutes to keep the instance active.
