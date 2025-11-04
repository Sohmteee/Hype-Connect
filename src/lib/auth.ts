'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  type UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type Role = 'spotlight' | 'hypeman' | 'both';

/**
 * Signs up a new user with email and password, updates their profile,
 * and creates a user document in Firestore with their selected roles.
 */
export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  role: Role
): Promise<UserCredential> {
  const { auth, firestore } = initializeFirebase();

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Firebase Auth profile
  await updateProfile(user, { displayName: name });

  // Create user document in Firestore
  const userRef = doc(firestore, 'users', user.uid);
  const roles =
    role === 'both' ? ['spotlight', 'hypeman'] : [role];
  
  await setDoc(userRef, {
    uid: user.uid,
    name: name,
    email: user.email,
    roles: roles,
  }, { merge: true });

  return userCredential;
}

/**
 * Signs in a user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const { auth } = initializeFirebase();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out the current user.
 */
export async function signOutUser(): Promise<void> {
  const { auth } = initializeFirebase();
  return signOut(auth);
}

/**
 * Retrieves the roles of a user from their Firestore document.
 */
export async function getUserRoles(uid: string): Promise<string[]> {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data().roles || [];
  }

  return [];
}
