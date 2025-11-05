import React from 'react';
import { Screen } from '../types';
import { HomeIcon, AssistantIcon, PlannerIcon, LensIcon, TranslatorIcon, EmergencyIcon } from './icons';

interface BottomNavBarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  const activeClasses = isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white';
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${activeClasses}`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeScreen, onScreenChange }) => {
  const navItems = [
    { screen: Screen.Home, label: 'Home', icon: HomeIcon },
    { screen: Screen.Assistant, label: 'Assistant', icon: AssistantIcon },
    { screen: Screen.Planner, label: 'Planner', icon: PlannerIcon },
    { screen: Screen.Lens, label: 'Lens', icon: LensIcon },
    { screen: Screen.Translator, label: 'Translate', icon: TranslatorIcon },
    { screen: Screen.Emergency, label: 'Emergency', icon: EmergencyIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 h-20 flex justify-around items-center z-50">
      {/* Fix: Refactored to avoid React.cloneElement which caused a TypeScript error.
          We now store icon components in navItems and create elements dynamically. */}
      {navItems.map(item => {
        const isActive = activeScreen === item.screen;
        const Icon = item.icon;
        
        const isEmergency = item.label === 'Emergency';
        const className = isEmergency
            ? isActive ? 'text-red-500' : 'text-red-400'
            : isActive ? 'text-blue-400' : 'text-gray-400';
            
        return (
            <NavItem
                key={item.label}
                icon={<Icon className={className} />}
                label={item.label}
                isActive={isActive}
                onClick={() => onScreenChange(item.screen)}
            />
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
