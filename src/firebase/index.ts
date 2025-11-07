"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Validate that Firebase config keys are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase config is not set or missing API key/project ID. Please check your .env.local file."
  );
}

let app: FirebaseApp;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Get the already initialized app
}

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

export { app, auth, firestore };

export * from "./provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
