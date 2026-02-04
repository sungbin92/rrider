"use client";

import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export type LatLngTuple = [number, number];

interface MapboxRoutePickerProps {
  points: LatLngTuple[];
  onPointsChange: (points: LatLngTuple[]) => void;
  isRoundTrip: boolean;
  maxPoints?: number;
}

export function MapboxRoutePicker({
  points,
  onPointsChange,
  isRoundTrip,
  maxPoints = 50,
}: MapboxRoutePickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Create marker element with number
  const createMarkerElement = useCallback(
    (index: number, total: number): HTMLDivElement => {
      const el = document.createElement("div");
      const number = index + 1;

      // Determine color based on position
      let bgColor = "#3b82f6"; // blue for waypoints
      if (index === 0) {
        bgColor = "#22c55e"; // green for start
      } else if (!isRoundTrip && index === total - 1 && total > 1) {
        bgColor = "#ef4444"; // red for end
      }

      el.innerHTML = `
        <div style="
          background: ${bgColor};
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
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${number}
        </div>
      `;

      el.style.cursor = "pointer";
      el.addEventListener("mouseenter", () => {
        el.firstElementChild?.setAttribute(
          "style",
          el.firstElementChild.getAttribute("style") + "transform: scale(1.1);"
        );
      });
      el.addEventListener("mouseleave", () => {
        el.firstElementChild?.setAttribute(
          "style",
          el.firstElementChild
            ?.getAttribute("style")
            ?.replace("transform: scale(1.1);", "") || ""
        );
      });

      return el;
    },
    [isRoundTrip]
  );

  // Update markers when points change
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    points.forEach((point, index) => {
      const el = createMarkerElement(index, points.length);

      // Click to remove
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPointsChange(points.filter((_, i) => i !== index));
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([point[1], point[0]]) // Mapbox uses [lng, lat]
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [points, createMarkerElement, onPointsChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12", // Good for cycling
      center: [126.978, 37.5665], // Seoul
      zoom: 11,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add click handler
    map.current.on("click", (e) => {
      if (points.length >= maxPoints) return;

      const newPoint: LatLngTuple = [e.lngLat.lat, e.lngLat.lng];
      onPointsChange([...points, newPoint]);
    });

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when points change
  useEffect(() => {
    updateMarkers();
  }, [points, isRoundTrip, updateMarkers]);

  // Update click handler when points/maxPoints change
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (points.length >= maxPoints) return;
      const newPoint: LatLngTuple = [e.lngLat.lat, e.lngLat.lng];
      onPointsChange([...points, newPoint]);
    };

    map.current.off("click", handleClick);
    map.current.on("click", handleClick);
  }, [points, maxPoints, onPointsChange]);

  return (
    <div
      ref={mapContainer}
      className="h-[400px] w-full rounded-xl overflow-hidden border shadow-sm"
    />
  );
}
