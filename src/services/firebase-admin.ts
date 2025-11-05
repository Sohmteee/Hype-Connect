import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const FIREBASE_APP_NAME = "hype-connect-admin";

// Helper to parse service account from environment
function parseServiceAccount() {
  // Try to parse as JSON first (if FIREBASE_SERVICE_ACCOUNT_JSON is provided)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      let jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      
      // Remove quotes if wrapped
      if ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) ||
          (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
        jsonStr = jsonStr.slice(1, -1);
      }

      // Check if it's base64 encoded (doesn't contain JSON markers)
      if (!jsonStr.includes('{')) {
        console.log("[Firebase Admin] Decoding base64 JSON...");
        jsonStr = Buffer.from(jsonStr, "base64").toString("utf-8");
      }

      const parsed = JSON.parse(jsonStr);
      
      // Handle Firebase service account JSON format (uses snake_case)
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: parsed.private_key || parsed.privateKey,
      };
    } catch (e) {
      console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", (e as Error).message);
    }
  }

  // Fall back to individual environment variables
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  };
}

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
    const serviceAccount = parseServiceAccount();

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error(
        "Firebase Admin configuration incomplete. Required env vars: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY"
      );
    }

    let privateKey = serviceAccount.privateKey;

    console.log("[Firebase Admin] Processing private key...");

    // Handle the case where the entire string is quoted
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Handle escaped newlines: convert \\n to actual \n
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Ensure the key ends with a newline
    if (!privateKey.endsWith("\n")) {
      privateKey += "\n";
    }

    // Validate the key format
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error(
        "Invalid FIREBASE_ADMIN_PRIVATE_KEY: missing 'BEGIN PRIVATE KEY' marker"
      );
    }

    if (!privateKey.includes("END PRIVATE KEY")) {
      throw new Error(
        "Invalid FIREBASE_ADMIN_PRIVATE_KEY: missing 'END PRIVATE KEY' marker"
      );
    }

    // Create the credential object
    const credential = {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: privateKey,
    } as any;

    console.log("[Firebase Admin] Initializing Firebase Admin SDK...");
    console.log("  Project ID:", credential.projectId);
    console.log("  Client Email:", credential.clientEmail.substring(0, 30) + "...");

    const app = initializeApp(
      {
        credential: cert(credential),
      },
      FIREBASE_APP_NAME
    );

    console.log("[Firebase Admin] Successfully initialized");
    return app;
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error);
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
