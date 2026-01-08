import React, { useRef, useEffect } from 'react';
import { StructuredResponse, MultiCardItem } from '../types';

// --- SVGs for Tool Icons ---
const iconMap: { [key: string]: React.ReactNode } = {
  Recording: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  Memo: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
  Camera: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Calculator: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
};

// --- Sub-Component for Mode 2 Multi-Card ---
const MultiCardRenderer: React.FC<{ item: MultiCardItem }> = ({ item }) => {
    switch(item.type) {
        case 'link':
            return (
                <a href={item.data.url} target="_blank" rel="noreferrer" className="block group p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-start gap-3">
                     <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0"><svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
                     <div>
                        <h4 className="font-medium text-sm text-blue-100 truncate group-hover:text-blue-300">{item.data.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.data.description}</p>
                     </div>
                </a>
            );
        case 'text':
             return <p className="p-3 text-sm text-gray-300 bg-white/5 rounded-xl border border-white/5">{item.data}</p>;
        case 'tool':
            return (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <div className="text-blue-300">{iconMap[item.data.name]}</div>
                    <span className="text-sm font-medium">{item.data.name}</span>
                </div>
            );
        case 'table': // Simplified table render
            return (
                <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-xs">
                    <table className="w-full">
                        <thead><tr>{item.data.headers.map(h => <th key={h} className="text-left p-1 border-b border-white/10">{h}</th>)}</tr></thead>
                        <tbody>{item.data.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="p-1">{cell}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            )
        default:
            return null;
    }
}

interface ResultCardProps {
  data: StructuredResponse;
  mode: number;
  onClose: () => void;
  onVoiceToggle: () => void;
  isListening: boolean;
  onConfirm?: () => void; // For Mode 1
}

const ResultCard: React.FC<ResultCardProps> = ({ data, mode, onClose, onVoiceToggle, isListening, onConfirm }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [data]);

  const renderModule3 = () => {
    if (data.isConfirmation && onConfirm) {
        return <div className="flex gap-4 pt-4"><button onClick={onClose} className="flex-1 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">取消</button><button onClick={onConfirm} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors">确认</button></div>;
    }
    if (data.linkCard) {
        return <div className="mt-2"><h3 className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-2 pl-1">推荐方案</h3><MultiCardRenderer item={{type: 'link', data: data.linkCard}} /></div>;
    }
    if (data.multiCardContent) {
        return <div className="space-y-2 pt-1"><h3 className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5 pl-1">下一步建议</h3>{data.multiCardContent.map((item, idx) => <MultiCardRenderer key={idx} item={item} />)}</div>
    }
    if (data.recommendations) {
        return (
            <div className="pt-1"><h3 className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5 pl-1">{mode === 1 ? '专注工具' : '推荐选项'}</h3>
              <div className={mode === 1 ? "grid grid-cols-3 gap-2 text-center" : "space-y-2"}>
                  {data.recommendations.map((item, idx) => mode === 1 ? (
                      <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 aspect-square"><div className="text-blue-300">{iconMap[item]}</div><span className="text-xs mt-1">{item}</span></div>
                    ) : (
                      <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 flex items-start gap-3 group"><span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-white/70 text-[10px] font-bold mt-0.5 shrink-0 group-hover:bg-blue-500/80">{idx + 1}</span><p className="text-sm text-gray-200 font-light leading-relaxed">{item}</p></div>
                    )
                  )}
              </div>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="w-[25vw] max-h-[66vh] flex flex-col backdrop-blur-3xl bg-black/60 border border-white/10 rounded-[24px] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 text-white font-sans overflow-hidden relative">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px]" />
      <div className="flex items-start justify-between p-5 pb-3 shrink-0 z-10">
        <h2 className="text-lg font-medium tracking-tight text-white/90 pr-2 truncate">{data.title}</h2>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-2 space-y-4 z-10" ref={scrollRef}>
        <div className="text-xs text-gray-400 font-light leading-relaxed pl-2 border-l-2 border-white/10 line-clamp-3">{data.insight}</div>
        {renderModule3()}
      </div>
      {!data.isConfirmation && (
          <div className="p-4 pt-2 shrink-0 flex justify-center z-10 bg-gradient-to-t from-black/40 to-transparent">
            <button onClick={onVoiceToggle} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border ${isListening ? 'bg-red-500/80 border-red-400/50 scale-110 animate-pulse' : 'bg-white/10 border-white/10 hover:bg-white/20 hover:scale-105'}`}>
              {isListening ? (<span className="relative flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-white shadow-sm"></span></span>) : (<svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>)}
            </button>
          </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }`}</style>
    </div>
  );
};

export default ResultCard;
