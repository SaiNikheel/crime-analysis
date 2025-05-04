import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const firestore = getFirestore();

async function setupAdminUser(userId: string) {
  try {
    const userRef = firestore.collection('users').doc(userId);
    await userRef.set({
      role: 'admin',
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log(`Successfully set up admin user: ${userId}`);
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

// Get userId from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as an argument');
  process.exit(1);
}

setupAdminUser(userId); 