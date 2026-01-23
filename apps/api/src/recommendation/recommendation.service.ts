import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiClient, OpenAiClient } from './ai';
import { buildPromptV1 } from './prompt';
import {
  extractJson,
  RecommendationResult,
  validateRecommendation,
} from './parser';

// 1. plan 조회
// 2. route 조회
// 3. places 조회
// 4. 프롬프트 구성
// 5. AI 호출
// 6. 결과 파싱
// 7. DB 저장

// 예시 프롬프트
// 너는 자전거 라이딩 후 장소를 추천하는 큐레이터다.

// 조건:
// - 라이딩 거리: 28km
// - 소요 시간: 90분
// - 현재 위치 근처 음식점 후보 목록이 주어진다.

// 규칙:
// 1. 너무 무거운 음식은 피한다.
// 2. 회복에 좋은 음식 우선.
// 3. 최대 3곳만 추천.
// 4. 이유를 한 문장으로 설명.

// 후보 목록:
// [
//   { "id": "p1", "name": "성수 국밥", "category": "한식", "rating": 4.6 },
//   { "id": "p2", "name": "OO 파스타", "category": "양식", "rating": 4.3 }
// ]

// 결과는 반드시 JSON으로 반환:
// {
//   "summary": "...",
//   "placeIds": ["p1", "p2"]
// }

@Injectable()
export class RecommendationService {
  private aiClient: AiClient;
  constructor(private readonly prisma: PrismaService) {
    this.aiClient = new OpenAiClient(process.env.OPENAI_API_KEY!);
  }
  async recommend(planId: string) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
      include: {
        route: true,
        places: true,
      },
    });
    if (!plan || !plan.route) throw new Error('Invalid plan');

    const prompt = buildPromptV1({
      rideDistanceKm: plan.route.distance,
      rideDurationMin: Math.round(plan.route.duration / 60),
      places: plan.places.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        rating: p.rating,
      })),
    });
    let raw: string;

    try {
      raw = await this.aiClient.generate(prompt);
    } catch (e) {
      throw new Error('AI generation failed');
    }

    let parsed: RecommendationResult;
    try {
      parsed = extractJson(raw);
      parsed = validateRecommendation(parsed);
    } catch (e) {
      throw new Error('AI response parsing failed');
    }

    return this.prisma.client.recommendation.upsert({
      where: { planId },
      update: { summary: parsed.summary, placeIds: parsed.placeIds },
      create: {
        planId,
        summary: parsed.summary,
        placeIds: parsed.placeIds,
      },
    });
  }
}
