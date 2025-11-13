# Firebase Hosting Deployment Guide for Hype-Connect

## Current Status ✅
Your project is **partially configured** for Firebase:
- ✅ Firebase project created (`hype-connect-40b04`)
- ✅ Firebase CLI installed
- ✅ `firebase.json` configured
- ✅ `apphosting.yaml` configured
- ✅ Environment variables set up
- ⚠️ Need: Build optimization & deployment

---

## What I've Done For You ✅

### 1. **Updated `apphosting.yaml`** (if needed)
   - Configured for Next.js with optimal settings
   - Set `maxInstances` for scaling

### 2. **Created `.firebaserc` file** (local config)
   - Maps your local development to the Firebase project
   - Ensures correct project deployment

### 3. **Environment Variables Setup**
   - Verified all `NEXT_PUBLIC_*` and `FIREBASE_ADMIN_*` variables are configured
   - Ready for production environment

---

## What You Need To Do ⚠️

### Step 1: Install Firebase Tools (If Not Already Done)
```powershell
npm install -g firebase-tools
```

### Step 2: Authenticate with Firebase
```powershell
firebase login
```
This will open your browser and authenticate your Google account with Firebase.

### Step 3: Verify Project Connection
```powershell
firebase projects:list
```
You should see `hype-connect-40b04` in the list.

### Step 4: Set Active Project
```powershell
firebase use hype-connect-40b04
```

### Step 5: Build the Next.js App
```powershell
npm run build
```
This creates the `.next` folder with optimized production build.

### Step 6: Deploy to Firebase App Hosting
```powershell
firebase deploy
```

This will:
- Deploy to Firebase App Hosting
- Deploy Firestore rules (`firestore.rules`)
- Deploy Storage rules (`storage.rules`)
- Build and serve your Next.js app

---

## Deployment Options 🚀

### Option A: Firebase App Hosting (Recommended)
- **Best for**: Next.js with backend/Server Actions
- **Cost**: $0.50/month per backend instance + usage
- **Auto-scaling**: Yes
- **CI/CD**: Can connect GitHub for auto-deploy on push

**Deploy:**
```powershell
firebase deploy
```

### Option B: Firebase Hosting (Static Only)
- **Best for**: Static sites only
- **Cost**: Free tier available
- **Note**: Won't work well with Server Actions

### Option C: Vercel (Alternative)
- **Best for**: Next.js optimized
- **Cost**: Free tier available
- **Benefit**: Easier Next.js integration

---

## Post-Deployment Checklist ✅

After deploying, verify:

1. **Check Deployment Status**
   ```powershell
   firebase deploy:list
   ```

2. **View Live App**
   - Check Firebase Console: https://console.firebase.google.com
   - Your app URL will be displayed

3. **Monitor Functions & Logs**
   ```powershell
   firebase functions:log
   firebase hosting:log
   ```

4. **Set Up Custom Domain** (Optional)
   - Firebase Console → App Hosting → Domains
   - Connect your domain (e.g., hype-connect.com)

5. **Enable HTTPS** ✅
   - Automatic with Firebase Hosting

6. **Set Up CI/CD** (Optional)
   - Connect GitHub repository
   - Auto-deploy on push to main branch

---

## Environment Variables for Production

Make sure these are set in Firebase Console:

**In Firebase Console → Settings → Environment Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hype-connect-40b04
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>

FIREBASE_ADMIN_CLIENT_EMAIL=<admin-sdk-email>
FIREBASE_ADMIN_PRIVATE_KEY=<admin-sdk-private-key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<paystack-public-key>
PAYSTACK_SECRET_KEY=<paystack-secret-key>
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Troubleshooting 🔧

### Issue: "Project not found"
**Solution:** Run `firebase use hype-connect-40b04`

### Issue: "Permission denied" on Firestore/Storage rules
**Solution:** Update rules in Firebase Console or ensure you're authenticated as project owner

### Issue: Build fails with TypeScript errors
**Solution:** Your `next.config.ts` has `ignoreBuildErrors: true`, so this shouldn't happen

### Issue: 502 Bad Gateway after deployment
**Solution:** 
- Check logs: `firebase functions:log`
- Verify environment variables are set
- Check if Server Actions are working correctly

### Issue: Firestore not accessible from deployed app
**Solution:** Update Firestore rules to allow your domain

---

## Performance Tips 🚀

1. **Enable Caching**
   ```
   Set Cache-Control headers in functions
   ```

2. **Use Firebase CDN**
   - Automatic for static assets
   - Optimizes image delivery

3. **Monitor Backend Instances**
   ```powershell
   firebase deploy:list
   ```

4. **Set Auto-scaling in `apphosting.yaml`**
   ```yaml
   maxInstances: 5  # Increase if needed
   ```

---

## Useful Firebase CLI Commands

```powershell
# Check project
firebase projects:list

# View deployment status
firebase deploy:list

# View live URL
firebase hosting:channel:list

# Delete previous deployments
firebase hosting:delete

# Redeploy specific service
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# View logs in real-time
firebase functions:log
```

---

## Next Steps

1. ✅ Install Firebase CLI
2. ✅ Authenticate: `firebase login`
3. ✅ Set project: `firebase use hype-connect-40b04`
4. ✅ Build: `npm run build`
5. ✅ Deploy: `firebase deploy`
6. ✅ Monitor: Check Firebase Console

---

## Questions?

For more help:
- Firebase Docs: https://firebase.google.com/docs
- Next.js Deployment: https://nextjs.org/docs/app/building-your-application/deploying
- Firebase App Hosting: https://firebase.google.com/docs/app-hosting
