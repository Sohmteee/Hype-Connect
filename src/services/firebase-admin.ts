import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
    }
    if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL is not set");
    }
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
    }

    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };

    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    app = getApps()[0];
  }

  return app;
}

export function getAdminAuth(): Auth {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return getAuth(app!);
}

export function getAdminFirestore(): Firestore {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return getFirestore(app!);
}
