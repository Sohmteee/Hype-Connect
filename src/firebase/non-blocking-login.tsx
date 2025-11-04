'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
  const { firestore } = getSdks(auth.app);

  fetchSignInMethodsForEmail(auth, email)
    .then(methods => {
      if (methods.length > 0) {
        // Email already exists. Sign them in and add the new role.
        signInWithEmailAndPassword(auth, email, password)
          .then(userCredential => {
            const user = userCredential.user;
            const userRef = doc(firestore, 'users', user.uid);
            // Add the new role to the existing roles array.
            updateDocumentNonBlocking(userRef, {
              roles: arrayUnion(accountType),
            });
          })
          .catch(error => {
            console.error("Sign-in error for existing user:", error);
            // Handle incorrect password, etc.
          });
      } else {
        // New user. Create account and profile.
        createUserWithEmailAndPassword(auth, email, password)
          .then(userCredential => {
            const user = userCredential.user;
            return updateProfile(user, { displayName: name }).then(() => {
              const userRef = doc(firestore, 'users', user.uid);
              setDocumentNonBlocking(userRef, {
                id: user.uid,
                name: name,
                email: user.email,
                roles: [accountType], // Start with an array
              }, {});
            });
          })
          .catch(error => {
            console.error("Sign-up Error:", error);
          });
      }
    })
    .catch(error => {
      console.error("Error fetching sign-in methods:", error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

    