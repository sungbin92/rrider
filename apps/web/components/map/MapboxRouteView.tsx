"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import polyline from "@mapbox/polyline";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export type LatLngTuple = [number, number];

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  rating?: number;
}

interface MapboxRouteViewProps {
  encodedPolyline: string;
  places?: Place[];
  waypoints?: LatLngTuple[] | Array<{ lat: number; lng: number }>;
}

export function MapboxRouteView({
  encodedPolyline,
  places = [],
  waypoints = [],
}: MapboxRouteViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Decode polyline
    const coordinates = polyline.decode(encodedPolyline);

    // Convert to GeoJSON format [lng, lat]
    const routeCoords = coordinates.map(
      ([lat, lng]) => [lng, lat] as [number, number]
    );

    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds();
    routeCoords.forEach((coord) => bounds.extend(coord));

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      bounds: bounds,
      fitBoundsOptions: { padding: 50 },
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Add route line
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoords,
          },
        },
      });

      // Route outline (for better visibility)
      map.current.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1e40af",
          "line-width": 8,
          "line-opacity": 0.4,
        },
      });

      // Route line
      map.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      });

      // Add start marker
      if (routeCoords.length > 0) {
        new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat(routeCoords[0])
          .setPopup(new mapboxgl.Popup().setHTML("<b>출발</b>"))
          .addTo(map.current);
      }

      // Add end marker
      if (routeCoords.length > 1) {
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat(routeCoords[routeCoords.length - 1])
          .setPopup(new mapboxgl.Popup().setHTML("<b>도착</b>"))
          .addTo(map.current);
      }

      // Add waypoint markers
      const normalizedWaypoints = waypoints.map((wp) => {
        if (Array.isArray(wp)) {
          return { lat: wp[0], lng: wp[1] };
        }
        return wp;
      });

      normalizedWaypoints.forEach((wp, index) => {
        // Skip first and last (start/end)
        if (index === 0 || index === normalizedWaypoints.length - 1) return;

        const el = document.createElement("div");
        el.innerHTML = `
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
            ${index + 1}
          </div>
        `;

        new mapboxgl.Marker({ element: el })
          .setLngLat([wp.lng, wp.lat])
          .addTo(map.current!);
      });

      // Add place markers
      places.forEach((place) => {
        const isCafe =
          place.category.toLowerCase().includes("카페") ||
          place.category.toLowerCase().includes("cafe");

        const el = document.createElement("div");
        el.innerHTML = `
          <div style="
            font-size: 20px;
            cursor: pointer;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
          ">
            ${isCafe ? "☕" : "🍽️"}
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 4px;">
            <b>${place.name}</b>
            <div style="font-size: 12px; color: #666;">${place.category}</div>
            ${place.rating ? `<div style="font-size: 12px;">⭐ ${place.rating}</div>` : ""}
          </div>
        `);

        new mapboxgl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [encodedPolyline, places, waypoints]);

  return (
    <div
      ref={mapContainer}
      className="h-[400px] w-full rounded-xl overflow-hidden border shadow-sm"
    />
  );
}
