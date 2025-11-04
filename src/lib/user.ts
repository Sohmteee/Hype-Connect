'use client';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

/**
 * Creates a new profile for a given user.
 * @param db The Firestore instance.
 * @param user The Firebase user object.
 * @param type The type of profile to create ('hypeman' or 'spotlight').
 * @param displayName The display name for the new profile.
 * @returns The ID of the newly created profile document.
 */
export async function createProfile(
  db: Firestore,
  user: User,
  type: 'hypeman' | 'spotlight',
  displayName: string
) {
  if (!user) {
    throw new Error('User must be authenticated to create a profile.');
  }

  const profilesCol = collection(db, `users/${user.uid}/profiles`);
  
  const newProfileDoc = await addDoc(profilesCol, {
    profileId: '', // Will be updated with the doc ID below
    type,
    displayName,
    publicBio: '',
    payoutInfo: {},
    visibility: 'public',
    createdAt: serverTimestamp(),
    stats: { hypesReceived: 0, earnings: 0 },
  });

  // Update the profile with its own ID and set the default profile on the user doc
  await setDoc(doc(db, `users/${user.uid}/profiles`, newProfileDoc.id), {
      profileId: newProfileDoc.id,
  }, { merge: true });
  
  await setDoc(doc(db, 'users', user.uid), {
    defaultProfileId: newProfileDoc.id
  }, { merge: true });

  return newProfileDoc.id;
}
