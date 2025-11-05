import React, { useState, useEffect, useRef } from 'react';
import { translateText, textToSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';
import { Volume2Icon, MicrophoneIcon } from './icons';

const languages = [
  'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Chinese', 'Korean', 'Russian', 'Portuguese', 'Arabic'
];

const global = window as any;

const TranslatorScreen: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  // Shared state
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translationStyle, setTranslationStyle] = useState<'formal' | 'informal'>('formal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // State for text mode
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // State for voice mode
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceTranslatedText, setVoiceTranslatedText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported by your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setSpeechError(`Speech error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);
      handleVoiceTranslate(transcript);
    };
    recognitionRef.current = recognition;
  }, []);

  const handleSpeak = async (textToSpeak: string) => {
    if (!textToSpeak || isSpeaking) return;
    setIsSpeaking(true);

    if (!audioContextRef.current) {
        audioContextRef.current = new (global.AudioContext || global.webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Use pre-fetched buffer if available and text matches (for text mode)
    if (audioBuffer && textToSpeak === translatedText) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
        return;
    }

    // Fallback to fetching on demand
    setError(null);
    try {
      const response = await textToSpeech(textToSpeak);
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio && audioContextRef.current) {
        const decodedBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        if (textToSpeak === translatedText) setAudioBuffer(decodedBuffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error('Text-to-speech failed:', e);
      setError('Could not play audio.');
      setIsSpeaking(false);
    }
  };

  const handleTextTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setTranslatedText('');
    setAudioBuffer(null);
    try {
      const response = await translateText(inputText, targetLanguage, translationStyle);
      const newText = response.text;
      setTranslatedText(newText);
      
      if (newText) {
        textToSpeech(newText).then(ttsResponse => {
            const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1)
                    .then(buffer => setAudioBuffer(buffer))
                    .catch(e => console.error("Audio decoding failed during pre-fetch", e));
            }
        }).catch(e => console.error("Audio pre-fetch failed", e));
      }
    } catch (e) {
      console.error('Translation failed:', e);
      setError('Sorry, translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListenToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscribedText('');
      setVoiceTranslatedText('');
      setSpeechError(null);
      recognitionRef.current?.start();
    }
  };

  const handleVoiceTranslate = async (text: string) => {
    setIsLoading(true);
    try {
        const response = await translateText(text, targetLanguage, translationStyle);
        setVoiceTranslatedText(response.text);
        await handleSpeak(response.text);
    } catch(e) {
        setSpeechError("Could not translate the speech.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const TabButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void; }) => (
    <button onClick={onClick} className={`w-1/2 py-3 text-center font-semibold transition-colors ${isActive ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'}`}>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <header className="p-4 bg-gray-900 border-b border-gray-700 text-center">
        <h1 className="text-xl font-semibold">Translator</h1>
      </header>

      <div className="flex-shrink-0 flex">
        <TabButton label="Text" isActive={mode === 'text'} onClick={() => setMode('text')} />
        <TabButton label="Voice" isActive={mode === 'voice'} onClick={() => setMode('voice')} />
      </div>
      
      <div className="p-4 border-b border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Translation Style</label>
        <div className="flex bg-gray-900 rounded-lg p-1 max-w-xs mx-auto">
          {(['formal', 'informal'] as const).map(style => (
            <button key={style} onClick={() => setTranslationStyle(style)} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${translationStyle === style ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {mode === 'text' && (
          <>
            <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
              <textarea rows={4} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter text here..." className="w-full bg-gray-800 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
            </div>
            <div className="flex items-center justify-between gap-4">
              <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
              <button onClick={handleTextTranslate} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {isLoading ? 'Translating...' : 'Translate'}
              </button>
            </div>
            {error && <div className="bg-red-900/50 text-red-300 border border-red-700 p-4 rounded-lg">{error}</div>}
            {translatedText && (
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-2">Translation ({targetLanguage})</label>
                    <p className="text-lg whitespace-pre-wrap">{translatedText}</p>
                  </div>
                  <button onClick={() => handleSpeak(translatedText)} disabled={isSpeaking} className="p-2 text-gray-300 hover:text-white disabled:text-gray-500">
                    <Volume2Icon className={isSpeaking ? 'animate-pulse' : ''} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'voice' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-400 mb-2">Translate to:</p>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg p-3 mb-8 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            
            <button onClick={handleListenToggle} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <MicrophoneIcon size={40} className="text-white" />
            </button>
            <p className="mt-4 text-lg h-8">{isListening ? 'Listening...' : 'Tap to speak'}</p>

            {(transcribedText || voiceTranslatedText) && (
                <div className="w-full mt-8 text-left space-y-4">
                    {transcribedText && <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <label className="block text-sm font-medium text-gray-300 mb-1">You said:</label>
                        <p className="text-lg">{transcribedText}</p>
                    </div>}
                    {isLoading && !voiceTranslatedText && <p className="text-center">Translating...</p>}
                    {voiceTranslatedText && <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <label className="block text-sm font-medium text-blue-300 mb-1">Translation:</label>
                        <p className="text-lg">{voiceTranslatedText}</p>
                    </div>}
                </div>
            )}
            {speechError && <div className="mt-4 bg-red-900/50 text-red-300 border border-red-700 p-4 rounded-lg w-full">{speechError}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslatorScreen;