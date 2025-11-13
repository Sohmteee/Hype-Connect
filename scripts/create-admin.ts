import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Make sure you have your Firebase service account key
// Download from: Firebase Console > Project Settings > Service Accounts > Generate new private key
const serviceAccount = require("../firebase-service-account.json");

const app = initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = "uscup@neptune.com";
  const password = "h3i1p4p1o5p9o2t6a5m3u5s8";

  try {
    console.log(`🔧 Creating admin user: ${email}`);

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: "System Administrator",
      emailVerified: true,
    });

    console.log(`✅ User created in Firebase Auth: ${userRecord.uid}`);

    // Set admin role in Firestore
    await db.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        displayName: "System Administrator",
        role: "admin",
        isAdmin: true,
        type: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ Admin role set in Firestore`);
    console.log(`\n📋 Admin Account Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`\n🔐 Next steps:`);
    console.log(`   1. Go to http://localhost:3000/dashboard/admin/login`);
    console.log(`   2. Log in with the credentials above`);
    console.log(`   3. Get your Firebase ID token from browser console:`);
    console.log(`      firebase.auth().currentUser.getIdToken()`);
    console.log(`   4. Paste it in the admin login page`);
    console.log(`\n⚠️  Store these credentials securely!`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);

    // If user already exists, just update the role
    if (error.code === "auth/email-already-exists") {
      console.log(`\n⚠️  User already exists. Updating admin role...`);

      try {
        const existingUser = await auth.getUserByEmail(email);
        await db.collection("users").doc(existingUser.uid).set(
          {
            role: "admin",
            isAdmin: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        console.log(`✅ Admin role updated for existing user`);
        console.log(`\n📋 Admin Account Details:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   UID: ${existingUser.uid}`);
        process.exit(0);
      } catch (updateError: any) {
        console.error("❌ Error updating admin role:", updateError.message);
        process.exit(1);
      }
    }

    process.exit(1);
  }
}

createAdminUser();
