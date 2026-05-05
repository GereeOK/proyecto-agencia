// functions/index.js
// Firebase Cloud Functions para procesamiento de pagos.
// 
// SETUP REQUERIDO antes de deployar:
//   1. npm install -g firebase-tools
//   2. firebase login
//   3. firebase init functions  (elegir JavaScript)
//   4. cd functions && npm install mercadopago axios node-fetch
//   5. Configurar secrets:
//      firebase functions:config:set mp.access_token="APP_USR-xxxx"
//      firebase functions:config:set paypal.client_id="AXxx"
//      firebase functions:config:set paypal.client_secret="EXxx"
//      firebase functions:config:set paypal.mode="sandbox"
//   6. firebase deploy --only functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

// Convierte ARS a USD aproximado (tipo de cambio informal ~1000)
// En producción conviene usar una API de tipo de cambio real
const arsToUsd = (ars) => (ars / 1000).toFixed(2);

const getPaypalBaseUrl = (mode) =>
  mode === "live"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

const getPaypalToken = async () => {
  const { client_id, client_secret, mode } = functions.config().paypal;
  const base = getPaypalBaseUrl(mode);
  const res = await axios.post(
    `${base}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: client_id, password: client_secret },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return { token: res.data.access_token, base };
};

// ─────────────────────────────────────────────────────────
// MERCADOPAGO — crear preferencia
// ─────────────────────────────────────────────────────────
exports.crearPreferenciaMp = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debés iniciar sesión para pagar.");
  }

  const { reservaId, items, email } = data;

  if (!reservaId || !items || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Datos de reserva inválidos.");
  }

  const client = new MercadoPagoConfig({
    accessToken: functions.config().mp.access_token,
  });

  // URL base del sitio — cambiar por tu dominio en producción
  const BASE_URL = "https://gereeok.github.io/proyecto-agencia";

  try {
    const preference = await new Preference(client).create({
      body: {
        items: items.map((i) => ({
          title: i.title,
          quantity: Number(i.personas) || 1,
          unit_price: Number(i.price),
          currency_id: "ARS",
        })),
        payer: { email },
        back_urls: {
          success: `${BASE_URL}/pago-exitoso`,
          failure: `${BASE_URL}/pago-fallido`,
          pending: `${BASE_URL}/mis-reservas`,
        },
        auto_return: "approved",
        // external_reference vincula el pago con la reserva en Firestore
        external_reference: reservaId,
        // URL donde MP envía la notificación de pago (webhook)
        notification_url: `https://us-central1-baires-essence.cloudfunctions.net/webhookMp`,
        statement_descriptor: "BAIRES ESSENCE",
      },
    });

    return {
      // sandbox_init_point para testing, init_point para producción
      sandbox_init_point: preference.sandbox_init_point,
      init_point: preference.init_point,
      preference_id: preference.id,
    };
  } catch (err) {
    console.error("Error creando preferencia MP:", err);
    throw new functions.https.HttpsError("internal", "Error al crear la preferencia de pago.");
  }
});

// ─────────────────────────────────────────────────────────
// MERCADOPAGO — webhook (notificación de pago)
// ─────────────────────────────────────────────────────────
exports.webhookMp = functions.https.onRequest(async (req, res) => {
  const { type, data } = req.body;

  // Solo procesar notificaciones de tipo "payment"
  if (type !== "payment" || !data?.id) {
    return res.sendStatus(200);
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: functions.config().mp.access_token,
    });

    // Verificar el pago con la API de MP
    const pago = await new Payment(client).get({ id: data.id });

    if (pago.status === "approved" && pago.external_reference) {
      await db.collection("reservas").doc(pago.external_reference).update({
        estado: "pagada",
        pagoId: String(pago.id),
        metodoPago: "mercadopago",
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Reserva ${pago.external_reference} marcada como pagada (MP)`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error en webhook MP:", err);
    res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────────────────
// PAYPAL — crear order
// ─────────────────────────────────────────────────────────
exports.crearOrderPaypal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debés iniciar sesión para pagar.");
  }

  const { reservaId, items } = data;

  if (!reservaId || !items || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Datos de reserva inválidos.");
  }

  const BASE_URL = "https://gereeok.github.io/proyecto-agencia";

  try {
    const { token, base } = await getPaypalToken();

    // Calcular total en USD
    const totalUsd = items.reduce(
      (acc, i) => acc + parseFloat(arsToUsd(Number(i.price) * (Number(i.personas) || 1))),
      0
    ).toFixed(2);

    const orderRes = await axios.post(
      `${base}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: reservaId,
            amount: {
              currency_code: "USD",
              value: totalUsd,
              breakdown: {
                item_total: { currency_code: "USD", value: totalUsd },
              },
            },
            items: items.map((i) => ({
              name: i.title.slice(0, 127), // PayPal limita a 127 chars
              unit_amount: {
                currency_code: "USD",
                value: arsToUsd(Number(i.price)),
              },
              quantity: String(Number(i.personas) || 1),
            })),
            description: `Baires Essence — Reserva ${reservaId}`,
          },
        ],
        application_context: {
          brand_name: "Baires Essence",
          return_url: `${BASE_URL}/pago-exitoso`,
          cancel_url: `${BASE_URL}/pago-fallido?collection_status=cancelled`,
          user_action: "PAY_NOW",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const approveLink = orderRes.data.links.find((l) => l.rel === "approve");

    if (!approveLink) {
      throw new Error("PayPal no devolvió URL de aprobación.");
    }

    return {
      approveUrl: approveLink.href,
      orderId: orderRes.data.id,
    };
  } catch (err) {
    console.error("Error creando order PayPal:", err.response?.data || err.message);
    throw new functions.https.HttpsError("internal", "Error al crear el pago con PayPal.");
  }
});

// ─────────────────────────────────────────────────────────
// PAYPAL — capturar pago (se llama desde el return_url)
// Esta función es llamada desde el frontend cuando PayPal
// redirige de vuelta con el token de aprobación
// ─────────────────────────────────────────────────────────
exports.capturarPagoPaypal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "No autorizado.");
  }

  const { orderId, reservaId } = data;

  try {
    const { token, base } = await getPaypalToken();

    const captureRes = await axios.post(
      `${base}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

    if (captureRes.data.status === "COMPLETED" && reservaId) {
      await db.collection("reservas").doc(reservaId).update({
        estado: "pagada",
        pagoId: orderId,
        metodoPago: "paypal",
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Reserva ${reservaId} marcada como pagada (PayPal)`);
    }

    return { status: captureRes.data.status };
  } catch (err) {
    console.error("Error capturando PayPal:", err.response?.data || err.message);
    throw new functions.https.HttpsError("internal", "Error al capturar el pago de PayPal.");
  }
});
