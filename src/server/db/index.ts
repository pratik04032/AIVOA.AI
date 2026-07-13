import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

export const db = getFirestore();

// Seed initial HCPs if empty
async function seedHcps() {
  try {
    const hcpsRef = db.collection('hcps');
    const snapshot = await hcpsRef.limit(1).get();
    if (snapshot.empty) {
      const batch = db.batch();
      batch.set(hcpsRef.doc(), { name: 'Dr. Smith', specialty: 'Oncology' });
      batch.set(hcpsRef.doc(), { name: 'Dr. Sharma', specialty: 'Cardiology' });
      batch.set(hcpsRef.doc(), { name: 'Dr. Jones', specialty: 'Neurology' });
      await batch.commit();
      console.log('Seeded initial HCPs.');
    }
  } catch (error) {
    console.error('Error seeding HCPs:', error);
  }
}

seedHcps();
