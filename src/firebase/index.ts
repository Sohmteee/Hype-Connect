"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

export function initializeFirebase() {
  // Return existing instances if already initialized
  if (app && auth && firestore) {
    return { firebaseApp: app, auth, firestore };
  }

  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    // Initialize new Firebase app
    app = initializeApp(firebaseConfig);
  }

  // Initialize Auth and Firestore
  auth = getAuth(app);
  firestore = getFirestore(app);

  return { firebaseApp: app, auth, firestore };
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const { firebaseApp } = initializeFirebase();
    return firebaseApp;
  }
  return app;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from "./provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
