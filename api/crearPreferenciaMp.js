const { MercadoPagoConfig, Preference } = require("mercadopago");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { reservaId, items, email } = req.body || {};

  if (!reservaId || !items?.length) {
    return res.status(400).json({ error: "Datos de reserva inválidos." });
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });

  const BASE_URL =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173");

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
        external_reference: reservaId,
        notification_url: `${BASE_URL}/api/webhookMp`,
        statement_descriptor: "BAIRES ESSENCE",
      },
    });

    res.status(200).json({
      sandbox_init_point: preference.sandbox_init_point,
      init_point: preference.init_point,
      preference_id: preference.id,
    });
  } catch (err) {
    console.error("Error creando preferencia MP:", err);
    res.status(500).json({ error: "Error al crear la preferencia de pago." });
  }
};
