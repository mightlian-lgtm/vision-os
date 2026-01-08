import React, { useState } from 'react';
import { UserContext } from '../types';

interface SetupModalProps {
  onComplete: (context: UserContext) => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<number>(4);
  const [task, setTask] = useState('');
  const [preferences, setPreferences] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) { // Preferences and status can be optional for some modes
      onComplete({ mode, task, preferences, status });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="mb-6 text-center">
             <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">环境感知设置</h2>
             <p className="text-gray-400 text-sm">选择模式并设定背景，让 AI 更懂你。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">交互模式</label>
              <select 
                value={mode}
                onChange={(e) => setMode(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none"
              >
                  <option value={4} className="bg-gray-900">模式 4：探索模式 (兴趣挖掘)</option>
                  <option value={3} className="bg-gray-900">模式 3：救援模式 (困境解决)</option>
                  <option value={2} className="bg-gray-900">模式 2：流畅模式 (流程预测)</option>
                  <option value={1} className="bg-gray-900">模式 1：专注模式 (勿扰辅助)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">当前任务</label>
              <input 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="例如：浏览购物网站、处理工作邮件"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">个人偏好</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="例如：喜欢科技、简约风格"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">近期状态</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="例如：感到无聊、有些焦虑"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
            >
              启动 AI 视觉感知
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupModal;