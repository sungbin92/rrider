"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const MapboxRouteEditor = dynamic(
  () =>
    import("@/components/map/MapboxRouteEditor").then(
      (mod) => mod.MapboxRouteEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[450px] w-full rounded-xl bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400">
        지도를 불러오는 중...
      </div>
    ),
  }
);

type LatLngTuple = [number, number];

interface RouteEditorProps {
  planId: string;
  initialPoints: LatLngTuple[];
  encodedPolyline?: string;
  isRoundTrip?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function RouteEditor({
  planId,
  initialPoints,
  encodedPolyline,
  isRoundTrip: initialIsRoundTrip = false,
  onSave,
  onCancel,
}: RouteEditorProps) {
  const [points, setPoints] = useState<LatLngTuple[]>(initialPoints);
  const [isRoundTrip, setIsRoundTrip] = useState(initialIsRoundTrip);
  const [currentPolyline, setCurrentPolyline] = useState(encodedPolyline);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if points or round trip setting have changed
    const pointsChanged =
      JSON.stringify(points) !== JSON.stringify(initialPoints);
    const roundTripChanged = isRoundTrip !== initialIsRoundTrip;
    setHasChanges(pointsChanged || roundTripChanged);
  }, [points, initialPoints, isRoundTrip, initialIsRoundTrip]);

  const handleRecalculate = async () => {
    if (points.length < 2) {
      setError("최소 2개의 포인트가 필요합니다.");
      return;
    }

    setRecalculating(true);
    setError(null);

    try {
      // Update plan with new waypoints
      const start = points[0];
      const end = isRoundTrip ? points[0] : points[points.length - 1];
      const waypointTuples = isRoundTrip ? points.slice(1) : points.slice(1, -1);
      // Convert [lat, lng] tuples to {lat, lng} objects for API
      const waypoints = waypointTuples.map((p) => ({ lat: p[0], lng: p[1] }));

      await api(`/plans/${planId}`, {
        method: "PATCH",
        body: JSON.stringify({
          startLat: start[0],
          startLng: start[1],
          endLat: end[0],
          endLng: end[1],
          waypoints: waypoints.length > 0 ? waypoints : null,
        }),
      });

      // Recalculate route
      const result = await api<{ polyline: string; distance: number; duration: number }>(
        `/plans/${planId}/route/calculate`,
        { method: "POST" }
      );

      setCurrentPolyline(result.polyline);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "경로 재계산 실패");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">경로 수정</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50"
          >
            취소
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating || !hasChanges}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {recalculating ? "계산 중..." : "경로 재계산"}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
          >
            완료
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {hasChanges && (
        <div className="p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
          변경사항이 있습니다. &quot;경로 재계산&quot; 버튼을 눌러 새 경로를 확인하세요.
        </div>
      )}

      {/* Round Trip Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRoundTrip}
          onChange={(e) => setIsRoundTrip(e.target.checked)}
          className="rounded border-zinc-300"
        />
        <span className="text-sm">Round Trip (출발지로 돌아오기)</span>
      </label>

      <MapboxRouteEditor
        points={points}
        onPointsChange={setPoints}
        isRoundTrip={isRoundTrip}
        encodedPolyline={currentPolyline}
      />

      {/* Point list */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-700">포인트 목록</h3>
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {points.map((point, index) => {
            let label = "경유";
            let colorClass = "text-blue-600 bg-blue-50";

            if (index === 0) {
              label = "출발";
              colorClass = "text-green-600 bg-green-50";
            } else if (!isRoundTrip && index === points.length - 1) {
              label = "도착";
              colorClass = "text-red-600 bg-red-50";
            }

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-md ${colorClass}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold w-6 h-6 flex items-center justify-center rounded-full bg-white/50">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm opacity-75">
                    {point[0].toFixed(5)}, {point[1].toFixed(5)}
                  </span>
                </div>
                {points.length > 2 && (
                  <button
                    onClick={() =>
                      setPoints(points.filter((_, i) => i !== index))
                    }
                    className="text-sm hover:opacity-70"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          {isRoundTrip && points.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md text-green-600 bg-green-50 opacity-60">
              <span className="font-bold w-6 h-6 flex items-center justify-center rounded-full bg-white/50">
                ↩
              </span>
              <span className="text-sm font-medium">출발지로 복귀</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
