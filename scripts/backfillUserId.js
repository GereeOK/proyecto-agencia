// Backfill: completa el campo "userId" (UID de Firebase Auth) en los
// documentos de "reservas" que solo tienen "email", para que la app móvil
// (que filtra por userId) pueda encontrarlos.
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/backfillUserId.js
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/backfillUserId.js --dry-run
//
// Requiere una service account key del proyecto "baires-essence" con permisos
// de Firestore y Firebase Auth (rol "Firebase Admin SDK Administrator Service Agent"
// o equivalente). Se descarga desde Firebase Console > Configuración del proyecto
// > Cuentas de servicio > Generar nueva clave privada.
//
// El script NO borra ni toca el campo "email": solo agrega "userId" a los
// documentos que no lo tienen.

const admin = require("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const auth = admin.auth();

async function main() {
  console.log(`Buscando reservas sin "userId"...${DRY_RUN ? " (dry-run, no se escribe nada)" : ""}`);

  const snapshot = await db.collection("reservas").get();

  const sinUserId = snapshot.docs.filter((doc) => !doc.data().userId);

  console.log(`Total de reservas: ${snapshot.size}. Sin userId: ${sinUserId.length}.`);

  const emailToUid = new Map();
  const resultados = { actualizadas: 0, sinEmail: 0, emailNoEncontrado: 0, error: 0 };

  let batch = db.batch();
  let opsEnBatch = 0;

  for (const doc of sinUserId) {
    const data = doc.data();
    const email = data.email;

    if (!email) {
      console.warn(`  [SIN EMAIL] reserva ${doc.id} no tiene email ni userId — se omite.`);
      resultados.sinEmail += 1;
      continue;
    }

    try {
      let uid = emailToUid.get(email);
      if (!uid) {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        emailToUid.set(email, uid);
      }

      console.log(`  [OK] reserva ${doc.id} (${email}) -> userId=${uid}`);

      if (!DRY_RUN) {
        batch.update(doc.ref, { userId: uid });
        opsEnBatch += 1;

        // Firestore permite máximo 500 operaciones por batch.
        if (opsEnBatch >= 400) {
          await batch.commit();
          batch = db.batch();
          opsEnBatch = 0;
        }
      }

      resultados.actualizadas += 1;
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        console.warn(`  [SIN USUARIO] reserva ${doc.id}: no existe un usuario de Firebase Auth con email ${email} — se omite.`);
        resultados.emailNoEncontrado += 1;
      } else {
        console.error(`  [ERROR] reserva ${doc.id}:`, err.message);
        resultados.error += 1;
      }
    }
  }

  if (!DRY_RUN && opsEnBatch > 0) {
    await batch.commit();
  }

  console.log("\nResumen:");
  console.log(`  Actualizadas: ${resultados.actualizadas}`);
  console.log(`  Sin email (no se pudo resolver): ${resultados.sinEmail}`);
  console.log(`  Email sin usuario en Auth: ${resultados.emailNoEncontrado}`);
  console.log(`  Errores: ${resultados.error}`);
  if (DRY_RUN) console.log("\n(dry-run: no se escribió nada en Firestore)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fallo el backfill:", err);
    process.exit(1);
  });
