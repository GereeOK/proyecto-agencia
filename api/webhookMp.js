const { MercadoPagoConfig, Payment } = require("mercadopago");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { type, data } = req.body || {};

  if (type !== "payment" || !data?.id) {
    return res.status(200).end();
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const pago = await new Payment(client).get({ id: data.id });

    if (pago.status === "approved" && pago.external_reference) {
      await db.collection("reservas").doc(pago.external_reference).update({
        estado: "pagada",
        pagoId: String(pago.id),
        metodoPago: "mercadopago",
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).end();
  } catch (err) {
    console.error("Error en webhook MP:", err);
    res.status(500).end();
  }
};
