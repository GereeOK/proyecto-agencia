# Baires Essence — Web App (Administración y Sellers)

La Web App de **Baires Essence** es el panel administrativo donde agencias, prestadores y administradores gestionan experiencias turísticas, usuarios, disponibilidad y reservas en tiempo real.  
Está desarrollada con **React + Vite**, Tailwind CSS y Firebase (Firestore, Auth y Storage).

---

## 🚀 Características Principales

- Gestión completa de experiencias turísticas (ABM).
- Gestión de usuarios registrados y roles.
- Panel con reservas efectuadas por los turistas mediante la app Mobile.
- Dashboard estadístico.
- Integración nativa con Firebase Firestore y Firebase Auth.
- Interfaz responsive basada en **Tailwind CSS** (componentes obtenidos desde tailblocks.cc).

---

## 🏗️ Arquitectura Técnica

- **React 18 + Vite**  
  Vite ofrece hot module replacement (HMR), build ultrarrápida y un entorno moderno de desarrollo.
- **Tailwind CSS** con utilidades y bloques de diseño basados en **Tailblocks**.
- **Firebase (modular v9+)**
  - Firestore (CRUD, consultas, sincronización realtime).
  - Firebase Auth (Google OAuth).
  - Firebase Storage (imágenes de experiencias).
- **ESLint** para estandarización de código (opción expandible a TS lint-rules).

### Plugins React + Vite
El proyecto utiliza los plugins oficiales:

- `@vitejs/plugin-react` (Babel + Fast Refresh)  
  o  
- `@vitejs/plugin-react-swc` (basado en SWC para compilación más rápida)

Ambos compatibles y soportados por Vite.

---

## 📦 Instalación de Dependencias

Cloná el repositorio:

```bash
git clone https://github.com/GereeOK/proyecto-agencia
cd proyecto-agencia
```
Instalá las dependencias:
```bash
npm install
```
## ▶️ Ejecutar el Proyecto en Local
```bash
npm run dev
```
## 🧰 Estructura del Proyecto
```bash
/src
 ├── assets/              # Imágenes, íconos
 ├── components/          # Componentes UI reutilizables
 ├── firebase/            # Configuración Firebase modular
 ├── pages/               # Vistas principales (admin, sellers, dashboard)
 ├── hooks/               # Hooks personalizados
 ├── styles/              # Archivos globales Tailwind
 └── main.jsx             # Punto de entrada
```
## 🎨 UI y Componentes (Tailwind + Tailblocks)

Toda la interfaz está construida con Tailwind CSS, utilizando:

- Utilidades personalizadas (p-4, flex, grid, rounded-xl, etc.)

- Bloques base importados desde https://tailblocks.cc/
(cards, headers, secciones hero, formularios, grids responsivas)

Esto asegura una UI limpia, moderna y completamente responsiva.

## 🔐 Variables de Entorno (Obligatorias)

Crear un archivo .env en la raíz con:
```bash
VITE_FIREBASE_API_KEY=YOUR_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```
⚠️ Sin estas claves, la Web App no podrá conectarse a Firebase.

## 🧪 ESLint – Recomendaciones

React + Vite viene con un ESLint base, pero para aplicar reglas robustas se recomienda:

- Integrar TypeScript (opcional)

- Agregar typescript-eslint con reglas type-aware<br>Ver: https://typescript-eslint.io

- Usar el template oficial de React + TS para proyectos de producción:<br>https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts

## 📄 Licencia

Proyecto académico / prototipo funcional — uso libre para fines educativos.
