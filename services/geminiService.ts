// FIX: Implement the Gemini API service to power the application's AI features.
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import type { Part, Content } from '@google/genai';
import type { LocationInfo, DayPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export const getHomeData = async (location: LocationInfo): Promise<{ weather: string; tip: string; city: string }> => {
  const prompt = `Based on the location latitude: ${location.latitude} and longitude: ${location.longitude}, provide the current weather, a useful travel tip for a tourist, and the city name.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weather: { type: Type.STRING, description: 'A brief description of the current weather.' },
          tip: { type: Type.STRING, description: 'A useful travel tip for a tourist in this location.' },
          city: { type: Type.STRING, description: 'The name of the city for the given coordinates.' },
        },
        required: ['weather', 'tip', 'city'],
      },
    },
  });

  const data = JSON.parse(response.text);
  return data;
};

export const streamChatResponse = (
  history: Content[],
  prompt: string,
  imagePart?: Part,
  location?: LocationInfo | null,
) => {
  const locationContext = location
    ? `\nFor context, my current location is latitude: ${location.latitude}, longitude: ${location.longitude}.`
    : '';
  
  const userParts: Part[] = [{ text: prompt + locationContext }];
  if (imagePart) {
    userParts.unshift(imagePart);
  }

  const contents: Content[] = [
    ...history,
    { role: 'user', parts: userParts },
  ];

  return ai.models.generateContentStream({
    model,
    contents,
  });
};

export const getTripPlan = async (location: LocationInfo, preferences: string): Promise<DayPlan> => {
  const prompt = `Create a detailed travel plan of duration based on user's number of days for a tourist from the city at latitude ${location.latitude}, longitude ${location.longitude}. The tourist's preferences are: "${preferences}". The plan should include a title and a list of activities with time, description, and optional details including the best mode of transport to the place if the user is not already at or very near to the location. For any text that needs emphasis or bolding, use HTML '<strong>' tags instead of markdown asterisks. DO NOT USE MARKDOWN SYNTAX or ** or # but use HTML syntax.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                description: { type: Type.STRING },
                details: { type: Type.STRING },
              },
              required: ['time', 'description'],
            },
          },
        },
        required: ['title', 'activities'],
      },
    },
  });

  return JSON.parse(response.text);
};

export const generateTripSummaryImage = async (plan: DayPlan): Promise<string> => {
    const activityDescriptions = plan.activities.map(a => a.description).slice(0, 4).join(', ');
    const prompt = `Create a vibrant travel collage representing a trip titled "${plan.title}". Include small, artistic scenes depicting: ${activityDescriptions}. The style should be like a beautiful, modern travel scrapbook or a mood board.`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const analyzeImage = (prompt: string, imagePart: Part, location: LocationInfo | null): Promise<GenerateContentResponse> => {
    const locationContext = location
    ? `\nFor context, my current location is latitude: ${location.latitude}, longitude: ${location.longitude}.`
    : '';

  const contents: Part[] = [imagePart, { text: prompt + locationContext }];

  return ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: contents }],
  });
};

export const translateText = (text: string, targetLanguage: string, style?: 'formal' | 'informal'): Promise<GenerateContentResponse> => {
    const styleInstruction = style ? `in a ${style} tone` : '';
    const prompt = `Translate the following text to ${targetLanguage} ${styleInstruction}. Only return the translated text, with no extra formatting or explanations: "${text}"`;
  
    return ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
};

export const textToSpeech = (text: string): Promise<GenerateContentResponse> => {
    return ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
};

export const getEmergencyInfo = (location: LocationInfo | null): Promise<GenerateContentResponse> => {
    if (!location) {
        throw new Error("Location is required to get emergency info.");
    }
  const prompt = `For the location at latitude ${location.latitude} and longitude ${location.longitude}, provide the local emergency phone numbers for police, ambulance, and fire services. Also, find the name and address of the nearest hospital.`;

  return ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          police: { type: Type.STRING },
          ambulance: { type: Type.STRING },
          fire: { type: Type.STRING },
          hospitalName: { type: Type.STRING },
          hospitalAddress: { type: Type.STRING },
        },
        required: ['police', 'ambulance', 'fire', 'hospitalName', 'hospitalAddress'],
      },
    },
  });
};