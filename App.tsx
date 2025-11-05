// FIX: Implement the main App component to manage screens and state.
import React, { useState } from 'react';
import { Screen } from './types';
import { useLocation } from './hooks/useLocation';

import BottomNavBar from './components/BottomNavBar';
import HomeScreen from './components/HomeScreen';
import AIAssistantScreen from './components/AIAssistantScreen';
import DayPlannerScreen from './components/DayPlannerScreen';
import TravelLensScreen from './components/TravelLensScreen';
import TranslatorScreen from './components/TranslatorScreen';
import EmergencyScreen from './components/EmergencyScreen';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
  const { location, error: locationError, loading: locationLoading } = useLocation();

  const ScreenWrapper: React.FC<{ screen: Screen; children: React.ReactNode }> = ({ screen, children }) => (
    <div className={activeScreen === screen ? 'block h-full' : 'hidden'}>
        {children}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      <main className="h-full pb-20">
        <ScreenWrapper screen={Screen.Home}>
            <HomeScreen location={location} locationLoading={locationLoading} locationError={locationError} />
        </ScreenWrapper>
        <ScreenWrapper screen={Screen.Assistant}>
            <AIAssistantScreen location={location} />
        </ScreenWrapper>
        <ScreenWrapper screen={Screen.Planner}>
            <DayPlannerScreen location={location} />
        </ScreenWrapper>
        <ScreenWrapper screen={Screen.Lens}>
            <TravelLensScreen location={location} />
        </ScreenWrapper>
        <ScreenWrapper screen={Screen.Translator}>
            <TranslatorScreen />
        </ScreenWrapper>
        <ScreenWrapper screen={Screen.Emergency}>
            <EmergencyScreen location={location} />
        </ScreenWrapper>
      </main>
      <BottomNavBar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
    </div>
  );
};

export default App;