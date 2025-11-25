
import React, { useState, useEffect } from 'react';
import { PromptConfig } from '../types';
import { X, Save, RotateCcw, BookOpen, Terminal, Sparkles, ScrollText, Wand2 } from 'lucide-react';
import { SYSTEM_INSTRUCTION, BRAINSTORM_PROMPT, EXECUTION_PROMPT, ENHANCE_INSTRUCTION } from '../constants';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: PromptConfig;
  onSave: (config: PromptConfig) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [activeTab, setActiveTab] = useState<keyof PromptConfig>('brainstorm');
  const [tempConfig, setTempConfig] = useState<PromptConfig>(currentConfig);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state when prop changes
  useEffect(() => {
    setTempConfig(currentConfig);
  }, [currentConfig]);

  if (!isOpen) return null;

  const handleTextChange = (val: string) => {
    setTempConfig(prev => ({ ...prev, [activeTab]: val }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(tempConfig);
    setIsDirty(false);
    onClose();
  };

  const handleResetCurrent = () => {
    let defaultVal = "";
    switch (activeTab) {
        case 'system': defaultVal = SYSTEM_INSTRUCTION; break;
        case 'brainstorm': defaultVal = BRAINSTORM_PROMPT; break;
        case 'execution': defaultVal = EXECUTION_PROMPT; break;
        case 'enhance': defaultVal = ENHANCE_INSTRUCTION; break;
    }
    setTempConfig(prev => ({ ...prev, [activeTab]: defaultVal }));
    setIsDirty(true);
  };

  const tabs = [
    { id: 'brainstorm', label: 'Brainstorm Agent', icon: Sparkles, desc: 'Phân tích ảnh & trích xuất concepts' },
    { id: 'execution', label: 'Scripting Agent', icon: ScrollText, desc: 'Viết kịch bản chi tiết & Shotlist' },
    { id: 'system', label: 'System Core', icon: Terminal, desc: 'Chỉ thị hệ thống cốt lõi' },
    { id: 'enhance', label: 'Enhancer', icon: Wand2, desc: 'Tối ưu mô tả đầu vào' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Thư viện Prompt</h2>
                    <p className="text-xs text-slate-400">Tùy chỉnh logic của AI Agents</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col overflow-y-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as keyof PromptConfig)}
                            className={`flex items-start gap-3 p-4 text-left transition-all border-l-2 hover:bg-slate-800/50 ${isActive ? 'border-indigo-500 bg-slate-800' : 'border-transparent'}`}
                        >
                            <Icon size={18} className={`mt-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <div>
                                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{tab.label}</div>
                                <div className="text-[10px] text-slate-500 mt-1 leading-tight">{tab.desc}</div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-[#0b1121] relative">
                
                {/* Editor Toolbar */}
                <div className="px-6 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                    <span className="text-xs font-mono text-slate-500 uppercase">Editing: {activeTab.toUpperCase()}</span>
                    <button 
                        onClick={handleResetCurrent}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                        <RotateCcw size={12} /> Reset to Default
                    </button>
                </div>

                <textarea
                    value={tempConfig[activeTab]}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-slate-300 outline-none resize-none leading-relaxed custom-scrollbar"
                    spellCheck={false}
                />

                {/* Footer Action */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all
                            ${isDirty 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                        `}
                    >
                        <Save size={16} /> Lưu Thay Đổi
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PromptLibrary;
