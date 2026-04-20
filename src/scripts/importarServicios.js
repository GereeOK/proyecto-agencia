// ============================================================
// SCRIPT DE IMPORTACIÓN MASIVA DE SERVICIOS A FIRESTORE
// ============================================================
// Este script NO va en el bundle de la app. Se corre una sola vez
// desde la terminal con Node.js para poblar/actualizar Firestore.
//
// PASO A PASO:
//
// 1. Instalar dependencias del script (solo una vez):
//      npm install firebase-admin dotenv
//
// 2. Descargar la Service Account Key de Firebase:
//      Firebase Console → Configuración del proyecto (ícono ⚙️)
//      → Cuentas de servicio → Generar nueva clave privada
//      Guardar el archivo como: src/scripts/serviceAccountKey.json
//      (ya está en .gitignore, no se sube a GitHub)
//
// 3. Correr el script:
//      node src/scripts/importarServicios.js
//
//    Para ACTUALIZAR documentos existentes (agregar campos sin borrar nada):
//      MODO=update node src/scripts/importarServicios.js
//
//    Para CREAR todos desde cero (borra los existentes):
//      MODO=create node src/scripts/importarServicios.js
// ============================================================

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ============================================================
// DATOS: servicios existentes + nuevos basados en TripAdvisor BA
// Coordenadas verificadas para Buenos Aires (Google Maps)
// ============================================================
const SERVICIOS = [
  // ── LOS QUE YA TENÉS (con campos nuevos agregados) ──────────
  {
    _firestoreId: null, // null = crear nuevo; pon el ID de Firestore si querés actualizar
    title: "Tour de Grafitis en Barracas",
    description: "Descubrí el arte callejero más auténtico de Buenos Aires en un recorrido guiado por las paredes de Barracas. Conocé las historias detrás de cada mural y artistas emergentes que le dan vida a la ciudad.",
    image: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?w=800",
    price: 8500,
    categoria: "Tours",
    duracion: "3 horas",
    idioma: "Español, Inglés",
    ubicacion: "Barracas, CABA",
    lat: -34.6412,
    lng: -58.3726,
    incluye: "Guía local especializado, mate y medialunas, mapa del circuito",
    rating: 4.8,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Traslados Aeroportuarios",
    description: "Servicio puerta-a-puerta en vehículos de alta gama desde y hacia Ezeiza, Aeroparque o la conexión entre ambos. Chofer profesional, seguimiento de vuelo en tiempo real y cero estrés.",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
    price: 22000,
    categoria: "Traslados",
    duracion: "Variable",
    idioma: "Español, Inglés, Portugués",
    ubicacion: "Ezeiza / Aeroparque",
    lat: -34.8222,
    lng: -58.5358,
    incluye: "Vehículo premium, agua mineral, Wi-Fi a bordo, monitoreo de vuelo",
    rating: 4.9,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Gourmet & Tango",
    description: "Cena de autor seguida de un show de tango de 4 horas en tablaos selectos o almuerzos/cenas en Palermo, Recoleta, San Telmo o Puerto Madero. Menús de alta cocina local para paladares exigentes.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    price: 35000,
    categoria: "Gastronomia",
    duracion: "4 horas",
    idioma: "Español, Inglés",
    ubicacion: "San Telmo, CABA",
    lat: -34.6218,
    lng: -58.3727,
    incluye: "Cena de 3 pasos, copa de vino, show de tango en vivo, transporte al venue",
    rating: 4.7,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "City Tour Temático",
    description: "Recorrido personalizado por los barrios más icónicos de Buenos Aires: La Boca, San Telmo, Palermo y Recoleta. Arquitectura, historia y cultura en un solo día.",
    image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800",
    price: 12000,
    categoria: "Tours",
    duracion: "5 horas",
    idioma: "Español, Inglés, Francés",
    ubicacion: "La Boca, CABA",
    lat: -34.6345,
    lng: -58.3631,
    incluye: "Guía certificado, transporte privado, agua y snacks, entrada a museos",
    rating: 4.6,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Experiencia Polo en Palermo",
    description: "Visitá los históricos campos de polo de Palermo. Incluye clase introductoria, almuerzo en el club y partido de exhibición con jugadores profesionales.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    price: 45000,
    categoria: "Experiencias",
    duracion: "6 horas",
    idioma: "Español, Inglés",
    ubicacion: "Palermo, CABA",
    lat: -34.5755,
    lng: -58.4176,
    incluye: "Clase de polo, almuerzo en el club, partido de exhibición, traslado incluido",
    rating: 4.9,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Show de Tango en Café Tortoni",
    description: "Viví el tango en el café más antiguo de Buenos Aires. Show íntimo con pareja de bailarines profesionales, música en vivo y la atmósfera única del Tortoni desde 1858.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    price: 18000,
    categoria: "Experiencias",
    duracion: "2 horas",
    idioma: "Español, Inglés, Italiano",
    ubicacion: "Microcentro, CABA",
    lat: -34.6087,
    lng: -58.3754,
    incluye: "Entrada al show, café y medialunas, copa de vino, programa del espectáculo",
    rating: 4.8,
    activo: true,
  },

  // ── NUEVOS (inspirados en TripAdvisor Buenos Aires) ─────────
  {
    _firestoreId: null,
    title: "Kayak en el Delta del Tigre",
    description: "Escapada de un día al Delta del Tigre en kayak por los canales y riachuelos rodeados de naturaleza. Perfecto para desconectarse de la ciudad.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    price: 14000,
    categoria: "Experiencias",
    duracion: "Todo el día",
    idioma: "Español, Inglés",
    ubicacion: "Tigre, GBA Norte",
    lat: -34.4264,
    lng: -58.5796,
    incluye: "Kayak y remo, chaleco salvavidas, guía acuático, almuerzo en islas, traslado desde Retiro",
    rating: 4.7,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Visita Guiada Teatro Colón",
    description: "Recorrido exclusivo por el Teatro Colón, una de las óperas más importantes del mundo. Accedé a la sala principal, los camerinos y el taller de utilería.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    price: 9500,
    categoria: "Tours",
    duracion: "1.5 horas",
    idioma: "Español, Inglés, Portugués, Alemán",
    ubicacion: "Centro, CABA",
    lat: -34.6010,
    lng: -58.3832,
    incluye: "Entrada guiada al teatro, acceso a la sala Dorada, auriculares de traducción",
    rating: 4.9,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Bodega & Vinoteca en Mendoza Day Trip",
    description: "Excursión de un día a Mendoza en avión. Visitá dos bodegas boutique de primer nivel con degustación de Malbec, Cabernet y blends de alta gama.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    price: 120000,
    categoria: "Gastronomia",
    duracion: "Todo el día",
    idioma: "Español, Inglés",
    ubicacion: "Mendoza (salida desde EZE)",
    lat: -32.8895,
    lng: -68.8458,
    incluye: "Vuelo Buenos Aires-Mendoza-Buenos Aires, traslados en Mendoza, visita 2 bodegas, degustación 6 vinos, almuerzo maridaje",
    rating: 4.9,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Recorrido Gastronómico por el Mercado de San Telmo",
    description: "Tour culinario por el Mercado de San Telmo con degustación de productos locales: fiambres artesanales, empanadas, alfajores y vinos naturales.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    price: 11000,
    categoria: "Gastronomia",
    duracion: "2.5 horas",
    idioma: "Español, Inglés",
    ubicacion: "San Telmo, CABA",
    lat: -34.6211,
    lng: -58.3737,
    incluye: "10 degustaciones, copa de vino, guía gastronómica local, recetario digital",
    rating: 4.8,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Caminata Nocturna por el Cementerio de Recoleta",
    description: "Tour nocturno exclusivo por el Cementerio de Recoleta, uno de los más famosos del mundo. Historias, leyendas y los mausoleos más icónicos bajo la luna.",
    image: "https://images.unsplash.com/photo-1570872626485-d8ffea69f463?w=800",
    price: 7500,
    categoria: "Tours",
    duracion: "1.5 horas",
    idioma: "Español, Inglés",
    ubicacion: "Recoleta, CABA",
    lat: -34.5877,
    lng: -58.3934,
    incluye: "Guía nocturno, linterna, seguro de visita, mate y facturas al finalizar",
    rating: 4.6,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Clase de Cocina Porteña",
    description: "Aprendé a cocinar los platos más emblemáticos de Buenos Aires: empanadas, asado y dulce de leche casero con un chef local en su cocina de Palermo.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    price: 16000,
    categoria: "Gastronomia",
    duracion: "3 horas",
    idioma: "Español, Inglés",
    ubicacion: "Palermo Hollywood, CABA",
    lat: -34.5810,
    lng: -58.4287,
    incluye: "Todos los ingredientes, delantal, recetas en PDF, degustación de lo cocinado, copa de Malbec",
    rating: 4.9,
    activo: true,
  },
  {
    _firestoreId: null,
    title: "Bicicleteada por Puerto Madero y Costanera",
    description: "Recorrido en bicicleta por el corredor ecológico de Puerto Madero y la Costanera Sur. Ciclismo urbano con vista al Río de la Plata y la Reserva Ecológica.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    price: 6500,
    categoria: "Experiencias",
    duracion: "2.5 horas",
    idioma: "Español, Inglés, Portugués",
    ubicacion: "Puerto Madero, CABA",
    lat: -34.6158,
    lng: -58.3631,
    incluye: "Bicicleta con casco, guía en bici, agua mineral, seguro, mapa del recorrido",
    rating: 4.7,
    activo: true,
  },
];

// ============================================================
// LÓGICA DE IMPORTACIÓN
// ============================================================
async function importar() {
  const modo = process.env.MODO || "create"; // "create" | "update"
  console.log(`\n🚀 Modo: ${modo.toUpperCase()}`);
  console.log(`📦 Servicios a procesar: ${SERVICIOS.length}\n`);

  const col = db.collection("servicios");
  let creados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const servicio of SERVICIOS) {
    const { _firestoreId, ...data } = servicio;

    // Agregar timestamp de server
    data.timestamp = admin.firestore.FieldValue.serverTimestamp();

    try {
      if (modo === "update" && _firestoreId) {
        // Actualizar documento existente sin borrar campos que no están en el script
        await col.doc(_firestoreId).set(data, { merge: true });
        console.log(`  ✅ Actualizado: ${data.title}`);
        actualizados++;
      } else {
        // Crear nuevo documento con ID autogenerado
        const ref = await col.add(data);
        console.log(`  ➕ Creado [${ref.id}]: ${data.title}`);
        creados++;
      }
    } catch (err) {
      console.error(`  ❌ Error en "${data.title}": ${err.message}`);
      errores++;
    }
  }

  console.log(`\n──────────────────────────────`);
  console.log(`✅ Creados:      ${creados}`);
  console.log(`🔄 Actualizados: ${actualizados}`);
  console.log(`❌ Errores:      ${errores}`);
  console.log(`──────────────────────────────\n`);

  process.exit(0);
}

importar();
