# 🚀 Deploy BusMitra to Render

This guide will help you deploy your BusMitra React app to Render for free.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
3. **API Keys**: You'll need your Firebase and TomTom API keys

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub with these files:
- ✅ `render.yaml` (deployment configuration)
- ✅ `.gitignore` (excludes sensitive files)
- ✅ `package.json` (with build scripts)

### 2. Create Render Account & Connect GitHub

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 3. Deploy Your App

#### Option A: Using render.yaml (Recommended)
1. In Render dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"**

#### Option B: Manual Configuration
1. In Render dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect your GitHub repository
4. Configure manually:
   - **Name**: `busmitra-user`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: `18` (or latest)

### 4. Configure Environment Variables

In your Render service settings, add these environment variables:

#### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

#### TomTom API
```
VITE_TOMTOM_API_KEY=your_free_tomtom_api_key_here
```

### 5. Deploy

1. Click **"Create Static Site"**
2. Render will automatically:
   - Install dependencies (`npm ci`)
   - Build your app (`npm run build`)
   - Deploy the `dist` folder
3. Your app will be available at: `https://your-app-name.onrender.com`

## 🔑 Getting API Keys

### Firebase Setup (FREE)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to Project Settings > General
4. Scroll to "Your apps" and add a web app
5. Copy the configuration values

### TomTom API (FREE - 2500 requests/day)
1. Go to [TomTom Developer Portal](https://developer.tomtom.com/)
2. Sign up for a free account
3. Create a new app
4. Get your API key from app details

## 🚨 Important Notes

### Free Tier Limits
- **Render**: 750 hours/month (enough for small apps)
- **TomTom**: 2500 requests/day
- **Firebase**: Generous free tier

### Security
- ✅ Never commit `.env` files to Git
- ✅ Use Render's environment variables for secrets
- ✅ All API keys are prefixed with `VITE_` for client-side access

### Performance
- Your app will be served as a static site (very fast)
- Automatic HTTPS enabled
- Global CDN included

## 🔄 Automatic Deployments

Once set up, Render will automatically deploy when you:
- Push to your main branch
- Merge pull requests
- Manually trigger deployments

## 🛠️ Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure build command works locally: `npm run build`
- Check Render build logs for specific errors

### Environment Variables
- Make sure all `VITE_` prefixed variables are set
- Variables are case-sensitive
- Restart deployment after adding new variables

### App Not Loading
- Check browser console for errors
- Verify API keys are correct
- Ensure Firebase project is properly configured

## 📱 Testing Your Deployment

1. Visit your Render URL
2. Test all major features:
   - Bus search functionality
   - Map integration
   - Firebase authentication
   - Location services

## 🎉 Success!

Your BusMitra app is now live on Render! 

**Next Steps:**
- Set up a custom domain (optional)
- Monitor usage in Render dashboard
- Set up monitoring and alerts

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Firebase Support**: [firebase.google.com/support](https://firebase.google.com/support)
- **TomTom Support**: [developer.tomtom.com/support](https://developer.tomtom.com/support)

---

**Happy Deploying! 🚀**
