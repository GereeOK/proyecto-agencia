# Baires Essence — Plataforma Web de Turismo en Buenos Aires

Plataforma web completa para gestión de experiencias turísticas en Buenos Aires. Permite a turistas explorar y reservar actividades, a vendedores (guías/agencias) gestionar sus experiencias, y a administradores supervisar toda la operación.

---

## Características

### Para turistas
- Catálogo de experiencias con filtros por categoría, precio y disponibilidad
- Reserva con selección de fecha y horario por actividad
- Lista de pasajeros con integración al grupo familiar del perfil
- Chat en tiempo real con el vendedor dentro de cada reserva
- Estado de reserva con máquina de estados dual (usuario + seller confirman)
- Pago online con MercadoPago
- Sección de favoritos (guardados)
- Historial de reservas con calendario de actividades

### Para vendedores (panel seller)
- Alta y gestión de experiencias con mapa interactivo (Leaflet)
- Reservas en tiempo real con `onSnapshot` (actualizaciones automáticas)
- Chat con turistas por reserva
- Confirmación de reservas tras la confirmación del turista
- Calendario mensual de todas las actividades reservadas
- Exportación CSV de reservas con métricas

### Para administradores (panel admin)
- Dashboard con KPIs, gráficos de barras, torta y área (Recharts)
- CRUD completo: usuarios, experiencias, reservas, consultas
- Filtros y búsqueda en todos los listados
- Exportación CSV desde el panel de reservas
- Gestión de roles y activación/desactivación de cuentas

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite |
| Estilos | Tailwind CSS |
| Backend / DB | Firebase Firestore (plan Spark) |
| Auth | Firebase Auth (email + Google OAuth) |
| Mapas | Leaflet + React-Leaflet |
| Gráficos | Recharts |
| Calendario | React Big Calendar + date-fns |
| Pagos | MercadoPago SDK (serverless en Vercel) |
| Email | EmailJS |
| Toasts | Sonner |
| Deploy | Vercel (pendiente) |

---

## Estructura del Proyecto

```
/src
 ├── admin/          # Panel administrador (Dashboard, CRUDs)
 ├── seller/         # Panel vendedor (HomeSeller)
 ├── pages/          # Vistas públicas y de usuario
 ├── components/     # Componentes reutilizables (Navbar, Footer, Mapa, etc.)
 ├── firebase/       # Config Firebase + todas las funciones Firestore
 ├── context/        # AuthContext (usuario autenticado global)
 └── routes/         # AppRoutes + ProtectedRoute + PublicRoute
/api
 ├── crearPreferenciaMp.js   # Serverless: crear preferencia MercadoPago
 └── webhookMp.js            # Serverless: recibir notificaciones de pago
```

---

## Instalación

```bash
git clone https://github.com/GereeOK/proyecto-agencia
cd proyecto-agencia
npm install
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
```

Para MercadoPago (solo necesario en producción / Vercel):
```env
MP_ACCESS_TOKEN=
```

### Desarrollo local

```bash
npm run dev
```

---

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| `user` | `/servicios`, `/mis-reservas`, `/favoritos`, `/perfil` |
| `seller` | Todo lo anterior + `/seller` |
| `admin` | Todo lo anterior + `/admin` (también puede acceder a `/seller`) |

Los usuarios con `activo: false` son redirigidos al login automáticamente.

---

## Colecciones Firestore

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfiles, roles, grupo familiar |
| `servicios` | Experiencias turísticas |
| `reservas` | Reservas con pasajeros, estados y fechas por actividad |
| `reservas/{id}/mensajes` | Chat en tiempo real por reserva |
| `messages` | Consultas del formulario de contacto |
| `companies` | Datos de empresa para sellers |
| `favoritos/{uid}/items` | Experiencias guardadas por usuario |

---

## Estados de Reserva

```
pendiente → confirmada_usuario → confirmada → pagada
                                     ↓
                                  cancelada
```

- `pendiente`: reserva creada, turista completando datos
- `confirmada_usuario`: turista confirmó su parte (datos + pasajeros)
- `confirmada`: seller confirmó → lista para pagar
- `pagada`: pago acreditado por MercadoPago
- `cancelada`: cancelada por seller (con motivo)

---

## Deploy (Vercel)

1. Importar repo en [vercel.com](https://vercel.com) → Framework: **Vite**
2. Agregar variables de entorno (`VITE_FIREBASE_*` + `MP_ACCESS_TOKEN`)
3. Deploy automático
4. Configurar webhook MercadoPago → `https://tu-app.vercel.app/api/webhookMp`
5. Deployar reglas Firestore: `firebase deploy --only firestore:rules`

---

## Licencia

Proyecto académico — uso libre para fines educativos.
