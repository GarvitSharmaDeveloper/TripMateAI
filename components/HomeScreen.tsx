
import React, { useEffect, useState } from 'react';
import type { LocationInfo } from '../types';
import { getHomeData } from '../services/geminiService';
import { SparklesIcon, SunIcon } from './icons';

interface HomeScreenProps {
  location: LocationInfo | null;
  locationLoading: boolean;
  locationError: string | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ location, locationLoading, locationError }) => {
  const [weather, setWeather] = useState('');
  const [tip, setTip] = useState('');
  const [city, setCity] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (location) {
      setLoadingData(true);
      getHomeData(location)
        .then(data => {
          setWeather(data.weather);
          setTip(data.tip);
          setCity(data.city);
        })
        .finally(() => setLoadingData(false));
    } else if (!locationLoading) {
      setLoadingData(false);
    }
  }, [location, locationLoading]);

  const Header = () => (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-bold text-white tracking-tight">TripMate AI</h1>
      <p className="text-blue-300 mt-2">Your AI-Powered Travel Copilot</p>
    </div>
  );

  const WeatherCard = () => {
    if (locationLoading || loadingData) return <SkeletonCard height="h-24" />;
    if (locationError) return <InfoCard title="Location Error" text={locationError} />;
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 flex items-center justify-between shadow-lg border border-gray-700">
            <div>
                <p className="text-gray-300 text-lg">{city}</p>
                <p className="text-white text-3xl font-bold">{weather}</p>
            </div>
            <SunIcon size={48} className="text-yellow-400" />
        </div>
    );
  };
  
  const TipCard = () => {
    if (locationLoading || loadingData) return <SkeletonCard height="h-32" />;
    if (locationError) return <InfoCard title="Tip Unavailable" text="Cannot fetch travel tips without location access."/>;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mt-6 shadow-lg border border-gray-700">
            <div className="flex items-center mb-3">
                <SparklesIcon className="text-purple-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Dynamic Tip</h2>
            </div>
            <p className="text-gray-300">{tip}</p>
        </div>
    );
  };

  const SkeletonCard: React.FC<{height: string}> = ({height}) => (
    <div className={`bg-gray-800 rounded-xl p-6 ${height} animate-pulse w-full`}>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  );

  const InfoCard: React.FC<{title: string; text: string}> = ({title, text}) => (
    <div className="bg-red-900/50 border border-red-700 rounded-xl p-6">
      <h3 className="font-semibold text-red-300">{title}</h3>
      <p className="text-red-400">{text}</p>
    </div>
  );

  return (
    <div className="p-6 h-full">
      <Header />
      <WeatherCard />
      <TipCard />
    </div>
  );
};

export default HomeScreen;
