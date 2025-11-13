# Admin Account Setup Instructions

Follow these steps to create your admin account:
╔════════════════════════════════════════════════════════════════════╗
║ ADMIN ACCOUNT SETUP - Step by Step                                 ║
╚════════════════════════════════════════════════════════════════════╝

CREDENTIALS TO USE:
Email: uscup@neptune.com
Password: h3i1p4p1o5p9o2t6a5m3u5s8

OPTION 1: Via Firebase Console (Recommended for first setup)
═══════════════════════════════════════════════════════════

1. Go to Firebase Console → Your Project → Authentication
2. Click "Create user" button
3. Enter email: uscup@neptune.com
4. Enter password: h3i1p4p1o5p9o2t6a5m3u5s8
5. Click "Create user"
6. Copy the UID shown

OPTION 2: Via Firestore Manual Setup
═════════════════════════════════════

1. Complete Option 1 first (create user in Auth)
2. Go to Firestore Database
3. Create/Edit the document: users/[UID_FROM_STEP_6_ABOVE]
4. Add these fields:
   {
   "uid": "[paste the UID]",
   "email": "uscup@neptune.com",
   "displayName": "System Administrator",
   "role": "admin",
   "isAdmin": true,
   "type": "admin",
   "createdAt": "2025-11-12T00:00:00Z",
   "updatedAt": "2025-11-12T00:00:00Z"
   }

OPTION 3: Via Node Script (If you have Firebase Admin SDK)
══════════════════════════════════════════════════════════

1. Get your Firebase service account key:

   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as: ./firebase-service-account.json

2. Run this command:
   node scripts/create-admin.ts

AFTER ACCOUNT IS CREATED:
═════════════════════════

1. Go to: http://localhost:3000/dashboard/admin/login
2. Sign in with your regular Firebase account first:

   - Go to http://localhost:3000/auth/login
   - Use any test account (create one if needed)

3. In browser console, run:
   firebase.auth().signOut()
   firebase.auth().signInWithEmailAndPassword('uscup@neptune.com', 'h3i1p4p1o5p9o2t6a5m3u5s8')
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))

4. Copy the token output
5. Go to http://localhost:3000/dashboard/admin/login
6. Paste the token and login
7. You should now see the admin dashboard!

TROUBLESHOOTING:
════════════════
❓ "Invalid token or insufficient permissions" error
→ Make sure the user's Firestore document has "role": "admin" set
→ Check that the uid matches exactly

❓ Can't sign in with the credentials
→ Verify the email and password match exactly what you set
→ Make sure the user was created in Firebase Auth

❓ Token keeps expiring
→ Get a fresh token using: firebase.auth().currentUser.getIdToken(true)

⚠️ SECURITY NOTES:
═══════════════════
✓ Store these credentials in your password manager
✓ Never commit them to version control
✓ Use strong, unique passwords for admin accounts
✓ Enable 2FA if Firebase Console supports it
✓ Regularly audit who has admin access
✓ Consider using different credentials for dev/prod

═════════════════════════════════════════════════════════════════════
`;

console.log(instructions);

console.log(instructions);
