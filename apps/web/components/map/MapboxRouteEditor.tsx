"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import polyline from "@mapbox/polyline";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export type LatLngTuple = [number, number];

interface MapboxRouteEditorProps {
  points: LatLngTuple[];
  onPointsChange: (points: LatLngTuple[]) => void;
  isRoundTrip: boolean;
  maxPoints?: number;
  encodedPolyline?: string;
}

// Find the closest segment index for inserting a new point
function findClosestSegment(
  clickLat: number,
  clickLng: number,
  points: LatLngTuple[]
): number {
  if (points.length < 2) return points.length;

  let minDist = Infinity;
  let closestIndex = points.length - 1;

  for (let i = 0; i < points.length - 1; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[i + 1];

    // Calculate distance from click to line segment
    const dist = pointToSegmentDistance(
      clickLat,
      clickLng,
      lat1,
      lng1,
      lat2,
      lng2
    );

    if (dist < minDist) {
      minDist = dist;
      closestIndex = i + 1; // Insert after point i
    }
  }

  return closestIndex;
}

// Distance from point to line segment
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

export function MapboxRouteEditor({
  points,
  onPointsChange,
  isRoundTrip,
  maxPoints = 50,
  encodedPolyline,
}: MapboxRouteEditorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);

  // Create marker element with number
  const createMarkerElement = useCallback(
    (index: number, total: number): HTMLDivElement => {
      const el = document.createElement("div");
      const number = index + 1;

      let bgColor = "#3b82f6";
      if (index === 0) {
        bgColor = "#22c55e";
      } else if (!isRoundTrip && index === total - 1 && total > 1) {
        bgColor = "#ef4444";
      }

      el.innerHTML = `
        <div class="marker-inner" style="
          background: ${bgColor};
          color: white;
          border: 3px solid white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          cursor: grab;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        ">
          ${number}
        </div>
      `;

      return el;
    },
    [isRoundTrip]
  );

  // Update route line on map
  const updateRouteLine = useCallback(() => {
    if (!map.current || !styleLoaded) return;

    // Remove existing route layer and source
    if (map.current.getLayer("route-line")) {
      map.current.removeLayer("route-line");
    }
    if (map.current.getLayer("route-outline")) {
      map.current.removeLayer("route-outline");
    }
    if (map.current.getLayer("route-click-target")) {
      map.current.removeLayer("route-click-target");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    if (!encodedPolyline) return;

    try {
      const coordinates = polyline.decode(encodedPolyline);
      const routeCoords = coordinates.map(
        ([lat, lng]) => [lng, lat] as [number, number]
      );

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
          "line-opacity": 0.3,
        },
      });

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

      // Invisible wider line for easier clicking
      map.current.addLayer({
        id: "route-click-target",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "transparent",
          "line-width": 20,
        },
      });
    } catch (e) {
      console.error("Failed to decode polyline:", e);
    }
  }, [encodedPolyline, styleLoaded]);

  // Update markers when points change
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    points.forEach((point, index) => {
      const el = createMarkerElement(index, points.length);

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([point[1], point[0]])
        .addTo(map.current!);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const newPoints = [...points];
        newPoints[index] = [lngLat.lat, lngLat.lng];
        onPointsChange(newPoints);
      });

      el.addEventListener("mousedown", () => {
        const inner = el.querySelector(".marker-inner") as HTMLElement;
        if (inner) {
          inner.style.cursor = "grabbing";
          inner.style.transform = "scale(1.1)";
          inner.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
        }
      });

      marker.on("dragend", () => {
        const inner = el.querySelector(".marker-inner") as HTMLElement;
        if (inner) {
          inner.style.cursor = "grab";
          inner.style.transform = "scale(1)";
          inner.style.boxShadow = "0 3px 8px rgba(0,0,0,0.3)";
        }
      });

      el.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        if (points.length > 2 || (isRoundTrip && points.length > 1)) {
          onPointsChange(points.filter((_, i) => i !== index));
        }
      });

      markers.current.push(marker);
    });
  }, [points, createMarkerElement, onPointsChange, isRoundTrip]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [126.978, 37.5665],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    map.current.on("style.load", () => {
      setStyleLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle map clicks - add point at closest segment
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (points.length >= maxPoints) return;

      const newPoint: LatLngTuple = [e.lngLat.lat, e.lngLat.lng];

      if (points.length < 2) {
        // Just append if less than 2 points
        onPointsChange([...points, newPoint]);
      } else {
        // Find closest segment and insert there
        const insertIndex = findClosestSegment(
          e.lngLat.lat,
          e.lngLat.lng,
          points
        );
        const newPoints = [...points];
        newPoints.splice(insertIndex, 0, newPoint);
        onPointsChange(newPoints);
      }
    };

    // Click on route line to add point
    map.current.on("click", "route-click-target", handleMapClick);

    // Click on empty map area
    map.current.on("click", (e) => {
      // Check if clicked on route or marker
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ["route-click-target"],
      });

      if (features && features.length > 0) {
        // Clicked on route, handled by route-click-target handler
        return;
      }

      // Clicked on empty area - add at the end (before last point if not round trip)
      if (points.length >= maxPoints) return;

      const newPoint: LatLngTuple = [e.lngLat.lat, e.lngLat.lng];

      if (points.length < 2) {
        onPointsChange([...points, newPoint]);
      } else if (isRoundTrip) {
        // Round trip: add at the end
        onPointsChange([...points, newPoint]);
      } else {
        // Normal: insert before last point (end)
        const newPoints = [...points];
        newPoints.splice(points.length - 1, 0, newPoint);
        onPointsChange(newPoints);
      }
    });

    // Change cursor on route hover
    map.current.on("mouseenter", "route-click-target", () => {
      if (map.current) map.current.getCanvas().style.cursor = "copy";
    });

    map.current.on("mouseleave", "route-click-target", () => {
      if (map.current) map.current.getCanvas().style.cursor = "";
    });

    return () => {
      if (map.current) {
        map.current.off("click", "route-click-target", handleMapClick);
      }
    };
  }, [mapLoaded, points, maxPoints, isRoundTrip, onPointsChange]);

  // Fit bounds when points change
  useEffect(() => {
    if (!map.current || !mapLoaded || points.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    points.forEach((point) => bounds.extend([point[1], point[0]]));

    if (points.length > 1) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    } else {
      map.current.setCenter([points[0][1], points[0][0]]);
      map.current.setZoom(13);
    }
  }, [mapLoaded, points.length === 0]);

  // Update markers when points change
  useEffect(() => {
    updateMarkers();
  }, [points, isRoundTrip, updateMarkers]);

  // Update route line when polyline or style changes
  useEffect(() => {
    updateRouteLine();
  }, [updateRouteLine]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainer}
        className="h-[450px] w-full rounded-xl overflow-hidden border shadow-sm"
      />
      <p className="text-xs text-zinc-500">
        💡 마커 드래그로 위치 변경 | 경로선 또는 지도 클릭으로 경유지 추가 | 마커
        더블클릭으로 삭제
      </p>
    </div>
  );
}
