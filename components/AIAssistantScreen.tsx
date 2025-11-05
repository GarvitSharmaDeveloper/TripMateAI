import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, LocationInfo } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/image';
import { PaperclipIcon, SendIcon, SparklesIcon } from './icons';

interface AIAssistantScreenProps {
  location: LocationInfo | null;
}

const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ location }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! How can I help you plan your trip today?' }
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', text: input };
    if (imagePreview) {
        userMessage.image = imagePreview;
    }
    setMessages(prev => [...prev, userMessage]);
    
    let imagePart;
    if (image) {
        imagePart = await fileToGenerativePart(image);
    }
    
    const currentInput = input;
    setInput('');
    setImage(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";

    try {
        const result = await streamChatResponse(history, currentInput, imagePart, location);

        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of result) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = modelResponse;
                return newMessages;
            });
        }
        
        const userParts = [{text: currentInput}];
        if (imagePart) {
            userParts.unshift(imagePart as any);
        }

        setHistory(prev => [...prev, { role: 'user', parts: userParts }, { role: 'model', parts: [{text: modelResponse}] }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <header className="p-4 bg-gray-900 border-b border-gray-700 text-center">
        <h1 className="text-xl font-semibold">Travel Copilot</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
              {msg.image && <img src={msg.image} alt="upload preview" className="rounded-lg mb-2" />}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
            <div className="flex justify-start">
                <div className="max-w-lg p-3 rounded-2xl bg-gray-700 rounded-bl-none flex items-center space-x-2">
                    <SparklesIcon className="animate-pulse text-blue-400" size={20} />
                    <span className="text-gray-400">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        {imagePreview && (
          <div className="relative mb-2 w-24">
            <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
            <button
              onClick={() => {
                setImage(null);
                setImagePreview(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-0 right-0 bg-black/50 text-white rounded-full p-1"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex items-center bg-gray-800 rounded-xl p-2">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white">
            <PaperclipIcon />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Type a message or upload an image..."
            className="flex-1 bg-transparent focus:outline-none px-2"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-2 text-blue-500 hover:text-blue-400 disabled:text-gray-500">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantScreen;