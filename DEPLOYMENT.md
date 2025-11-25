# 🚀 CodeCanvas Deployment Guide

This guide will help you deploy your CodeCanvas application to **Render** for free.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free)
3. **MongoDB Atlas** - Already configured in your `.env` file ✅

## 🎯 Deployment Overview

We'll deploy two services:
1. **Backend** (Node.js/Express + Socket.IO)
2. **Frontend** (React/Vite static site)

---

## 📦 Step 1: Prepare Your Repository

### 1.1 Push to GitHub

If you haven't already, push your code to GitHub:

```bash
cd /home/harsh/Desktop/CodeCanvas
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 1.2 Verify Files

Ensure these files exist in your repository:
- ✅ `render.yaml` (deployment configuration)
- ✅ `backend/server.js`
- ✅ `backend/package.json`
- ✅ `frontend/package.json`
- ✅ `frontend/.env.production`

> [!IMPORTANT]
> **Do NOT commit** your `backend/.env` file! It contains sensitive credentials.

---

## 🔧 Step 2: Deploy Backend to Render

### 2.1 Create Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   | Field | Value |
   |-------|-------|
   | **Name** | `codecanvas-backend` (or your choice) |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | `Free` |

### 2.2 Add Environment Variables

In the **Environment** section, add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://codecanvas:8520@cluster0.tot4jxt.mongodb.net/codecanvas?appName=Cluster0` |
| `JWT_SECRET` | `bb02f2e6907eee6ff9ba4a6d376b31b5` |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | Leave empty for now (we'll add this after frontend deployment) |

> [!CAUTION]
> Keep your `JWT_SECRET` and `MONGODB_URI` secure! Consider regenerating the JWT secret for production.

### 2.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL: `https://codecanvas-backend-XXXX.onrender.com`

> [!NOTE]
> Free tier services may spin down after inactivity. First request might take 50+ seconds.

---

## 🎨 Step 3: Deploy Frontend to Render

### 3.1 Update Frontend Environment

Before deploying frontend, update `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

Replace `your-backend-url.onrender.com` with your actual backend URL from Step 2.3.

**Commit this change:**
```bash
git add frontend/.env.production
git commit -m "Update production API URLs"
git push
```

### 3.2 Create Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select your GitHub repository
3. Configure the service:

   | Field | Value |
   |-------|-------|
   | **Name** | `codecanvas-frontend` (or your choice) |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

### 3.3 Add Environment Variables (Optional)

If you want to override environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend URL |
| `VITE_SOCKET_URL` | Your backend URL |

### 3.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. Copy your frontend URL: `https://codecanvas-frontend-XXXX.onrender.com`

---

## 🔄 Step 4: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go to your backend service in Render
2. Navigate to **Environment** tab
3. Add/Update the `FRONTEND_URL` variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-frontend-url.onrender.com` (your actual frontend URL)
4. Click **"Save Changes"**
5. The backend will automatically redeploy

---

## ✅ Step 5: Test Your Deployment

### 5.1 Test Backend Health

Visit: `https://your-backend-url.onrender.com`

You should see:
```json
{
  "message": "CodeCanvas Backend is running!",
  "version": "3.0.0",
  "status": "healthy"
}
```

### 5.2 Test Frontend

1. Visit: `https://your-frontend-url.onrender.com`
2. Test these features:
   - ✅ User registration/login
   - ✅ Create a new room
   - ✅ Join a room
   - ✅ Real-time code editing
   - ✅ Chat functionality
   - ✅ WebSocket connection (check browser console)

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to backend"

**Solution:**
- Check browser console for CORS errors
- Verify `FRONTEND_URL` is set correctly in backend environment
- Ensure both services are running (not sleeping)

### Issue: "WebSocket connection failed"

**Solution:**
- Verify `VITE_SOCKET_URL` in frontend `.env.production`
- Check that backend is accessible
- Look for errors in Render backend logs

### Issue: "Authentication not working"

**Solution:**
- Verify `JWT_SECRET` is set in backend environment
- Check MongoDB connection in backend logs
- Ensure `MONGODB_URI` is correct

### Issue: "Backend takes too long to respond"

**Solution:**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 50+ seconds
- Consider upgrading to paid tier for always-on service

### Issue: "Build failed"

**Solution:**
- Check Render build logs for specific errors
- Verify `package.json` scripts are correct
- Ensure all dependencies are listed in `package.json`

---

## 📊 Monitoring Your Deployment

### View Logs

1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. Monitor real-time logs for errors

### Check Metrics

1. Navigate to **"Metrics"** tab
2. View:
   - Request count
   - Response times
   - Memory usage
   - CPU usage

---

## 🔄 Updating Your Deployment

### Auto-Deploy (Recommended)

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push
```

Render will automatically rebuild and redeploy! 🎉

### Manual Deploy

1. Go to your service in Render Dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Cost & Limits (Free Tier)

| Resource | Limit |
|----------|-------|
| **Bandwidth** | 100 GB/month |
| **Build Minutes** | 500 minutes/month |
| **Services** | Unlimited |
| **Sleep After** | 15 minutes inactivity |
| **Cold Start** | ~50 seconds |

> [!TIP]
> To keep your service awake, use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 10 minutes.

---

## 🚀 Alternative Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

**Pros:**
- Faster frontend deployments
- Better CDN for static assets
- Vercel's excellent DX

**Cons:**
- Need to manage two platforms

### Option 2: Railway

**Pros:**
- Simpler setup
- Better free tier performance
- Built-in database options

**Cons:**
- Limited free tier ($5 credit/month)

### Option 3: Netlify (Frontend) + Railway (Backend)

**Pros:**
- Netlify's excellent frontend features
- Railway's simplicity

**Cons:**
- Two platforms to manage

---

## 📝 Environment Variables Reference

### Backend Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.onrender.com
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## 🎉 Success!

Your CodeCanvas application is now live! Share your deployed URL with others to collaborate in real-time.

**Your URLs:**
- 🎨 Frontend: `https://your-frontend.onrender.com`
- ⚙️ Backend: `https://your-backend.onrender.com`

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Socket.IO Production Best Practices](https://socket.io/docs/v4/performance-tuning/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Render logs for errors
2. Review this troubleshooting section
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

Happy Coding! 🚀
