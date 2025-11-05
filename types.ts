// FIX: Define all necessary types for the application.
export enum Screen {
  Home = 'HOME',
  Assistant = 'ASSISTANT',
  Planner = 'PLANNER',
  Lens = 'LENS',
  Translator = 'TRANSLATOR',
  Emergency = 'EMERGENCY',
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface EmergencyInfo {
  police: string;
  ambulance: string;
  fire: string;
  hospitalName: string;
  hospitalAddress: string;
}

export interface DayPlan {
    title: string;
    activities: {
        time: string;
        description: string;
        details?: string;
    }[];
}
