import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const FIREBASE_APP_NAME = "hype-connect-admin";

function initializeFirebaseAdmin() {
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps.find(a => a.name === FIREBASE_APP_NAME);
    if (app) {
      console.log("[Firebase Admin] Already initialized");
      return;
    }
  }

  try {
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

    console.log("[Firebase Admin] Private key length:", privateKey.length);

    // Remove surrounding quotes if present
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Replace escaped newlines with actual newlines (handles both \n and literal newlines)
    privateKey = privateKey.replace(/\\n/g, "\n");

    if (!privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "FIREBASE_ADMIN_PRIVATE_KEY is not configured or invalid"
      );
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    if (!projectId || !clientEmail) {
      throw new Error(
        "Firebase Admin configuration incomplete: missing projectId or clientEmail"
      );
    }

    const serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    } as any;

    console.log("[Firebase Admin] Initializing with:");
    console.log("  - projectId:", projectId);
    console.log("  - clientEmail:", clientEmail);
    console.log("  - privateKey: [" + privateKey.length + " chars]");

    const app = initializeApp(
      {
        credential: cert(serviceAccount),
      },
      FIREBASE_APP_NAME
    );

    console.log("[Firebase Admin] Successfully initialized");
    return app;
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    throw error;
  }
}

export function getAdminAuth() {
  initializeFirebaseAdmin();
  try {
    const app = getApp(FIREBASE_APP_NAME);
    return getAuth(app);
  } catch (error) {
    console.error("[Firebase Admin] Failed to get auth:", error);
    throw error;
  }
}

export function getAdminFirestore() {
  initializeFirebaseAdmin();
  try {
    const app = getApp(FIREBASE_APP_NAME);
    return getFirestore(app);
  } catch (error) {
    console.error("[Firebase Admin] Failed to get firestore:", error);
    throw error;
  }
}
