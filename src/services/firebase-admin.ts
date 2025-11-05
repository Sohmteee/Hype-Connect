import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

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
        throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not configured or invalid");
      }

      const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      };

      if (!serviceAccount.projectId || !serviceAccount.clientEmail) {
        throw new Error(
          "Firebase Admin configuration incomplete: missing projectId or clientEmail"
        );
      }

      console.log(
        "[Firebase Admin] Initializing with project:",
        serviceAccount.projectId
      );

      initializeApp({
        credential: cert(serviceAccount as any),
      });

      console.log("[Firebase Admin] Successfully initialized");
    } catch (error) {
      console.error("[Firebase Admin] Initialization failed:", error);
      throw error;
    }
  }
}

export function getAdminAuth() {
  initializeFirebaseAdmin();
  return getAuth(getApp());
}

export function getAdminFirestore() {
  initializeFirebaseAdmin();
  return getFirestore(getApp());
}
