import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let cachedApp: App | undefined;
let cachedAuth: Auth | undefined;
let cachedFirestore: Firestore | undefined;

/**
 * Production environment validation
 * Warns about potential payment configuration issues
 */
function validateProductionEnv(): void {
  const pubKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  const secKey = process.env.PAYSTACK_SECRET_KEY || "";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // In production runtime, warn about test keys but allow builds
    if (pubKey.includes("test") || secKey.includes("test")) {
      console.warn(
        "⚠ WARNING: Production environment detected using TEST Paystack keys! " +
          "Real payments will NOT work. " +
          "Update NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to production keys. " +
          "See: https://dashboard.paystack.com/settings/developer"
      );
    } else {
      console.log(
        "✓ Production environment using production Paystack keys (pk_live_*, sk_live_*)"
      );
    }
  } else {
    // In development
    if (!pubKey.includes("test") && pubKey) {
      console.warn(
        "⚠ WARNING: Development environment using PRODUCTION Paystack keys! " +
          "This could cause real charges. Use test keys (pk_test_*, sk_test_*) for development."
      );
    }
  }
}

function initializeFirebaseAdmin(): App {
  // Validate production environment
  validateProductionEnv();

  // If app is already initialized, return it
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Check if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    console.error("Missing FIREBASE_ADMIN_CLIENT_EMAIL");
    throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL is not set");
  }
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.error("Missing FIREBASE_ADMIN_PRIVATE_KEY");
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
  }

  console.log(
    "Initializing Firebase Admin with project:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  // Debug: Check all env vars
  console.log("[DEBUG] Environment variables check:");
  console.log(
    "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✓" : "✗"
  );
  console.log(
    "  - FIREBASE_ADMIN_CLIENT_EMAIL:",
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? "✓" : "✗"
  );
  console.log(
    "  - FIREBASE_ADMIN_PRIVATE_KEY:",
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? `✓ (${process.env.FIREBASE_ADMIN_PRIVATE_KEY.length} chars)`
      : "✗"
  );

  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // CRITICAL: Convert escaped newlines to actual newlines
  // This is necessary because env vars with multiline strings get stored with literal \n
  if (privateKey.indexOf("\\n") !== -1) {
    privateKey = privateKey.split("\\n").join("\n");
  }

  console.log("Private key validation:");
  console.log(
    "  - Starts with 'BEGIN':",
    privateKey.includes("BEGIN PRIVATE KEY")
  );
  console.log("  - Ends with 'END':", privateKey.includes("END PRIVATE KEY"));
  console.log("  - Has newlines:", privateKey.split("\n").length > 1);
  console.log("  - Total lines:", privateKey.split("\n").length);

  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  console.log("Service Account Config:", {
    projectId: serviceAccount.projectId,
    clientEmail: serviceAccount.clientEmail,
    privateKeyStart: serviceAccount.privateKey.substring(0, 50),
    privateKeyEnd: serviceAccount.privateKey.substring(
      serviceAccount.privateKey.length - 50
    ),
  });

  try {
    console.log("[DEBUG] About to initialize app with cert()...");
    const credentialObj = cert(serviceAccount);
    console.log("[DEBUG] cert() succeeded, creating app...");

    const app = initializeApp({
      credential: credentialObj,
      projectId: serviceAccount.projectId,
    });

    console.log("Firebase Admin initialized successfully");
    console.log("[DEBUG] App successfully initialized with name:", app.name);
    return app;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

export function getAdminApp(): App {
  if (!cachedApp) {
    cachedApp = initializeFirebaseAdmin();
  }
  return cachedApp;
}

export function getAdminAuth(): Auth {
  if (!cachedAuth) {
    const app = getAdminApp();
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export function getAdminFirestore(): Firestore {
  if (!cachedFirestore) {
    console.log("[getAdminFirestore] Cache miss, initializing...");
    const app = getAdminApp();
    console.log("[getAdminFirestore] Got app:", app.name);

    cachedFirestore = getFirestore(app);
    console.log("[getAdminFirestore] Firestore instance created");
    console.log("[getAdminFirestore] App name:", app.name);
    console.log(
      "[getAdminFirestore] Firestore type:",
      cachedFirestore.constructor.name
    );
    console.log(
      "[getAdminFirestore] Is Firestore instance?",
      cachedFirestore instanceof require("firebase-admin/firestore").Firestore
    );

    // Attempt a test query to verify auth works
    (async () => {
      try {
        console.log("[getAdminFirestore] Attempting test query...");
        const result = await cachedFirestore!
          .collection("users")
          .limit(1)
          .get();
        console.log(
          "[getAdminFirestore] Test query successful, docs count:",
          result.docs.length
        );
      } catch (error: any) {
        console.error("[getAdminFirestore] Test query failed:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
        });
      }
    })();
  } else {
    console.log("[getAdminFirestore] Using cached Firestore instance");
  }
  return cachedFirestore;
}
