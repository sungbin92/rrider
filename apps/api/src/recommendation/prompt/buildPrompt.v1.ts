import { BuildPromptInput } from './types';

export function buildPromptV1(input: BuildPromptInput): string {
  const { rideDistanceKm, rideDurationMin, places } = input;

  return `
너는 자전거 라이딩 후 식사 장소를 추천하는 큐레이터다.

라이딩 정보:
- 거리: ${rideDistanceKm}km
- 시간: ${rideDurationMin}분

규칙:
1. 너무 무겁거나 기름진 음식은 피한다.
2. 회복에 도움이 되는 식사를 우선한다.
3. 최대 3곳만 추천한다.
4. 반드시 아래 후보 목록 안에서만 고른다.

후보 장소:
${places
  .map(
    (p) => `- (${p.id}) ${p.name} / ${p.category} / 평점 ${p.rating ?? '없음'}`,
  )
  .join('\n')}

결과는 반드시 JSON 형식으로 반환한다:

{
  "summary": "추천 이유 한 문장",
  "placeIds": ["placeId1", "placeId2"]
}
`.trim();
}
