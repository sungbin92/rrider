'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/lib/auth/context';

type Plan = {
  id: string;
  title: string;
  rideDate: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  createdAt: string;
  route?: {
    distance: number;
    duration: number;
  };
};

export default function PlansPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    async function fetchPlans() {
      try {
        const data = await api<Plan[]>('/plans');
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-zinc-500">로딩 중...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">라이딩 플랜</h1>
          <p className="text-muted-foreground">
            저장된 라이딩 플랜 목록입니다.
          </p>
        </div>
        <Link
          href="/plans/new"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800"
        >
          새 플랜 만들기
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚴‍♂️</div>
          <h2 className="text-xl font-semibold mb-2">플랜이 없습니다</h2>
          <p className="text-zinc-600 mb-6">
            새로운 라이딩 플랜을 만들어보세요!
          </p>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800"
          >
            플랜 생성하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="block group"
            >
              <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow group-hover:border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-black">
                      {plan.title}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {format(new Date(plan.rideDate), "PPP", { locale: ko })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">생성일</p>
                    <p className="text-sm font-medium">
                      {format(new Date(plan.createdAt), "yyyy.MM.dd", {
                        locale: ko,
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">출발</span>
                    <p className="font-medium">
                      {plan.startLat.toFixed(5)}, {plan.startLng.toFixed(5)}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">도착</span>
                    <p className="font-medium">
                      {plan.endLat.toFixed(5)}, {plan.endLng.toFixed(5)}
                    </p>
                  </div>
                  {plan.route && (
                    <div>
                      <span className="text-zinc-500">거리</span>
                      <p className="font-medium">
                        {(plan.route.distance / 1000).toFixed(1)}km
                      </p>
                      <span className="text-zinc-500">시간</span>
                      <p className="font-medium">
                        {(plan.route.duration / 60).toFixed(0)}분
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
