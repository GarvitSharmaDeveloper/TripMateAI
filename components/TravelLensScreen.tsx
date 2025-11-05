import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/image';
import { CameraIcon, SparklesIcon } from './icons';
import type { LocationInfo } from '../types';

interface TravelLensScreenProps {
  location: LocationInfo | null;
}

const TravelLensScreen: React.FC<TravelLensScreenProps> = ({ location }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis('');
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please select an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const imagePart = await fileToGenerativePart(image);
      const effectivePrompt = prompt.trim() || "What is this? Describe what you see and identify its name if it's a known place.";
      const response = await analyzeImage(effectivePrompt, imagePart, location);
      setAnalysis(response.text);
    } catch (e) {
      console.error('Failed to analyze image:', e);
      setError('Sorry, I couldn\'t analyze the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
        <header className="p-4 bg-gray-900 border-b border-gray-700 text-center">
            <h1 className="text-xl font-semibold">Travel Lens</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-md mx-auto">
                <div className="mb-4">
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-600 hover:border-gray-400 transition-colors"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
                        ) : (
                            <>
                                <CameraIcon size={40} />
                                <span className="mt-2">Tap to open camera</span>
                            </>
                        )}
                    </button>
                </div>
                
                {image && (
                    <>
                        <div className="mb-4">
                            <label htmlFor="prompt-lens" className="block text-sm font-medium text-gray-300 mb-2">
                                Ask a question (optional)
                            </label>
                            <input
                                id="prompt-lens"
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., What's this monument?"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <SparklesIcon className="animate-ping h-5 w-5 mr-3" />
                                    Analyzing...
                                </>
                            ) : (
                                "Analyze Image"
                            )}
                        </button>
                    </>
                )}

                {error && <div className="mt-4 bg-red-900/50 text-red-300 border border-red-700 p-4 rounded-lg">{error}</div>}

                {analysis && (
                    <div className="mt-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold text-blue-300 mb-2">Analysis Result</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TravelLensScreen;