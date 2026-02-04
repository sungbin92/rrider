"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// Dynamic import for Mapbox components to avoid SSR issues
import dynamic from "next/dynamic";

type LatLngTuple = [number, number];

const MapboxRoutePicker = dynamic(
  () =>
    import("@/components/map/MapboxRoutePicker").then(
      (mod) => mod.MapboxRoutePicker
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-xl bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400">
        지도를 불러오는 중...
      </div>
    ),
  }
);

// ORS free tier: max 50 points total sent to API
const MAX_ROUTE_POINTS = 50;

export function CreatePlanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    rideDate: new Date().toISOString().split("T")[0],
    points: [] as LatLngTuple[],
    isRoundTrip: false,
  });

  // Round trip adds start point again as end, so we need 1 less slot
  const maxPointsInUI = formData.isRoundTrip
    ? MAX_ROUTE_POINTS - 1
    : MAX_ROUTE_POINTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.points.length < 2 && !formData.isRoundTrip) {
      setError("최소 2개의 포인트(출발지, 도착지)를 선택해주세요.");
      return;
    }

    if (formData.points.length < 1) {
      setError("출발지를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      // Extract start, end, and waypoints from points array
      const start = formData.points[0];
      const end = formData.isRoundTrip
        ? formData.points[0] // Round trip: end = start
        : formData.points[formData.points.length - 1];
      const waypoints = formData.isRoundTrip
        ? formData.points.slice(1) // All points after start are waypoints
        : formData.points.slice(1, -1); // Points between start and end

      // 1. Plan 생성
      const planRes = await api<{ id: string }>("/plans", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          rideDate: formData.rideDate,
          startLat: start[0],
          startLng: start[1],
          endLat: end[0],
          endLng: end[1],
          waypoints: waypoints.length > 0 ? waypoints : undefined,
        }),
      });

      // 2. Route 계산 (GraphHopper via Backend)
      const routeData = await api<{
        distance: number;
        duration: number;
        polyline: string;
        instructions?: Array<{ text: string; distance: number; time: number }>;
        snappedWaypoints?: Array<{ lat: number; lng: number }>;
      }>(`/plans/${planRes.id}/route/calculate`, {
        method: "POST",
      });

      console.log("Route calculated:", {
        distance: routeData.distance,
        duration: routeData.duration,
        polylineLength: routeData.polyline.length,
      });

      router.push(`/plans/${planRes.id}`);
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류";
      setError(`계획 생성 중 오류: ${errorMessage}`);
      console.error("Plan creation error:", err);
      setLoading(false);
    }
  };

  const getPointLabel = (index: number) => {
    if (index === 0) return "출발";
    if (!formData.isRoundTrip && index === formData.points.length - 1)
      return "도착";
    return "경유";
  };

  const getPointColor = (index: number) => {
    if (index === 0) return "text-green-600 bg-green-50";
    if (!formData.isRoundTrip && index === formData.points.length - 1)
      return "text-red-600 bg-red-50";
    return "text-blue-600 bg-blue-50";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="title" className="font-medium">
            제목
          </label>
          <input
            id="title"
            type="text"
            required
            className="w-full rounded-md border border-zinc-300 p-2"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="예: 주말 한강 라이딩"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="rideDate" className="font-medium">
            날짜
          </label>
          <input
            id="rideDate"
            type="date"
            required
            className="w-full rounded-md border border-zinc-300 p-2"
            value={formData.rideDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rideDate: e.target.value }))
            }
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="font-medium">경로 설정</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRoundTrip}
                onChange={(e) => {
                  const isRoundTrip = e.target.checked;
                  const newMaxPoints = isRoundTrip
                    ? MAX_ROUTE_POINTS - 1
                    : MAX_ROUTE_POINTS;
                  setFormData((prev) => ({
                    ...prev,
                    isRoundTrip,
                    // Truncate points if exceeding new limit
                    points: prev.points.slice(0, newMaxPoints),
                  }));
                }}
                className="rounded border-zinc-300"
              />
              <span>Round Trip (출발지로 돌아오기)</span>
            </label>
          </div>

          <p className="text-sm text-zinc-500">
            지도를 클릭하여 포인트를 추가하세요. 마커를 클릭하면 삭제됩니다.
            {formData.isRoundTrip
              ? " (Round Trip: 마지막 포인트에서 출발지로 돌아옵니다)"
              : " (마지막 포인트가 도착지가 됩니다)"}
          </p>

          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>
              포인트: {formData.points.length} / {maxPointsInUI}
              {formData.isRoundTrip && " (+ 출발지 복귀)"}
            </span>
            {formData.points.length >= maxPointsInUI && (
              <span className="text-amber-600">최대 포인트 수에 도달했습니다</span>
            )}
          </div>

          <MapboxRoutePicker
            points={formData.points}
            onPointsChange={(points) =>
              setFormData((prev) => ({ ...prev, points }))
            }
            isRoundTrip={formData.isRoundTrip}
            maxPoints={maxPointsInUI}
          />

          {/* Point list */}
          {formData.points.length > 0 && (
            <div className="space-y-2 mt-2">
              {formData.points.map((point, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-md ${getPointColor(index)}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-6 h-6 flex items-center justify-center rounded-full bg-white/50">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {getPointLabel(index)}
                    </span>
                    <span className="text-sm opacity-75">
                      {point[0].toFixed(5)}, {point[1].toFixed(5)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        points: prev.points.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-sm hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {formData.isRoundTrip && formData.points.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md text-green-600 bg-green-50 opacity-60">
                  <span className="font-bold w-6 h-6 flex items-center justify-center rounded-full bg-white/50">
                    ↩
                  </span>
                  <span className="text-sm font-medium">출발지로 복귀</span>
                </div>
              )}
            </div>
          )}

          {formData.points.length === 0 && (
            <div className="text-center py-4 text-zinc-400 text-sm">
              지도를 클릭하여 첫 번째 포인트(출발지)를 추가하세요.
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-md py-3 font-medium hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "생성 중..." : "계획 생성하기"}
      </button>
    </form>
  );
}
