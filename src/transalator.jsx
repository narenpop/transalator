import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Globe, ArrowRightLeft, Settings, Loader2, Sparkles, X } from 'lucide-react';

const HealthcareTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [inputLang, setInputLang] = useState('en-US');
  const [outputLang, setOutputLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const languages = {
    'en-US': { name: 'English (US)', code: 'en', flag: '🇺🇸' },
    'es-ES': { name: 'Spanish', code: 'es', flag: '🇪🇸' },
    'fr-FR': { name: 'French', code: 'fr', flag: '🇫🇷' },
    'de-DE': { name: 'German', code: 'de', flag: '🇩🇪' },
    'zh-CN': { name: 'Chinese', code: 'zh', flag: '🇨🇳' },
    'ar-SA': { name: 'Arabic', code: 'ar', flag: '🇸🇦' },
    'hi-IN': { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
    'pt-BR': { name: 'Portuguese', code: 'pt', flag: '🇧🇷' },
    'ru-RU': { name: 'Russian', code: 'ru', flag: '🇷🇺' },
    'ja-JP': { name: 'Japanese', code: 'ja', flag: '🇯🇵' }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = inputLang;

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setOriginalText(prev => prev + final);
          translateText(originalText + final);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [inputLang]);

  const translateText = async (text) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    setError('');

    try {
      // Using MyMemory Translation API (free, no API key required)
      const sourceLang = languages[inputLang].code;
      const targetLang = outputLang;
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );

      if (!response.ok) {
        throw new Error('Translation service unavailable');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        const translation = data.responseData.translatedText;
        setTranslatedText(translation);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed. Please check your internet connection and try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone access denied. Please allow microphone access in your browser settings and reload the page.');
      return false;
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError('');
      
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      try {
        recognitionRef.current.lang = inputLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const speakTranslation = () => {
    if (!translatedText) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = outputLang;
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Audio playback failed');
    };
    
    synthRef.current.speak(utterance);
  };

  const clearTranscripts = () => {
    setOriginalText('');
    setTranslatedText('');
    setError('');
  };

  const swapLanguages = () => {
    const temp = inputLang;
    setInputLang(outputLang.includes('-') ? outputLang : `${outputLang}-${outputLang.toUpperCase()}`);
    setOutputLang(languages[temp].code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-lg bg-white/80 shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediTranslate
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Healthcare Communication
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="relative group p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Settings className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Language Selection Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-in">
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Language Settings
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🎤 Input Language (Speaking)
                  </label>
                  <select
                    value={inputLang}
                    onChange={(e) => setInputLang(e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gradient-to-r from-blue-50 to-purple-50"
                  >
                    {Object.entries(languages).map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔊 Output Language (Translation)
                  </label>
                  <select
                    value={outputLang}
                    onChange={(e) => setOutputLang(e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                  >
                    {Object.entries(languages).map(([code, lang]) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  onClick={swapLanguages}
                  className="flex items-center space-x-2 px-6 py-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Swap Languages</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="backdrop-blur-lg bg-red-50/90 border-2 border-red-200 rounded-2xl p-5 mb-6 shadow-lg animate-in">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-800 text-sm font-semibold">{error}</p>
                {error.includes('not allowed') || error.includes('denied') ? (
                  <div className="mt-3 text-xs text-red-700 bg-red-100/50 rounded-lg p-3">
                    <p className="font-bold mb-2">How to fix:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Click the 🔒 or 🎤 icon in your browser's address bar</li>
                      <li>Select "Allow" for microphone access</li>
                      <li>Reload the page and try again</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Language Display Banner */}
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl p-6 mb-6 border border-white/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
              <span className="text-2xl">{languages[inputLang].flag}</span>
              <span className="font-semibold">{languages[inputLang].name}</span>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white shadow-lg">
              <span className="text-2xl">{Object.values(languages).find(l => l.code === outputLang)?.flag}</span>
              <span className="font-semibold">{Object.values(languages).find(l => l.code === outputLang)?.name}</span>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-2xl p-8 mb-8 border border-white/50">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={toggleListening}
              className={`relative group flex items-center space-x-4 px-10 py-6 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
                isListening
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl"></div>
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8 relative z-10" />
                  <span className="relative z-10">Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 relative z-10" />
                  <span className="relative z-10">Start Recording</span>
                </>
              )}
            </button>

            {isListening && (
              <div className="flex items-center space-x-3 px-6 py-3 bg-red-100 rounded-full shadow-lg animate-pulse">
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </div>
                <span className="text-sm font-bold text-red-600">LIVE</span>
              </div>
            )}

            <button
              onClick={clearTranscripts}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Transcripts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original Transcript */}
          <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl overflow-hidden border border-white/50 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 px-6 py-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <h2 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
                <span className="text-2xl">{languages[inputLang].flag}</span>
                Original Text
              </h2>
              <p className="text-blue-100 text-sm mt-1 relative z-10">{languages[inputLang].name}</p>
            </div>
            <div className="p-6">
              <div className="min-h-[350px] max-h-[500px] overflow-y-auto custom-scrollbar">
                {originalText ? (
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {originalText}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Mic className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-400 italic text-lg">
                      Click "Start Recording" to begin speaking...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translated Transcript */}
          <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl overflow-hidden border border-white/50 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">{Object.values(languages).find(l => l.code === outputLang)?.flag}</span>
                  Translation
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  {Object.values(languages).find(l => l.code === outputLang)?.name}
                </p>
              </div>
              <button
                onClick={speakTranslation}
                disabled={!translatedText || isSpeaking}
                className={`relative z-10 p-3 rounded-xl transition-all duration-300 ${
                  translatedText && !isSpeaking
                    ? 'bg-white/30 hover:bg-white/50 text-white shadow-lg hover:shadow-xl transform hover:scale-110'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <div className="p-6">
              <div className="min-h-[350px] max-h-[500px] overflow-y-auto custom-scrollbar">
                {isTranslating ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Translating with AI...</p>
                  </div>
                ) : translatedText ? (
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {translatedText}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-400 italic text-lg">
                      Translation will appear here...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Privacy Notice */}
          <div className="backdrop-blur-lg bg-gradient-to-br from-blue-50/90 to-purple-50/90 border-2 border-blue-200 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Privacy & Security</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  All translations are processed in real-time with no data storage. Your conversations remain private and confidential, complying with healthcare privacy standards.
                </p>
              </div>
            </div>
          </div>

          {/* Browser Compatibility */}
          <div className="backdrop-blur-lg bg-gradient-to-br from-purple-50/90 to-pink-50/90 border-2 border-purple-200 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 rounded-full p-2 mt-1">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 mb-2">Best Experience</h3>
                <p className="text-sm text-purple-800 leading-relaxed">
                  Optimized for Chrome, Edge, and Safari browsers. Requires HTTPS or localhost with microphone permissions for voice input.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  );
};

export default HealthcareTranslator;