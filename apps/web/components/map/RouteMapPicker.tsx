"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

// Marker icon fix
const fixIcon = () => {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

// Start point marker (green)
const createStartIcon = (number: number) => {
  return L.divIcon({
    html: `
      <div style="
        background: #22c55e;
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Waypoint marker (blue)
const createWaypointIcon = (number: number) => {
  return L.divIcon({
    html: `
      <div style="
        background: #3b82f6;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${number}
      </div>
    `,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// End point marker (red)
const createEndIcon = (number: number) => {
  return L.divIcon({
    html: `
      <div style="
        background: #ef4444;
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export interface RoutePoint {
  position: LatLngTuple;
  type: "start" | "waypoint" | "end";
  number: number;
}

interface RouteMapPickerProps {
  points: LatLngTuple[];
  onPointsChange: (points: LatLngTuple[]) => void;
  isRoundTrip: boolean;
  maxPoints?: number;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (pos: LatLngTuple) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function RouteMarkers({
  points,
  isRoundTrip,
  onRemovePoint,
}: {
  points: LatLngTuple[];
  isRoundTrip: boolean;
  onRemovePoint: (index: number) => void;
}) {
  if (points.length === 0) return null;

  const getMarkerIcon = (index: number, total: number) => {
    const number = index + 1;

    if (index === 0) {
      return createStartIcon(number);
    }

    // If round trip, all points after start are waypoints
    // If not round trip, last point is end
    if (!isRoundTrip && index === total - 1 && total > 1) {
      return createEndIcon(number);
    }

    return createWaypointIcon(number);
  };

  return (
    <>
      {points.map((point, index) => (
        <Marker
          key={`${index}-${point[0]}-${point[1]}`}
          position={point}
          icon={getMarkerIcon(index, points.length)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              onRemovePoint(index);
            },
          }}
        />
      ))}
    </>
  );
}

// ORS free tier allows max 50 points
const DEFAULT_MAX_POINTS = 50;

export function RouteMapPicker({
  points,
  onPointsChange,
  isRoundTrip,
  maxPoints = DEFAULT_MAX_POINTS,
}: RouteMapPickerProps) {
  useEffect(() => {
    fixIcon();
  }, []);

  const canAddMore = points.length < maxPoints;

  const handleMapClick = (pos: LatLngTuple) => {
    if (!canAddMore) return;
    onPointsChange([...points, pos]);
  };

  const handleRemovePoint = (index: number) => {
    onPointsChange(points.filter((_, i) => i !== index));
  };

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border shadow-sm z-0">
      <MapContainer
        center={[37.5665, 126.978]} // Seoul default
        zoom={11}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        <RouteMarkers
          points={points}
          isRoundTrip={isRoundTrip}
          onRemovePoint={handleRemovePoint}
        />
      </MapContainer>
    </div>
  );
}
