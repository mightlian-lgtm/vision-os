import React, { useState, useEffect, useRef, useCallback } from 'react';
import SetupModal from './components/SetupModal';
import ChatHistory from './components/ChatHistory';
import AiOrb from './components/AiOrb';
import ResultCard from './components/ResultCard';
import FocusModeTag from './components/FocusModeTag';
import { analyzeContext, chatWithContext, detectSubject } from './services/geminiService';
import { 
  ChatMessage, 
  Sender, 
  UserContext, 
  StructuredResponse, 
  AppState,
  Coordinates
} from './types';

// --- Constants ---
const HOVER_TRIGGER_MS = 3000;
const PERIODIC_INTERVAL_MS = 8000; // Increased from 3000ms to prevent rate limiting
const CROP_SIZE_RATIO = 0.5; 

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [resultData, setResultData] = useState<StructuredResponse | null>(null);
  
  // Interaction Logic
  const [mousePos, setMousePos] = useState<Coordinates>({ x: 0, y: 0 });
  const [hoverProgress, setHoverProgress] = useState(0); 
  const [cropBox, setCropBox] = useState<{x: number, y: number, size: number} | null>(null);
  
  // Mode 1 & 3 Specific
  const subjectHistoryRef = useRef<string[]>([]);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  
  // Voice
  const [subtitle, setSubtitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTextBuffer, setVoiceTextBuffer] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const lastMousePosRef = useRef<Coordinates>({ x: 0, y: 0 });
  const startTimeRef = useRef<number>(0);
  const speechRecognitionRef = useRef<any>(null); 
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- 1. Hardware & API Setup ---
  useEffect(() => {
    // Camera
    navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
    }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => console.error("Camera error:", err));

    // Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN'; 
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) setVoiceTextBuffer(prev => prev + " " + event.results[i][0].transcript);
          else interim += event.results[i][0].transcript;
        }
        setSubtitle(interim || "正在聆听...");
      };
      speechRecognitionRef.current = recognition;
    }
  }, []); 

  // --- 2. Main Logic Engine (Switches based on Mode) ---
  
  // A. Periodic Scanning for Mode 1 (Focus) & 3 (Rescue)
  useEffect(() => {
    const isPeriodicMode = userContext?.mode === 1 || userContext?.mode === 3;
    
    if (isPeriodicMode && appState === AppState.IDLE && !isFocusPaused) {
        setAppState(AppState.MONITORING);
    }

    if (appState === AppState.MONITORING && isPeriodicMode && !isFocusPaused) {
        monitoringIntervalRef.current = setInterval(performPeriodicCheck, PERIODIC_INTERVAL_MS);
    } else {
        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    }

    return () => {
        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    };
  }, [appState, userContext, isFocusPaused]);

  // B. Hover Detection for Mode 2 (Fluent) & 4 (Explore)
  useEffect(() => {
    const isHoverMode = userContext?.mode === 2 || userContext?.mode === 4;
    if (!isHoverMode || (appState !== AppState.IDLE && appState !== AppState.HOVERING)) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / HOVER_TRIGGER_MS) * 100, 100);
      setHoverProgress(progress);

      if (progress >= 100 && appState !== AppState.HOVERING) {
         setAppState(AppState.HOVERING);
         const { box } = captureCurrentFrame(false);
         setCropBox(box);
         triggerAnalysis({ box, isFocusConfirmation: false });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [appState, userContext]);

  // --- 3. Event Handlers & Core Functions ---

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setMousePos({ x: clientX, y: clientY });
    lastMousePosRef.current = { x: clientX, y: clientY };

    const isHoverMode = userContext?.mode === 2 || userContext?.mode === 4;
    if (isHoverMode && appState === AppState.IDLE) {
      startTimeRef.current = Date.now();
      setHoverProgress(0);
    }
  }, [appState, userContext]);

  const performPeriodicCheck = async () => {
      if (!userContext) return;
      const isFullScreenCheck = userContext.mode === 1;

      const { fullImage, cropImage, box } = captureCurrentFrame(isFullScreenCheck);
      const imageForDetection = isFullScreenCheck ? fullImage : cropImage;
      if (!imageForDetection) return;

      const subject = await detectSubject(imageForDetection, isFullScreenCheck);
      console.log(`[Mode ${userContext.mode}] Detected:`, subject);
      
      const history = subjectHistoryRef.current;
      history.push(subject);
      if (history.length > 3) history.shift();

      if (history.length === 3 && subject !== 'unknown' && history.every(s => s === subject)) {
           if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
           setCropBox(box);
           setTimeout(() => {
               triggerAnalysis({ box, isFocusConfirmation: userContext.mode === 1 });
           }, 100);
           subjectHistoryRef.current = [];
      }
  };
  
  const triggerAnalysis = async ({ box, isFocusConfirmation }: { box: any, isFocusConfirmation: boolean }) => {
      setAppState(AppState.ANALYZING);
      if (!userContext) return;

      const { fullImage, cropImage } = captureCurrentFrame(false);
      const imageForLog = userContext.mode === 1 ? fullImage : cropImage;
      const cropForAnalysis = userContext.mode === 1 ? null : cropImage;
      
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(), sender: Sender.SYSTEM,
        text: `[Mode ${userContext.mode}] Analyzing...`,
        images: imageForLog ? [imageForLog] : [], 
        timestamp: Date.now()
      }]);

      const result = await analyzeContext(userContext, fullImage, cropForAnalysis, isFocusConfirmation);

      setResultData(result);
      setAppState(AppState.RESULT);
      
      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: Sender.MODEL,
        text: result.insight, timestamp: Date.now()
      }]);
  };
  
  const captureCurrentFrame = (fullScreenOnly: boolean) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.srcObject) return { fullImage: '', cropImage: '', box: {x:0, y:0, size:0} };

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { fullImage: '', cropImage: '', box: {x:0, y:0, size:0} };
      ctx.drawImage(video, 0, 0);
      const fullImage = canvas.toDataURL('image/jpeg', 0.6);
      if (fullScreenOnly) return { fullImage, cropImage: '', box: {x:0,y:0,size:0} };

      const size = window.innerHeight * CROP_SIZE_RATIO;
      const x = Math.max(0, Math.min(lastMousePosRef.current.x - size / 2, window.innerWidth - size));
      const y = Math.max(0, Math.min(lastMousePosRef.current.y - size / 2, window.innerHeight - size));
      
      const cropCanvas = document.createElement('canvas');
      const scaleX = video.videoWidth / window.innerWidth;
      const scaleY = video.videoHeight / window.innerHeight;
      cropCanvas.width = 400; cropCanvas.height = 400;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx?.drawImage(video, x * scaleX, y * scaleY, size * scaleX, size * scaleY, 0, 0, 400, 400);
      const cropImage = cropCanvas.toDataURL('image/jpeg', 0.6);

      return { fullImage, cropImage, box: { x, y, size } };
  };

  // --- UI & State Handlers ---
  const handleSetupComplete = (ctx: UserContext) => {
    setUserContext(ctx);
    const isPeriodic = ctx.mode === 1 || ctx.mode === 3;
    setAppState(isPeriodic ? AppState.MONITORING : AppState.IDLE);
    setChatHistory([{ id: 'init', sender: Sender.SYSTEM, text: `模式 ${ctx.mode} 已启动`, timestamp: Date.now() }]);
    startTimeRef.current = Date.now();
  };
  
  const resetCycle = () => {
    if (userContext?.mode === 1 && appState === AppState.RESULT && resultData && !resultData.isConfirmation) {
      setAppState(AppState.FOCUSED);
      setResultData(null);
    } else {
      const isPeriodic = userContext?.mode === 1 || userContext?.mode === 3;
      setAppState(isPeriodic ? AppState.MONITORING : AppState.IDLE);
      setResultData(null);
      setCropBox(null);
      startTimeRef.current = Date.now(); 
    }
  };

  const handleFocusConfirm = async () => {
    setAppState(AppState.ANALYZING);
    if (!userContext) return;
    const { fullImage } = captureCurrentFrame(true);
    const result = await analyzeContext(userContext, fullImage, null, false);
    setResultData(result);
    setAppState(AppState.RESULT);
  };
  
  const toggleVoice = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      setSubtitle(""); 
      setResultData(null);
      
      const fullText = (voiceTextBuffer + " " + subtitle).trim();
      if (fullText) {
        handleVoiceFollowUp(fullText);
      } else {
        resetCycle();
      }
    } else {
      setVoiceTextBuffer("");
      speechRecognitionRef.current?.start();
      setIsListening(true);
      setSubtitle("正在聆听...");
    }
  };

  const handleVoiceFollowUp = async (text: string) => {
    setChatHistory(prev => [...prev, { id: Date.now().toString(), sender: Sender.USER, text, timestamp: Date.now() }]);
    setAppState(AppState.ANALYZING);
    
    const jsonString = await chatWithContext(
        chatHistory.map(m => ({ role: m.sender === Sender.USER ? 'user' : 'model', parts: [{ text: m.text || '' }] })),
        text
    );
    try {
        const newResponse = JSON.parse(jsonString);
        setResultData(newResponse);
        setAppState(AppState.RESULT); 
    } catch {
        resetCycle();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white selection:bg-purple-500/30" onMouseMove={handleMouseMove}>
      <style>{`
        @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .gradient-border-mask {
          background: linear-gradient(60deg, #a855f7, #3b82f6, #2dd4bf, #a855f7);
          background-size: 300% 300%;
          animation: gradient-flow 2s ease infinite;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          padding: 4px; border-radius: 20px;
        }
        @keyframes zoom-fade-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .crop-enter-anim { animation: zoom-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes blur-in { from { filter: blur(8px); opacity: 0; transform: translateY(-10px); } to { filter: blur(0); opacity: 1; transform: translateY(0); } }
        .subtitle-anim { animation: blur-in 0.4s ease-out forwards; }
      `}</style>

      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
      <canvas ref={canvasRef} className="hidden" />

      {appState === AppState.SETUP && <SetupModal onComplete={handleSetupComplete} />}

      <div className="relative z-10 w-full h-full p-6 pointer-events-none flex flex-col justify-between">
        <div className="flex items-start justify-between w-full relative">
            <div className="pointer-events-auto z-50">
                <ChatHistory messages={chatHistory} userInfo={userContext ? `${userContext.task}` : ''} />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-4xl flex justify-center z-40 gap-4">
                {appState === AppState.FOCUSED && (
                    <FocusModeTag 
                      isPaused={isFocusPaused}
                      onPauseToggle={() => setIsFocusPaused(!isFocusPaused)}
                      onClose={() => { setAppState(AppState.IDLE); setIsFocusPaused(false); }}
                    />
                )}
                {(isListening || subtitle) && (
                    <div className="px-8 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl subtitle-anim h-16 flex items-center">
                        <p className="text-xl font-light text-white">{subtitle || "..."}</p>
                    </div>
                )}
            </div>
            <div className="flex flex-col items-end gap-6 pointer-events-auto z-50">
                <AiOrb state={appState} />
                {resultData && appState === AppState.RESULT && userContext && (
                    <ResultCard 
                      data={resultData} 
                      onClose={resetCycle} 
                      onVoiceToggle={toggleVoice} 
                      isListening={isListening} 
                      mode={userContext.mode}
                      onConfirm={handleFocusConfirm}
                    />
                )}
            </div>
        </div>

        {(appState === AppState.ANALYZING || appState === AppState.RESULT || appState === AppState.HOVERING) && cropBox && userContext?.mode !== 1 && (
           <div 
              className={`absolute pointer-events-none z-20 crop-enter-anim ${
                appState === AppState.ANALYZING 
                  ? 'gradient-border-mask shadow-[0_0_60px_rgba(168,85,247,0.4)]' 
                  : 'border border-blue-400/40 rounded-[20px] shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-white/5 backdrop-blur-[2px]'
              }`}
              style={{ left: cropBox.x, top: cropBox.y, width: cropBox.size, height: cropBox.size }}
           >
              {(appState === AppState.ANALYZING || appState === AppState.RESULT) && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
                     <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                     <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase">Target</span>
                  </div>
              )}
           </div>
        )}
        
        {(userContext?.mode === 2 || userContext?.mode === 4) && appState === AppState.IDLE && hoverProgress > 0 && (
           <div 
             className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
             style={{ left: mousePos.x, top: mousePos.y }}
           >
             <svg width="60" height="60" className="transform -rotate-90">
                <circle cx="30" cy="30" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
                <circle 
                    cx="30" cy="30" r="24" 
                    stroke="white" strokeWidth="2" fill="none" strokeDasharray="150" strokeDashoffset={150 - (150 * hoverProgress) / 100}
                    className="transition-all duration-100 ease-linear"
                />
             </svg>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;
