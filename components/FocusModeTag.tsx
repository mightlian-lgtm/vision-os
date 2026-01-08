import React, { useState } from 'react';

interface FocusModeTagProps {
  isPaused: boolean;
  onPauseToggle: () => void;
  onClose: () => void;
}

const FocusModeTag: React.FC<FocusModeTagProps> = ({ isPaused, onPauseToggle, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPauseToggle();
    setIsExpanded(false);
  };
  
  const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
  };

  return (
    <div 
      className={`
        relative flex items-center justify-center transition-all duration-300 ease-in-out
        bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full
        ${isExpanded ? 'w-48 h-16' : 'w-auto h-16 px-6 cursor-pointer hover:bg-white/10'}
      `}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {isExpanded ? (
        // --- EXPANDED VIEW ---
        <div className="w-full flex items-center justify-around animate-in fade-in duration-300">
          <button onClick={handlePause} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            {isPaused ? 
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              :
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
          </button>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </button>
           <button onClick={handleToggleExpand} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>
      ) : (
        // --- COLLAPSED VIEW ---
        <div className="flex items-center gap-3 animate-in fade-in duration-300">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-sm font-medium text-white/90">
            {isPaused ? '沉浸模式暂停' : '沉浸模式进行中'}
          </span>
        </div>
      )}
    </div>
  );
};

export default FocusModeTag;