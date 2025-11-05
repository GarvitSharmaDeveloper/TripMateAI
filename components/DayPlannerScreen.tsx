// FIX: Implement the DayPlannerScreen component.
import React, { useState } from 'react';
import type { DayPlan, LocationInfo } from '../types';
import { getTripPlan, generateTripSummaryImage } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface DayPlannerScreenProps {
  location: LocationInfo | null;
}

const DayPlannerScreen: React.FC<DayPlannerScreenProps> = ({ location }) => {
  const [preferences, setPreferences] = useState('');
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [summaryImageUrl, setSummaryImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!location) {
      setError('Location is not available. Please enable location services.');
      return;
    }
    if (!preferences.trim()) {
      setError('Please enter your preferences for the day.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setSummaryImageUrl(null);

    try {
      const result = await getTripPlan(location, preferences);
      setPlan(result);
      
      setIsGeneratingImage(true);
      try {
        const imageUrl = await generateTripSummaryImage(result);
        setSummaryImageUrl(imageUrl);
      } catch (imgError) {
          console.error("Failed to generate summary image", imgError);
          // Fail gracefully if image generation has an error
      } finally {
        setIsGeneratingImage(false);
      }

    } catch (e) {
      console.error('Failed to generate plan:', e);
      setError('Sorry, I couldn\'t create a plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <header className="p-4 bg-gray-900 border-b border-gray-700 text-center">
        <h1 className="text-xl font-semibold">Day Planner</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!plan && (
            <>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                    <label htmlFor="preferences" className="block text-sm font-medium text-gray-300 mb-2">
                        What are you in the mood for?
                    </label>
                    <textarea
                        id="preferences"
                        rows={3}
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        placeholder="e.g., I'm interested in historical sites, street food, and maybe some shopping."
                        className="w-full bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading || !location}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    {isLoading ? (
                        <>
                            <SparklesIcon className="animate-ping h-5 w-5 mr-3" />
                            Generating Plan...
                        </>
                    ) : (
                        'Generate Day Plan'
                    )}
                </button>
            </>
        )}

        {error && <div className="bg-red-900/50 text-red-300 border border-red-700 p-4 rounded-lg">{error}</div>}
        {!location && !isLoading && (
          <div className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 p-4 rounded-lg">
            Waiting for location... Enable location services to generate a plan.
          </div>
        )}

        {plan && (
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
             {isGeneratingImage && (
                <div className="w-full aspect-video bg-gray-700 animate-pulse flex items-center justify-center">
                    <p className="text-gray-400">Creating visual summary...</p>
                </div>
             )}
             {summaryImageUrl && (
                <img src={summaryImageUrl} alt="Visual summary of the trip plan" className="w-full h-auto object-cover" />
             )}

            <div className="p-4">
                <h2 className="text-2xl font-bold text-blue-300 mb-4">{plan.title}</h2>
                <div className="space-y-4">
                {plan.activities.map((activity, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <p className="font-semibold text-white" dangerouslySetInnerHTML={{ __html: `${activity.time}: ${activity.description}` }} />
                    {activity.details && <p className="text-gray-400 mt-1 text-sm" dangerouslySetInnerHTML={{ __html: activity.details }} />}
                    </div>
                ))}
                </div>
            </div>
             <button onClick={() => setPlan(null)} className="w-full bg-blue-800/50 hover:bg-blue-700/50 text-blue-300 font-bold py-3 mt-4">
                Create New Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayPlannerScreen;