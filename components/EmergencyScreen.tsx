import React, { useState } from 'react';
import { getEmergencyInfo, translateText } from '../services/geminiService';
import type { LocationInfo } from '../types';
import { PhoneIcon } from './icons';

interface EmergencyScreenProps {
    location: LocationInfo | null;
}

interface EmergencyInfo {
    police: string;
    ambulance: string;
    fire: string;
    hospitalName: string;
    hospitalAddress: string;
}

const emergencyPhrases = [
    "I need help.",
    "Where is the nearest hospital?",
    "Call the police.",
    "I am lost.",
    "I need a doctor.",
];

// Placeholder for your Telnyx emergency number
const TELNYX_EMERGENCY_NUMBER = '+16199600598';

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ location }) => {
    const [info, setInfo] = useState<EmergencyInfo | null>(null);
    const [isLoadingInfo, setIsLoadingInfo] = useState(false);
    const [infoError, setInfoError] = useState<string | null>(null);

    const [translatedPhrase, setTranslatedPhrase] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const fetchEmergencyInfo = async () => {
        setIsLoadingInfo(true);
        setInfoError(null);
        try {
            const response = await getEmergencyInfo(location);
            setInfo(JSON.parse(response.text));
        } catch (e) {
            console.error(e);
            setInfoError("Could not fetch local emergency information.");
        } finally {
            setIsLoadingInfo(false);
        }
    };

    const handlePhraseClick = async (phrase: string) => {
        setIsTranslating(true);
        setTranslatedPhrase(null);
        try {
            const response = await translateText(phrase, "local language");
            setTranslatedPhrase(`"${phrase}"\n\n${response.text}`);
        } catch (e) {
            setTranslatedPhrase("Translation failed.");
        } finally {
            setIsTranslating(false);
        }
    };
    
    const handleCall = () => {
        window.location.href = `tel:${TELNYX_EMERGENCY_NUMBER}`;
    };

    return (
        <div className="flex flex-col h-full bg-red-900/90 text-white">
            <header className="p-4 bg-red-900 border-b border-red-700 text-center">
                <h1 className="text-xl font-semibold">Emergency Mode</h1>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <button
                    onClick={handleCall}
                    className="w-full flex items-center justify-center gap-4 bg-red-700 hover:bg-red-800 text-white font-bold py-6 px-4 rounded-lg text-2xl transition-colors shadow-lg border-2 border-red-500 animate-pulse"
                >
                    <PhoneIcon size={32} />
                    CALL FOR HELP
                </button>
                
                <button
                    onClick={fetchEmergencyInfo}
                    disabled={isLoadingInfo}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold py-4 px-4 rounded-lg text-xl transition-colors shadow-lg"
                >
                    {isLoadingInfo ? 'Fetching...' : 'GET LOCAL EMERGENCY INFO'}
                </button>

                {infoError && <div className="bg-red-800 text-center p-3 rounded">{infoError}</div>}
                {info && (
                    <div className="bg-white/10 p-4 rounded-lg space-y-3">
                        <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-2">Local Contacts</h3>
                        <p><strong>Police:</strong> {info.police}</p>
                        <p><strong>Ambulance:</strong> {info.ambulance}</p>
                        <p><strong>Fire:</strong> {info.fire}</p>
                        <p className="pt-2 mt-2 border-t border-white/20"><strong>Nearest Hospital:</strong> {info.hospitalName}</p>
                        <p>{info.hospitalAddress}</p>
                    </div>
                )}
                
                <div className="bg-white/10 p-4 rounded-lg">
                    <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-3">Instant Translation</h3>
                    <div className="space-y-2">
                        {emergencyPhrases.map(phrase => (
                            <button
                                key={phrase}
                                onClick={() => handlePhraseClick(phrase)}
                                className="w-full text-left bg-white/10 hover:bg-white/20 p-3 rounded-md transition-colors"
                            >
                                {phrase}
                            </button>
                        ))}
                    </div>
                </div>

                {(isTranslating || translatedPhrase) && (
                    <div className="bg-white/10 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">Translation</h3>
                        {isTranslating && <p>Translating...</p>}
                        {translatedPhrase && <p className="whitespace-pre-wrap">{translatedPhrase}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyScreen;