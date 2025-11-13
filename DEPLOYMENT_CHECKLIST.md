# Firebase Deployment Pre-Flight Checklist

## 🔍 Pre-Deployment Verification

- [ ] **Firebase Project Created**

  - Project ID: `hype-connect-40b04`
  - Check: https://console.firebase.google.com

- [ ] **Firebase CLI Installed**

  ```powershell
  firebase --version
  ```

- [ ] **Authenticated with Firebase**

  ```powershell
  firebase login
  ```

- [ ] **Environment Variables Set**

  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
  - [ ] `FIREBASE_ADMIN_PRIVATE_KEY`
  - [ ] `PAYSTACK_PUBLIC_KEY`
  - [ ] `PAYSTACK_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL`

- [ ] **Dependencies Installed**

  ```powershell
  npm install
  ```

- [ ] **Code Builds Locally**

  ```powershell
  npm run build
  ```

  - [ ] No errors in build output
  - [ ] `.next` folder created

- [ ] **Firestore Rules Updated**

  - [ ] `firestore.rules` configured
  - [ ] Test rules are appropriate for production

- [ ] **Storage Rules Updated**

  - [ ] `storage.rules` configured
  - [ ] Public/private access correct

- [ ] **Sensitive Data Removed**

  - [ ] No API keys in source code
  - [ ] No passwords committed
  - [ ] `.env.local` in `.gitignore`

- [ ] **Performance Optimized**

  - [ ] Images optimized
  - [ ] Large dependencies removed if possible
  - [ ] Dead code cleaned up

- [ ] **Security Verified**
  - [ ] CORS configured correctly
  - [ ] Admin endpoints protected
  - [ ] User data validation in place

---

## 🚀 Deployment Steps

### Step 1: Final Build Check

```powershell
npm run build
```

Expected: No errors, `.next` folder present

### Step 2: Verify Firebase Connection

```powershell
firebase projects:list
firebase use hype-connect-40b04
```

### Step 3: Preview Deployment (Optional)

```powershell
firebase hosting:channel:deploy preview-$(Get-Date -Format yyyy-MM-dd-HHmmss)
```

This creates a preview URL without affecting production.

### Step 4: Deploy to Production

```powershell
firebase deploy
```

Or use the automated script:

```powershell
.\deploy.ps1
```

### Step 5: Verify Deployment

```powershell
firebase hosting:list
```

---

## ✅ Post-Deployment Verification

- [ ] **App is Live**

  - [ ] Visit Firebase Console → App Hosting
  - [ ] Copy the deployment URL
  - [ ] Test in browser

- [ ] **Core Features Working**

  - [ ] Authentication works
  - [ ] Firestore reads/writes work
  - [ ] Storage access works
  - [ ] API endpoints respond
  - [ ] Admin dashboard accessible
  - [ ] Payments processing works

- [ ] **Performance Acceptable**

  - [ ] Page load time < 3 seconds
  - [ ] No console errors
  - [ ] Images loading properly

- [ ] **Monitoring Setup**

  - [ ] Check Firebase Console → Monitoring
  - [ ] Error rates normal
  - [ ] No CPU throttling

- [ ] **Logs Accessible**
  ```powershell
  firebase hosting:log
  firebase functions:log
  ```

---

## 🔧 Common Issues & Solutions

| Issue                        | Solution                                          |
| ---------------------------- | ------------------------------------------------- |
| "Project not found"          | Run `firebase use hype-connect-40b04`             |
| Build fails                  | Check for TypeScript errors: `npm run typecheck`  |
| 502 Bad Gateway              | Check Server Actions are working, verify env vars |
| Firebase rules errors        | Update `firestore.rules` and `storage.rules`      |
| Environment vars not working | Set them in Firebase Console Settings             |
| Slow cold starts             | Increase `maxInstances` in `apphosting.yaml`      |

---

## 📊 Monitoring After Deployment

### Real-Time Logs

```powershell
firebase hosting:log -n 100
```

### Check Deployment Status

```powershell
firebase deploy:list
```

### Rollback (If Needed)

```powershell
firebase hosting:disable
```

### View Project Dashboard

https://console.firebase.google.com/project/hype-connect-40b04/overview

---

## 💰 Estimated Costs

### Firebase App Hosting

- **Backend instance**: $0.50/month (always on)
- **CPU (vCPU-hours)**: $0.000008 per vCPU-hour
- **Memory (GiB-hours)**: $0.00001 per GiB-hour
- **Build minutes**: $0.0075 per build minute

### Firestore

- **Reads**: $0.06 per 100k reads
- **Writes**: $0.18 per 100k writes
- **Deletes**: $0.02 per 100k deletes
- **Storage**: $0.18 per GiB

**Estimated monthly**: $5-20 (depending on usage)

---

## 🎯 Next Steps After Deployment

1. **Set Up Custom Domain**

   - Go to Firebase Console → App Hosting → Domains
   - Add your custom domain

2. **Enable CI/CD**

   - Connect GitHub repository
   - Auto-deploy on push to main

3. **Set Up Alerts**

   - Firebase Console → Monitoring → Alerts
   - Get notified of errors/issues

4. **Monitor Performance**

   - Use Firebase Performance Monitoring
   - Track user experience metrics

5. **Backup Data**
   - Regular Firestore backups
   - Export important data periodically

---

## 📚 Useful Resources

- [Firebase App Hosting Docs](https://firebase.google.com/docs/app-hosting)
- [Next.js Deployment on Firebase](https://nextjs.org/docs/app/building-your-application/deploying)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
