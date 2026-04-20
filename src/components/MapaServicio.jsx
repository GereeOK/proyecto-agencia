// MapaServicio.jsx
// Componente reutilizable de Leaflet + OpenStreetMap.
// Se usa en tres lugares:
//   1. Modal de detalle en Servicios.jsx (turista ve dónde está la experiencia)
//   2. Formulario de Admin/Seller al cargar o editar un servicio (poner el pin)
//   3. Mis Reservas — detalle de reserva (turista ve dónde va)
//
// No requiere API key. Solo necesita:
//   npm install leaflet react-leaflet
// y el CSS de Leaflet importado en main.jsx (ver paso a paso al final del archivo).

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// ── Fix del ícono roto de Leaflet en Vite/Webpack
// (Leaflet busca los íconos con rutas relativas que Vite rompe al bundlear)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Sub-componente: captura clicks en el mapa para mover el marcador (modo edición)
const ClickHandler = ({ onClickMap }) => {
  useMapEvents({
    click(e) {
      if (onClickMap) {
        onClickMap({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

// ── Componente principal
// Props:
//   lat, lng      → coordenadas del marcador (obligatorio para mostrar)
//   titulo        → texto del popup
//   editable      → boolean: si true, hacer click en el mapa mueve el pin
//   onChangeCoords → callback(lat, lng) cuando el usuario mueve el pin (modo edición)
//   height        → altura del mapa (default "250px")
const MapaServicio = ({
  lat,
  lng,
  titulo = "Punto de encuentro",
  editable = false,
  onChangeCoords,
  height = "250px",
}) => {
  // Si no hay coordenadas válidas, no renderizar el mapa
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const coordsValidas = !isNaN(latNum) && !isNaN(lngNum);

  if (!coordsValidas) {
    if (!editable) return null;
    // En modo edición sin coordenadas, mostrar el mapa centrado en Buenos Aires
    // para que el seller pueda hacer click y asignar una ubicación
  }

  // Centro por defecto: Buenos Aires
  const center = coordsValidas ? [latNum, lngNum] : [-34.6037, -58.3816];

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-gray-200 z-0">
      <MapContainer
        center={center}
        zoom={coordsValidas ? 15 : 12}
        style={{ height: "100%", width: "100%" }}
        // scrollWheelZoom desactivado para no interferir con el scroll de la página
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcador: solo si hay coordenadas */}
        {coordsValidas && (
          <Marker position={[latNum, lngNum]}>
            <Popup>
              <strong>{titulo}</strong>
            </Popup>
          </Marker>
        )}

        {/* Handler de clicks solo en modo edición */}
        {editable && (
          <ClickHandler
            onClickMap={({ lat: newLat, lng: newLng }) => {
              if (onChangeCoords) onChangeCoords(newLat, newLng);
            }}
          />
        )}
      </MapContainer>

      {/* Instrucción visual en modo edición */}
      {editable && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          {coordsValidas
            ? `📍 ${latNum.toFixed(5)}, ${lngNum.toFixed(5)} — Hacé click para mover el pin`
            : "Hacé click en el mapa para ubicar la experiencia"}
        </p>
      )}
    </div>
  );
};

export default MapaServicio;

/*
──────────────────────────────────────────────────────────────
PASO A PASO PARA DEJARLO ANDANDO
──────────────────────────────────────────────────────────────

1. INSTALAR DEPENDENCIAS
   En la carpeta raíz del proyecto:

   npm install leaflet react-leaflet

2. IMPORTAR EL CSS DE LEAFLET EN main.jsx
   Abrí src/main.jsx y agregá esta línea ANTES de tu import de index.css:

   import "leaflet/dist/leaflet.css";

   Quedará así:
     import "leaflet/dist/leaflet.css";
     import "./index.css";
     import React from "react";
     ...

3. AGREGAR lat Y lng A LOS SERVICIOS EN FIRESTORE
   Cada documento en la colección "servicios" necesita dos campos nuevos:
     lat: number  (ej: -34.6412)
     lng: number  (ej: -58.4226)
   Podés hacerlo con el script de importación que está en
   src/scripts/importarServicios.js (ver instrucciones en ese archivo).

4. USO EN LOS TRES LUGARES
   a) Modal de detalle (Servicios.jsx) → ya integrado, muestra el mapa si lat/lng existen
   b) Formulario admin/seller → ya integrado en Servicios.jsx del admin con modo editable
   c) Mis Reservas → ya integrado en mis-reservas.jsx mostrando el mapa por servicio

──────────────────────────────────────────────────────────────
*/
