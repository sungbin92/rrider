export interface RecommendationResult {
  summary: string;
  placeIds: string[];
}

export function validateRecommendation(data: any): RecommendationResult {
  if (typeof data?.summary !== 'string' || !Array.isArray(data?.placeIds)) {
    throw new Error('Invalid recommendation format');
  }

  return {
    summary: data.summary,
    placeIds: data.placeIds.map(String),
  };
}
