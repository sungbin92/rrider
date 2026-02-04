'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { GpxDownloadButton } from '@/components/GpxDownloadButton';
import { PlanActions } from './plan-actions';
import { RouteEditor } from './route-editor';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import dynamic from 'next/dynamic';

const MapboxRouteView = dynamic(
  () => import('@/components/map/MapboxRouteView').then((mod) => mod.MapboxRouteView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-xl bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400">
        지도를 불러오는 중...
      </div>
    ),
  }
);

type Overview = {
  plan: {
    id: string;
    title: string;
    rideDate: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    waypoints: Array<{ lat: number; lng: number } | [number, number]> | null;
  };
  route?: {
    polyline: string;
    distance: number;
    duration: number;
    instructions?: Array<{ text: string; distance: number; time: number }>;
  };
  places: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    category: string;
    rating?: number;
    address?: string;
  }[];
  recommendation: {
    summary: string;
    places: Array<{
      id: string;
      name: string;
      category: string;
    }>;
  } | null;
};

function normalizeWaypoints(
  waypoints: Array<{ lat: number; lng: number } | [number, number]> | null
): { lat: number; lng: number }[] {
  if (!waypoints) return [];
  return waypoints.map((wp) => {
    if (Array.isArray(wp)) {
      return { lat: wp[0], lng: wp[1] };
    }
    return wp;
  });
}

function getPointsFromPlan(plan: {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  waypoints: Array<{ lat: number; lng: number } | [number, number]> | null;
}): [number, number][] {
  const points: [number, number][] = [[plan.startLat, plan.startLng]];

  if (plan.waypoints) {
    for (const wp of plan.waypoints) {
      if (Array.isArray(wp)) {
        points.push([wp[0], wp[1]]);
      } else {
        points.push([wp.lat, wp.lng]);
      }
    }
  }

  // Add end point if different from start
  if (plan.endLat !== plan.startLat || plan.endLng !== plan.startLng) {
    points.push([plan.endLat, plan.endLng]);
  }

  return points;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("cafe") || lower.includes("카페")) return "☕";
  if (lower.includes("restaurant") || lower.includes("음식")) return "🍽️";
  if (lower.includes("bakery") || lower.includes("베이커리")) return "🥐";
  if (lower.includes("bar") || lower.includes("바")) return "🍺";
  return "📍";
}

type LatLngTuple = [number, number];

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const overview = await api<Overview>(`/plans/${id}/overview`);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    fetchPlan();
  }, [isAuthenticated, authLoading, fetchPlan]);

  if (authLoading || isLoading) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-zinc-500">로딩 중...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Plan not found'}</p>
          <Link href="/plans" className="text-sm text-zinc-500 hover:text-zinc-700 mt-4 inline-block">
            ← 목록으로
          </Link>
        </div>
      </main>
    );
  }

  const cafes = data.places.filter((p) =>
    p.category.toLowerCase().includes("cafe")
  );
  const restaurants = data.places.filter((p) =>
    p.category.toLowerCase().includes("restaurant")
  );

  return (
    <main className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Link
            href="/plans"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {data.plan.title}
          </h1>
          <p className="text-zinc-500">
            {new Date(data.plan.rideDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        <GpxDownloadButton
          planId={id}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800"
        />
      </div>

      {data.route && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-sm text-zinc-500">거리</div>
            <div className="text-xl font-bold">
              {formatDistance(data.route.distance)}
            </div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-sm text-zinc-500">예상 시간</div>
            <div className="text-xl font-bold">
              {formatDuration(data.route.duration)}
            </div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-sm text-zinc-500">카페</div>
            <div className="text-xl font-bold">{cafes.length}곳</div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <div className="text-sm text-zinc-500">맛집</div>
            <div className="text-xl font-bold">{restaurants.length}곳</div>
          </div>
        </div>
      )}

      <PlanActions
        planId={id}
        hasRoute={!!data.route}
        hasPlaces={data.places.length > 0}
        hasRecommendation={!!data.recommendation}
        onDataChange={fetchPlan}
      />

      {isEditMode ? (
        <RouteEditor
          planId={id}
          initialPoints={getPointsFromPlan(data.plan)}
          encodedPolyline={data.route?.polyline}
          isRoundTrip={
            data.plan.startLat === data.plan.endLat &&
            data.plan.startLng === data.plan.endLng
          }
          onSave={() => {
            setIsEditMode(false);
            fetchPlan();
          }}
          onCancel={() => setIsEditMode(false)}
        />
      ) : (
        <div className="space-y-2">
          {data.route && (
            <MapboxRouteView
              encodedPolyline={data.route.polyline}
              places={data.places}
              waypoints={normalizeWaypoints(data.plan.waypoints)}
            />
          )}
          <button
            onClick={() => setIsEditMode(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            경로 수정하기
          </button>
        </div>
      )}

      {data.recommendation && (
        <section className="rounded-2xl border bg-blue-50/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              AI
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">AI 추천</h2>
          </div>
          <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {data.recommendation.summary}
          </p>
        </section>
      )}

      {data.places.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">추천 장소</h2>
          <div className="grid gap-3">
            {data.places.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:bg-zinc-50 transition-colors"
              >
                <span className="text-2xl">
                  {getCategoryEmoji(place.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900">{place.name}</div>
                  <div className="text-sm text-zinc-500">
                    {place.category}
                    {place.address && ` · ${place.address}`}
                  </div>
                </div>
                {place.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
