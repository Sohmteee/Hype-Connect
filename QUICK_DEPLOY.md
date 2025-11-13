# Hype-Connect Quick Start - Firebase Deployment

## 🚀 Quick Deploy (5 Minutes)

### Prerequisites

- Node.js 18+ installed
- Firebase account created
- Firebase project: `hype-connect-40b04`

### Deploy Now

**Option 1: Automated Script (Recommended)**

```powershell
.\deploy.ps1
```

This handles everything: authentication, build, and deployment.

**Option 2: Manual Steps**

```powershell
# 1. Authenticate
firebase login

# 2. Set project
firebase use hype-connect-40b04

# 3. Install & build
npm install
npm run build

# 4. Deploy
firebase deploy
```

---

## ✅ What Gets Deployed

- **Next.js App**: Hosted on Firebase App Hosting
- **Firestore Database**: Rules deployed from `firestore.rules`
- **Storage Bucket**: Rules deployed from `storage.rules`
- **API Routes**: All your `/api` endpoints
- **Server Actions**: All your server-side functions

---

## 🌐 After Deployment

Your app will be available at:

```
https://hype-connect-40b04-<hash>.firebase.com
```

Find your exact URL in Firebase Console → App Hosting → Backends

---

## 📋 Deployment Checklist

Before deploying, ensure:

- ✅ All environment variables are set
- ✅ `npm run build` completes without errors
- ✅ Firebase CLI is authenticated
- ✅ No sensitive data in code

See `DEPLOYMENT_CHECKLIST.md` for detailed verification steps.

---

## 🔧 Common Commands

```powershell
# View deployment status
firebase deploy:list

# Check logs
firebase hosting:log

# Redeploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules

# Monitor in real-time
firebase functions:log
```

---

## 💡 Tips

1. **Test Locally First**

   ```powershell
   npm run dev
   # Visit http://localhost:9002
   ```

2. **Preview Before Production**

   ```powershell
   firebase hosting:channel:deploy preview-v1
   ```

   This creates a unique preview URL.

3. **Monitor After Deploy**

   - Check Firebase Console → Monitoring
   - Watch for errors in logs

4. **Scale if Needed**
   - Edit `apphosting.yaml` to increase `maxInstances`
   - Re-deploy: `firebase deploy`

---

## 🆘 Issues?

**"Build failed"**
→ Run locally: `npm run build` and fix errors

**"Firebase not authenticated"**
→ Run: `firebase login`

**"502 errors after deploy"**
→ Check environment variables in Firebase Console
→ Check logs: `firebase hosting:log`

---

See `FIREBASE_HOSTING_GUIDE.md` for comprehensive documentation.
