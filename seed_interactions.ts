import { db } from './src/server/db/index.js';
import { collection, addDoc } from 'firebase/firestore';

async function seed() {
  const interactions = [];
  const today = new Date();
  
  for (let i = 0; i < 20; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - Math.floor(Math.random() * 30));
    
    interactions.push({
      hcpName: 'Dr. Sarah Jenkins',
      interactionType: Math.random() > 0.5 ? 'Meeting' : 'Call',
      summary: 'Discussed new trial data.',
      date: d.toISOString().split('T')[0],
      createdAt: d.toISOString()
    });
  }

  for (const data of interactions) {
    await addDoc(collection(db, 'interactions'), data);
  }
  
  console.log('Seeded 20 interactions.');
  process.exit(0);
}

seed();
