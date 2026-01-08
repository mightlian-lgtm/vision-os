import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Sender } from '../types';

interface ChatHistoryProps {
  messages: ChatMessage[];
  userInfo: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, userInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div 
      className={`
        flex flex-col
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl
        overflow-hidden rounded-2xl
        ${isOpen ? 'w-80 h-[50vh]' : 'w-16 h-16 cursor-pointer hover:bg-white/10'}
      `}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      {/* Header / Toggle */}
      <div className={`flex items-center ${isOpen ? 'justify-between p-4 border-b border-white/5' : 'justify-center h-full w-full'}`}>
        {isOpen ? (
            <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">
                历史对话
            </span>
        ) : (
            <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        )}
        
        {isOpen && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="text-white/40 hover:text-white transition-colors"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" ref={scrollRef}>
          {/* User Context Block */}
          {userInfo && (
             <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-[10px] text-blue-200/80 leading-relaxed">
                <strong className="block text-blue-400/90 mb-1 uppercase tracking-wider">当前背景</strong>
                {userInfo}
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] rounded-2xl p-3 text-sm font-light leading-relaxed shadow-sm
                  ${msg.sender === Sender.USER 
                    ? 'bg-purple-600/30 text-white rounded-br-sm border border-purple-500/20' 
                    : msg.sender === Sender.MODEL
                        ? 'bg-white/10 text-gray-200 rounded-bl-sm border border-white/5'
                        : 'bg-transparent text-gray-500 border border-gray-800 italic text-xs'
                  }
                `}
              >
                {msg.text && <p>{msg.text}</p>}
                
                {msg.images && msg.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {msg.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt="Context" 
                        className="w-12 h-12 object-cover rounded-md border border-white/10 opacity-80 hover:opacity-100 transition-opacity" 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default ChatHistory;