'use client';
import {
  getAuth,
  createUserWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { createProfile } from './user';
import { initializeFirebase } from '@/firebase';

/**
 * Signs up a new user with email and password, creates their user document,
 * and creates one or more profiles based on the selected roles.
 * @param firestore The Firestore instance.
 * @param email The user's email.
 * @param password The user's password.
 * @param displayName The user's display name.
 * @param roles An array of roles to create profiles for ('hypeman' and/or 'spotlight').
 * @returns The user credential from the user creation.
 */
export async function signUpWithEmail(
  firestore: Firestore,
  email: string,
  password: string,
  displayName: string,
  roles: Array<'hypeman' | 'spotlight'>
): Promise<UserCredential> {

  const { auth } = initializeFirebase();

  // 1. Create the Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user) {
    throw new Error('User creation failed.');
  }
  
  console.log("Firebase Auth user created:", user.uid);

  // The rest of the logic is temporarily commented out to isolate the auth issue.
  /*
  // 2. Create the root user document in Firestore
  const userDocRef = doc(firestore, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName,
    roles: roles,
    createdAt: serverTimestamp(),
  });

  // 3. Create a profile for each selected role
  const profilePromises = roles.map((role) =>
    createProfile(firestore, user, role, displayName)
  );
  
  const profileIds = await Promise.all(profilePromises);

  // 4. Set the first created profile as the default
  if (profileIds.length > 0) {
    await setDoc(userDocRef, {
        defaultProfileId: profileIds[0]
    }, { merge: true });
  }
  */

  return userCredential;
}
