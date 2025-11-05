'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

let cachedApp: FirebaseApp | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Check if Firebase is already initialized
  const apps = getApps();
  if (apps.length > 0) {
    cachedApp = apps[0];
    return getSdks(apps[0]);
  }

  // Initialize Firebase with config
  try {
    console.log('Initializing Firebase with projectId:', firebaseConfig.projectId);
    const firebaseApp = initializeApp(firebaseConfig);
    cachedApp = firebaseApp;
    return getSdks(firebaseApp);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!cachedApp) {
    initializeFirebase();
  }
  return cachedApp!;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
