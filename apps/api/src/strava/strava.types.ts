// Strava API Types

export interface StravaExploreSegment {
  id: number;
  name: string;
  climb_category: number; // 0=NC, 1-5
  avg_grade: number;
  start_latlng: [number, number]; // [lat, lng]
  end_latlng: [number, number];
  elev_difference: number;
  distance: number;
  points: string; // encoded polyline
  starred: boolean;
}

export interface StravaExploreResponse {
  segments: StravaExploreSegment[];
}

export interface StravaSegmentDetail {
  id: number;
  name: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  climb_category: number;
  effort_count: number;
  athlete_count: number;
  star_count: number;
  map: {
    polyline: string;
  };
  start_latlng: [number, number];
  end_latlng: [number, number];
  total_elevation_gain: number;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

export interface BoundingBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}
