import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, limit, query, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {};
try {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
} catch(e) {
  console.error("Failed to load firebase config", e);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Seed initial HCPs if empty
async function seedHcps() {
  try {
    const hcpsRef = collection(db, 'hcps');
    const q = query(hcpsRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const batch = writeBatch(db);
      batch.set(doc(hcpsRef), { name: 'Dr. Smith', specialty: 'Oncology' });
      batch.set(doc(hcpsRef), { name: 'Dr. Sharma', specialty: 'Cardiology' });
      batch.set(doc(hcpsRef), { name: 'Dr. Jones', specialty: 'Neurology' });
      await batch.commit();
      console.log('Seeded initial HCPs.');
    }
  } catch (error: any) {
    console.error('Error seeding HCPs details:', error?.code, error?.message, error);
  }
}

seedHcps();
