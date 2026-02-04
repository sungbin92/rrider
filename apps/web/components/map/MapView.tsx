"use client";

import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

import type { LatLngTuple } from "leaflet";

type Props = {
  route?: {
    polyline: string;
  };
  places: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    category?: string;
  }[];
  waypoints?: {
    lat: number;
    lng: number;
  }[];
};

let leafletLoaded = false;

export function MapView({ route, places, waypoints = [] }: Props) {
  const [RL, setRL] = useState<any>(null);

  // ✅ Leaflet + react-leaflet는 앱 전체에서 딱 1번만 로드
  useEffect(() => {
    if (leafletLoaded) return;

    leafletLoaded = true;

    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([L, RL]) => {
        // marker icon fix (전역 1회)
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        setRL({ L, ...RL });
      }
    );
  }, []);

  // ✅ polyline decode (타입 명확)
  const path: LatLngTuple[] = useMemo(() => {
    if (!route?.polyline) return [];
    return polyline.decode(route.polyline) as LatLngTuple[];
  }, [route?.polyline]);

  if (!RL) {
    return (
      <div className="h-[500px] w-full rounded-2xl bg-zinc-100 animate-pulse" />
    );
  }

  const { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, L } = RL;

  function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
    const map = useMap();

    useEffect(() => {
      if (bounds.length > 0) {
        // 유효한 좌표만 필터링
        const validBounds = bounds.filter(
          (coord) =>
            typeof coord[0] === "number" && typeof coord[1] === "number"
        );

        if (validBounds.length > 0) {
          map.fitBounds(validBounds, {
            padding: [40, 40],
          });
        }
      }
    }, [bounds, map]);

    return null;
  }

  const boundsPoints: LatLngTuple[] =
    path.length > 0
      ? path
      : [
          ...places.map((p) => [p.lat, p.lng] as LatLngTuple),
          ...waypoints.map((wp) => [wp.lat, wp.lng] as LatLngTuple),
        ];

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border shadow-sm">
      <MapContainer className="h-full w-full" zoom={13}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {path.length > 0 && (
          <Polyline
            positions={path}
            pathOptions={{
              weight: 5,
              opacity: 0.75,
            }}
          />
        )}

        {places.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <div className="font-semibold text-sm">{p.name}</div>
              {p.category && (
                <div className="text-[10px] text-gray-500 uppercase">
                  {p.category}
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {waypoints.map((wp, i) => {
          // 유효한 좌표만 렌더링
          if (typeof wp.lat !== "number" || typeof wp.lng !== "number") {
            return null;
          }
          return (
            <Marker key={`wp-${i}`} position={[wp.lat, wp.lng]} opacity={0.7}>
              <Popup>
                <div className="font-semibold text-sm">경유지 {i + 1}</div>
              </Popup>
            </Marker>
          );
        })}

        {boundsPoints.length > 0 && <FitBounds bounds={boundsPoints} />}
      </MapContainer>
    </div>
  );
}
