'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

function ClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPositionChange(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 1.5 })
  }, [position, map])
  return null
}

interface Props {
  position: [number, number] | null
  onPositionChange: (lat: number, lon: number) => void
}

export default function FarmMap({ position, onPositionChange }: Props) {
  return (
    <div className="relative">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '350px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPositionChange={onPositionChange} />
        <FlyTo position={position} />
        {position && <Marker position={position} icon={greenIcon} />}
      </MapContainer>

      {position && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-mono shadow">
          📍 {position[0].toFixed(4)}°N, {position[1].toFixed(4)}°E
        </div>
      )}
    </div>
  )
}
