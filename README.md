# 🌆 Baires Essence

> Plataforma de turismo en Buenos Aires — reservá experiencias auténticas, gestionadas por guías locales.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![i18n](https://img.shields.io/badge/i18n-ES/EN/FR/PT/IT-6366F1?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square)

---

## ¿Qué es?

Baires Essence conecta a turistas con guías y agencias porteñas. El turista elige experiencias (city tours, gastronomía, tango, polo, kayak…), las arma en un carrito, reserva y paga. El guía las gestiona desde su panel. El admin supervisa todo.

---

## ✨ Funcionalidades

### 🧳 Turistas
- Catálogo con filtros por categoría y búsqueda en tiempo real
- Modal de detalle con mapa (Leaflet), reseñas y contacto directo al guía (WhatsApp / email)
- Carrito multi-experiencia con selección de personas
- Reserva con lista de pasajeros, fechas y horarios por actividad
- Pago online con MercadoPago
- Historial de reservas + calificación post-experiencia
- Favoritos guardados
- Interfaz en 5 idiomas: ES / EN / FR / PT / IT

### 🏪 Vendedores (panel seller)
- CRUD de experiencias con mapa interactivo
- Auto-traducción al guardar: el contenido en español se traduce automáticamente a EN/FR/PT/IT
- Reservas en tiempo real (`onSnapshot`)
- Chat con turistas por reserva
- Calendario mensual de actividades
- Exportación CSV

### 🛠️ Administradores (panel admin)
- Dashboard con KPIs: reservas, ingresos, tasa de conversión, reseñas promedio
- Gráficos de barras, torta y área (Recharts)
- Panel de reseñas: filtros, ocultar, respuesta por email
- Panel de consultas: respuesta con EmailJS
- CRUD completo: usuarios, experiencias, reservas
- Gestión de roles y activación/desactivación de cuentas

---

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Estilos | Tailwind CSS |
| Base de datos | Firebase Firestore (plan Spark) |
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

---

## 📁 Estructura

```
src/
├── admin/          # Panel administrador (Dashboard, CRUDs, reseñas, consultas)
├── seller/         # Panel vendedor (HomeSeller)
├── pages/          # Vistas públicas y de usuario
├── components/     # Navbar, Footer, MapaServicio, Testimonials, Cards…
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

## 🚀 Instalación

```bash
git clone https://github.com/GereeOK/proyecto-agencia
cd proyecto-agencia
npm install
npm run dev
```

### Variables de entorno

Crear `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Solo para producción (Vercel)
MP_ACCESS_TOKEN=
```

---

## 👥 Roles y permisos

| Rol | Rutas |
|---|---|
| `user` | `/servicios` `/mis-reservas` `/favoritos` `/perfil` |
| `seller` | Todo lo anterior + `/seller` |
| `admin` | Todo lo anterior + `/admin` |

Los usuarios con `activo: false` son redirigidos al login automáticamente.

---

## 🗄️ Colecciones Firestore

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

## 🔄 Flujo de estados de una reserva

```
pendiente → confirmada_usuario → confirmada → pagada → finalizada
                                      ↓
                                  cancelada
```

---

## 🌐 Internacionalización

La UI está disponible en 5 idiomas (ES / EN / FR / PT / IT).

El contenido dinámico (título, descripción e incluye de cada experiencia) **se traduce automáticamente al guardar** desde el panel seller, usando la API gratuita de MyMemory. La interfaz usa `getLang(servicio, campo, idioma)` con fallback al español.

---

## ☁️ Deploy (Vercel)

1. Importar repo en [vercel.com](https://vercel.com) → Framework: **Vite**
2. Agregar variables de entorno (`VITE_FIREBASE_*` + `MP_ACCESS_TOKEN`)
3. Deploy automático en cada push a `main`
4. Configurar webhook: `https://tu-app.vercel.app/api/webhookMp`
5. Deployar reglas Firestore: `firebase deploy --only firestore:rules`

---

## 🧪 Usuarios de prueba

### Admin
| Email | Password |
|-------|----------|
| admin@admin.com | Admin123 |

### Sellers
| Nombre | Empresa | Email | Password |
|--------|---------|-------|----------|
| María González | BA Tango Experience | tangobaires@seller.com | Tango2026! |
| Carlos Pérez | Sabores Buenos Aires | saboresba@seller.com | Sabores2026! |
| Laura Fernández | Verde y Movimiento BA | verdeymba@seller.com | Verde2026! |

### Users (password común: `User2026!`)
| Nombre | Email | Estado |
|--------|-------|--------|
| Sophie Anderson 🇺🇸 | sofiamtz@gmail.com | reserva finalizada + reseñas |
| Lucas Herreira 🇧🇷 | lucasherrera.ba@gmail.com | reserva finalizada + reseñas |
| Facundo Morales 🇦🇷 | facundomorales@gmail.com | reserva confirmada + chat con seller |
| Florencia Benítez 🇦🇷 | florenciabenitez@gmail.com | reserva pagada (familia de 4) |
| Gonzalo Mendoza 🇦🇷 | gonzalomendoza@gmail.com | power user — 3 reservas en distintos estados |

> Las credenciales completas (18 users + 6 sellers) están en `credenciales-testing.txt` (ignorado por git).

---

## 📄 Licencia

Proyecto académico — uso libre con fines educativos.
