import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const FIREBASE_APP_NAME = "hype-connect-admin";

function initializeFirebaseAdmin() {
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps.find((a) => a.name === FIREBASE_APP_NAME);
    if (app) {
      console.log("[Firebase Admin] Already initialized");
      return app;
    }
  }

  try {
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

    console.log("[Firebase Admin] Raw private key length:", privateKey.length);
    console.log(
      "[Firebase Admin] Raw private key starts with:",
      privateKey.substring(0, 50)
    );

    // First, handle the case where entire string is quoted
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    console.log(
      "[Firebase Admin] After quote removal:",
      privateKey.substring(0, 50)
    );

    // Handle escaped newlines: convert \\n to actual \n
    // This handles both the escaped form and double-escaped form
    privateKey = privateKey.replace(/\\\\n/g, "\n"); // First pass: \\n -> \n
    privateKey = privateKey.replace(/\\n/g, "\n"); // Second pass: \n -> newline

    console.log(
      "[Firebase Admin] After newline conversion:",
      privateKey.substring(0, 100)
    );

    if (!privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) {
      console.error(
        "[Firebase Admin] Invalid private key - missing BEGIN PRIVATE KEY marker"
      );
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
    console.log(
      "  - privateKey valid: ",
      privateKey.includes("BEGIN") && privateKey.includes("END")
    );

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
