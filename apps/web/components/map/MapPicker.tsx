"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

// Marker icon fix
const fixIcon = () => {
  // Remove Leaflet's _getIconUrl property in a type-safe way
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

// Custom waypoint marker icon
const createWaypointIcon = (index: number) => {
  return L.divIcon({
    html: `
      <div style="
        background: #3b82f6;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${index}
      </div>
    `,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLngTuple | null;
  setPosition: (pos: LatLngTuple) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function WaypointMarkers({
  waypoints,
  onRemoveWaypoint,
}: {
  waypoints: LatLngTuple[];
  onRemoveWaypoint: (index: number) => void;
}) {
  return (
    <>
      {waypoints.map((waypoint, index) => (
        <Marker
          key={index}
          position={waypoint}
          icon={createWaypointIcon(index + 1)}
          eventHandlers={{
            click: () => onRemoveWaypoint(index),
          }}
        />
      ))}
    </>
  );
}

interface MapPickerProps {
  value: LatLngTuple | null;
  onChange: (pos: LatLngTuple) => void;
  waypoints?: LatLngTuple[];
  onAddWaypoint?: (pos: LatLngTuple) => void;
  onRemoveWaypoint?: (index: number) => void;
}

export function MapPicker({
  value,
  onChange,
  waypoints = [],
  onAddWaypoint,
  onRemoveWaypoint,
}: MapPickerProps) {
  useEffect(() => {
    fixIcon();
  }, []);

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border shadow-sm z-0">
      <MapContainer
        center={[37.5665, 126.978]} // Seoul default
        zoom={11}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <LocationMarker position={value} setPosition={onChange} />
        {onAddWaypoint && <MapEvents onAddWaypoint={onAddWaypoint} />}
        <WaypointMarkers
          waypoints={waypoints}
          onRemoveWaypoint={onRemoveWaypoint || (() => {})}
        />
      </MapContainer>
    </div>
  );
}

// Component to handle map events
function MapEvents({
  onAddWaypoint,
}: {
  onAddWaypoint: (pos: LatLngTuple) => void;
}) {
  useMapEvents({
    click(e) {
      onAddWaypoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}
