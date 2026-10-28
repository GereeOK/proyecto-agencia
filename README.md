# Baires Essence

> Plataforma de turismo en Buenos Aires — reservá experiencias auténticas, gestionadas por guías locales.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![i18n](https://img.shields.io/badge/i18n-ES/EN/FR/PT/IT-6366F1?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square)

---

## Qué es

Baires Essence conecta a turistas con guías y agencias porteñas. El turista elige experiencias (city tours, gastronomía, tango, polo, kayak…), las arma en un carrito, reserva y paga. El guía las gestiona desde su panel. El admin supervisa todo.

---

## Plataforma

Baires Essence tiene dos clientes que comparten el mismo proyecto Firebase (`baires-essence`):

| Repo | Cliente | Usuarios |
|---|---|---|
| [proyecto-agencia](https://github.com/GereeOK/proyecto-agencia) (este) | Web React | Turistas, sellers y admins |
| [BairesEssence_Mobile](https://github.com/R-oyo/BairesEssence_Mobile) | App Android | Turistas |

Ambos leen y escriben las mismas colecciones de Firestore. **Un cambio de esquema en uno de los dos repos tiene que replicarse en el otro.**

Las reglas de Firestore (`firestore.rules`) están duplicadas en ambos repos y hoy son idénticas: si se modifican, hay que actualizar las dos copias. Firebase Hosting se despliega **solo desde el repo de la app** (ver [Deploy](#deploy)).

---

## Funcionalidades

### Turistas
- Catálogo con filtros por categoría y búsqueda en tiempo real
- Modal de detalle con mapa (Leaflet), reseñas y contacto directo al guía (WhatsApp / email)
- Carrito multi-experiencia con selección de personas
- Reserva con lista de pasajeros, fechas y horarios por actividad
- Pago online con MercadoPago (PayPal está implementado pero deshabilitado hasta tener credenciales)
- Historial de reservas + calificación post-experiencia
- Favoritos guardados
- Interfaz en 5 idiomas: ES / EN / FR / PT / IT

### Vendedores (panel seller)
- CRUD de experiencias con mapa interactivo
- Auto-traducción al guardar: el contenido en español se traduce automáticamente a EN/FR/PT/IT
- Reservas en tiempo real (`onSnapshot`)
- Chat con turistas por reserva
- Calendario mensual de actividades
- Exportación CSV

### Administradores (panel admin)
- Dashboard con KPIs: reservas, ingresos, tasa de conversión, reseñas promedio
- Gráficos de barras, torta y área (Recharts)
- Panel de reseñas: filtros, ocultar, respuesta por email
- Panel de consultas: respuesta con EmailJS
- CRUD completo: usuarios, experiencias, reservas
- Gestión de roles y activación/desactivación de cuentas

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Estilos | Tailwind CSS |
| Íconos | lucide-react |
| Base de datos | Firebase Firestore (proyecto compartido con la app Android) |
| Auth | Firebase Auth — email + Google OAuth |
| Mapas | Leaflet + React-Leaflet |
| Gráficos | Recharts |
| Calendario | React Big Calendar + date-fns |
| Internacionalización | react-i18next + i18next-browser-languagedetector |
| Auto-traducción | MyMemory API (gratuita, sin API key) |
| Pagos | MercadoPago SDK (Vercel Serverless Functions) |
| Email | EmailJS |
| Notificaciones | Sonner |
| Deploy | Vercel |

> El proyecto Firebase hoy está en el plan Spark. El backend de pagos de la app Android usa Cloud Functions, que requieren el plan **Blaze**: cuando se despliegue, el proyecto compartido pasa a Blaze.

---

## Estructura

```
src/
├── admin/          # Panel administrador (Dashboard, CRUDs, reseñas, consultas)
├── seller/         # Panel vendedor (HomeSeller)
├── pages/          # Vistas públicas y de usuario
├── components/     # Navbar, Footer, MapaServicio, Testimonials, Cards…
├── hooks/          # useMisReservas, usePerfil, useRegister, useServicios
├── firebase/       # Config + todas las funciones Firestore
├── i18n/           # Traducciones: es.json, en.json, fr.json, pt.json, it.json
├── utils/          # translate.js — getLang(), useLang(), translateServicio()
├── context/        # AuthContext, CarritoContext
└── routes/         # AppRoutes, ProtectedRoute, PublicRoute
api/
├── crearPreferenciaMp.js   # Serverless: crear preferencia MercadoPago
└── webhookMp.js            # Serverless: webhook de notificaciones
```

---

## Instalación

```bash
git clone https://github.com/GereeOK/proyecto-agencia
cd proyecto-agencia
npm install
npm run dev
```

### Variables de entorno

**Frontend (opcionales en desarrollo).** `src/firebase/config.js` trae como valores por defecto los del proyecto `baires-essence`, así que `npm run dev` funciona sin `.env`. Para apuntar a otro proyecto Firebase, crear `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Serverless de pagos (`api/`, se configuran en Vercel):**

| Variable | Uso |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago (crea preferencias y consulta pagos) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON de la service account de Firebase; el webhook la usa para actualizar la reserva |
| `APP_URL` | URL pública de la web, para las URLs de retorno de MercadoPago. Opcional: si falta se usa `VERCEL_URL`, y en local `http://localhost:5173` |

---

## Roles y permisos

| Rol | Rutas |
|---|---|
| `user` | `/servicios` `/mis-reservas` `/favoritos` `/perfil` |
| `seller` | Todo lo anterior + `/seller` |
| `admin` | Todo lo anterior + `/admin` |

Los usuarios con `activo: false` son redirigidos al login automáticamente.

---

## Colecciones Firestore

| Colección | Descripción |
|---|---|
| `users` | Perfiles, roles, grupo familiar |
| `servicios` | Experiencias + traducciones automáticas (`title_en`, `title_fr`…) |
| `reservas` | Estado, pasajeros, fechas y horarios por actividad |
| `reservas/{id}/mensajes` | Chat en tiempo real |
| `messages` | Consultas del formulario de contacto |
| `companies` | Datos de empresa para sellers |
| `resenas` | Reseñas post-experiencia (experiencia / empresa / plataforma) |
| `favoritos/{uid}/items` | Experiencias guardadas por usuario |

---

## Estados de una reserva

```
pendiente → confirmada_usuario → confirmada → pagada → finalizada
                                      ↓
                                  cancelada
```

---

## Internacionalización

La UI está disponible en 5 idiomas (ES / EN / FR / PT / IT).

El contenido dinámico (título, descripción e incluye de cada experiencia) **se traduce automáticamente al guardar** desde el panel seller, usando la API gratuita de MyMemory. La interfaz usa `getLang(servicio, campo, idioma)` con fallback al español.

---

## Deploy

1. Importar el repo en [vercel.com](https://vercel.com) → Framework: **Vite**
2. Agregar las variables de entorno (ver [Variables de entorno](#variables-de-entorno))
3. Deploy automático en cada push a `main`
4. Configurar el webhook de MercadoPago: `https://tu-app.vercel.app/api/webhookMp`
5. Deployar las reglas de Firestore: `firebase deploy --only firestore:rules` (mantenerlas iguales a las del repo de la app)

> **Importante:** el `firebase.json` de este repo solo configura las reglas de Firestore, a propósito. El Hosting de Firebase lo despliega la app Android (`BairesEssence_Mobile`), porque expone en `https://baires-essence.web.app` las rutas de la API de pagos de la app. No agregar un bloque `hosting` acá: un deploy desde este repo pisaría esas rutas.

---

## Cuentas de prueba

Las contraseñas **no se publican** en el repo; pedirlas al equipo.

| Rol | Nombre | Email | Datos de prueba |
|---|---|---|---|
| Admin | — | admin@admin.com | — |
| Seller | María González (BA Tango Experience) | tangobaires@seller.com | — |
| Seller | Carlos Pérez (Sabores Buenos Aires) | saboresba@seller.com | — |
| Seller | Laura Fernández (Verde y Movimiento BA) | verdeymba@seller.com | — |
| User | Sophie Anderson (EE. UU.) | sofiamtz@gmail.com | Reserva finalizada + reseñas |
| User | Lucas Herrera (Brasil) | lucasherrera.ba@gmail.com | Reserva finalizada + reseñas |
| User | Facundo Morales (Argentina) | facundomorales@gmail.com | Reserva confirmada + chat con seller |
| User | Florencia Benítez (Argentina) | florenciabenitez@gmail.com | Reserva pagada (familia de 4) |
| User | Gonzalo Mendoza (Argentina) | gonzalomendoza@gmail.com | Power user — 3 reservas en distintos estados |

---

## Licencia

Proyecto académico — uso libre con fines educativos.
