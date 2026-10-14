import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const autoStartGames = onSchedule(
  { schedule: "every 1 minutes", timeZone: "America/Bogota" },
  async () => {
    const now = Date.now();

    try {
      const snapshot = await db.collection('games')
        .where('scheduledAt', '<=', now)
        .get();

      if (snapshot.empty) {
        console.log('ℹ️ No hay juegos programados para iniciar en este momento.');
        return;
      }

      const gamesToStart = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.state === 'OPEN' || data.state === 'READY';
      });

      if (gamesToStart.length === 0) {
        console.log('ℹ️ Hay juegos programados, pero ninguno está en estado OPEN o READY.');
        return;
      }

      const batch = db.batch();
      
      for (const doc of gamesToStart) {
        const gameData = doc.data();
        batch.update(doc.ref, { 
          state: 'RUNNING',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`⏰ [Auto-Start] Iniciando juego: ${doc.id} (${gameData.name})`);
      }

      await batch.commit();
      console.log(`✅ Éxito: Se iniciaron automáticamente ${gamesToStart.length} juego(s).`);

    } catch (error) {
      console.error('❌ Error en la función autoStartGames:', error);
    }
  }
);
