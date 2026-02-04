"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface PlanActionsProps {
  planId: string;
  hasRoute: boolean;
  hasPlaces: boolean;
  hasRecommendation: boolean;
  onDataChange?: () => void;
}

type Mood = "chill" | "energetic" | "romantic" | "solo" | "group";
type FoodStyle = "korean" | "western" | "asian" | "cafe" | "any";
type Budget = "low" | "medium" | "high";

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "chill", label: "여유롭게", emoji: "😌" },
  { value: "energetic", label: "활기차게", emoji: "⚡" },
  { value: "romantic", label: "로맨틱", emoji: "💕" },
  { value: "solo", label: "혼자서", emoji: "🧘" },
  { value: "group", label: "여럿이서", emoji: "👥" },
];

const FOOD_OPTIONS: { value: FoodStyle; label: string; emoji: string }[] = [
  { value: "korean", label: "한식", emoji: "🍚" },
  { value: "western", label: "양식", emoji: "🍝" },
  { value: "asian", label: "아시안", emoji: "🍜" },
  { value: "cafe", label: "카페/브런치", emoji: "🥐" },
  { value: "any", label: "상관없음", emoji: "🍽️" },
];

const BUDGET_OPTIONS: { value: Budget; label: string; emoji: string }[] = [
  { value: "low", label: "가성비", emoji: "💰" },
  { value: "medium", label: "적당히", emoji: "💵" },
  { value: "high", label: "좋은 곳", emoji: "💎" },
];

export function PlanActions({
  planId,
  hasRoute,
  hasPlaces,
  hasRecommendation,
  onDataChange,
}: PlanActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Preferences state
  const [mood, setMood] = useState<Mood | null>(null);
  const [foodStyle, setFoodStyle] = useState<FoodStyle | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [customRequest, setCustomRequest] = useState("");

  const searchPlaces = async () => {
    if (!hasRoute) {
      setError("먼저 경로를 계산해주세요.");
      return;
    }
    setLoading("places");
    setError(null);
    try {
      await api(`/plans/${planId}/places/search-along-route`, {
        method: "POST",
      });
      onDataChange?.();
    } catch (err) {
      console.error(err);
      setError("장소 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  };

  const getRecommendation = async () => {
    if (!hasRoute) {
      setError("먼저 경로를 계산해주세요.");
      return;
    }
    if (!hasPlaces) {
      setError("먼저 카페/맛집을 검색해주세요.");
      return;
    }
    setLoading("recommendation");
    setError(null);
    try {
      const body: Record<string, string | undefined> = {};
      if (mood) body.mood = mood;
      if (foodStyle) body.foodStyle = foodStyle;
      if (budget) body.budget = budget;
      if (customRequest.trim()) body.customRequest = customRequest.trim();

      await api(`/recommendation/${planId}/route`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onDataChange?.();
      setShowPreferences(false);
    } catch (err) {
      console.error(err);
      setError("AI 추천 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={searchPlaces}
          disabled={loading !== null || !hasRoute}
          className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {loading === "places" ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> 검색 중...
            </span>
          ) : (
            <>☕ 카페/맛집 검색</>
          )}
        </button>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          disabled={loading !== null || !hasRoute}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            showPreferences
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-zinc-300 hover:bg-zinc-50"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          🤖 AI 추천 받기
        </button>
      </div>

      {showPreferences && (
        <div className="rounded-xl border bg-zinc-50/50 p-4 space-y-4">
          <div className="text-sm font-medium text-zinc-700">
            어떤 분위기를 원하시나요? (선택사항)
          </div>

          {/* Mood Selection */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">분위기</div>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setMood(mood === option.value ? null : option.value)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    mood === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food Style Selection */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">음식 선호</div>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFoodStyle(foodStyle === option.value ? null : option.value)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    foodStyle === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Selection */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">예산</div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setBudget(budget === option.value ? null : option.value)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    budget === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Request */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">추가 요청사항</div>
            <input
              type="text"
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              placeholder="예: 뷰가 좋은 곳, 주차 가능한 곳, 테라스 있는 카페..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={getRecommendation}
            disabled={loading !== null || !hasPlaces}
            className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "recommendation" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> AI가 추천 생성 중...
              </span>
            ) : (
              "추천 받기"
            )}
          </button>

          {!hasPlaces && (
            <div className="text-xs text-amber-600 text-center">
              먼저 "카페/맛집 검색" 버튼을 눌러 장소를 검색해주세요.
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
