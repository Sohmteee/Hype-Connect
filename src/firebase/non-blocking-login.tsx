'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getSdks } from '.';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up and create user profile (non-blocking). */
export function initiateEmailSignUp(
  auth: Auth,
  email: string,
  password: string,
  name: string,
  accountType: 'spotlight' | 'hypeman'
): void {
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // Update user's profile display name
      return updateProfile(user, { displayName: name }).then(() => {
        // Now, create the user profile document in Firestore
        const { firestore } = getSdks(auth.app);
        const userRef = doc(firestore, 'users', user.uid);
        // This is a non-blocking write
        setDoc(userRef, {
          id: user.uid,
          name: name,
          email: user.email,
          role: accountType,
        });
      });
    })
    .catch(error => {
      // The onAuthStateChanged listener will handle UI, but we should log this
      console.error("Sign-up Error:", error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
