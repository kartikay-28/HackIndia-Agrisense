export interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface Farm {
  id: number
  user_id: number
  name: string
  latitude: number
  longitude: number
  soil_type?: string
  soil_confidence?: number
  state: string
  area_acres?: number
  created_at: string
  updated_at: string
}

export interface WeatherSummary {
  current_temp: number
  current_humidity: number
  current_rainfall_1h: number
  weekly_rainfall_forecast_mm: number
  avg_temp_7day: number
  weather_description: string
  forecast_7day: {
    date: number
    temp_day: number
    rain: number
    humidity: number
  }[]
}

export interface CropRecommendation {
  crop: string
  match_score: number
  expected_price: number
  risk_level: 'Low' | 'Medium' | 'High'
  reasons: string[]
  season: string
}

export interface PredictionResponse {
  farm_id: number
  farm_name: string
  weather_summary: WeatherSummary
  current_season: string
  recommendations: CropRecommendation[]
}

export interface RecommendationLog {
  id: number
  farm_id: number
  season: string
  crops_data: CropRecommendation[]
  model_version: string
  created_at: string
}

export interface PriceRecord {
  date: string
  min_price: number
  max_price: number
  modal_price: number
  market: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}
