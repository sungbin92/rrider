export interface PromptPlace {
  id: string;
  name: string;
  category: string;
  rating?: number | null;
  address?: string;
}

export interface BuildPromptInput {
  rideDistanceKm: number;
  rideDurationMin: number;
  places: PromptPlace[];
}
