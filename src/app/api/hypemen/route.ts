import { NextResponse, NextRequest } from 'next/server';
import { getAdminFirestore } from '@/services/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    // Use collectionGroup to query all profiles across users
    const snapshot = await db
      .collectionGroup('profiles')
      .where('type', '==', 'hypeman')
      .where('visibility', '==', 'public')
      .limit(100)
      .get();

    const hypemen = snapshot.docs.map((doc: any) => {
      // parent -> profiles collection, parent.parent -> users/{userId}
      const userRef = doc.ref.parent.parent;
      const userId = userRef ? userRef.id : null;
      return {
        profileId: doc.id,
        userId,
        displayName: doc.data().displayName || doc.data().name || 'Hypeman',
        publicBio: doc.data().publicBio || '',
        visibility: doc.data().visibility || 'public',
      };
    });

    return NextResponse.json({ success: true, data: hypemen });
  } catch (error) {
    console.error('Get hypemen error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hypemen' }, { status: 500 });
  }
}
