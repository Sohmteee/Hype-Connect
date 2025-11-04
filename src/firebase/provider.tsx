'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// This file is now mostly a shell. The user-related logic has been removed
// to prevent auth errors. We can re-add it later when the environment is fixed.

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: null, // Hardcoded to null
      isUserLoading: false, // Hardcoded to false
    };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): Omit<FirebaseContextState, 'areServicesAvailable'> => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    // This provides a fallback for now, but ideally we re-introduce proper initialization.
    console.warn('Firebase services not fully available. App might not function as expected.');
    return {
      firebaseApp: null,
      firestore: null,
      auth: null,
      user: null,
      isUserLoading: false,
    };
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
  };
};

export const useAuth = (): Auth | null => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore | null => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp | null => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = () => {
  return { user: null, isUserLoading: false, userError: null };
};
