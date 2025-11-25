
import React, { useState, useEffect } from 'react';
import { BrandProfile, ToneType } from '../types';
import { dbService } from '../services/dbService';
import { X, Save, Trash2, CheckCircle, Plus, Briefcase, User, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: BrandProfile) => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

const BrandProfileModal: React.FC<Props> = ({ isOpen, onClose, onSelect, addToast }) => {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newName, setNewName] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newTone, setNewTone] = useState<ToneType>('Professional');

  useEffect(() => {
    if (isOpen) loadProfiles();
  }, [isOpen]);

  const loadProfiles = async () => {
    const data = await dbService.getAllProfiles();
    setProfiles(data);
  };

  const handleSave = async () => {
    if (!newName || !newContext) return;
    const profile: BrandProfile = {
      id: crypto.randomUUID(),
      name: newName,
      context: newContext,
      tone: newTone
    };
    await dbService.saveProfile(profile);
    addToast('Đã lưu hồ sơ Brand mới', 'success');
    await loadProfiles();
    setView('LIST');
    setNewName('');
    setNewContext('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xóa hồ sơ này?')) {
      await dbService.deleteProfile(id);
      await loadProfiles();
    }
  };

  const filtered = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] w-full max-w-2xl h-[70vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="text-indigo-400" size={20} />
                Brand DNA Vault
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
            {view === 'LIST' ? (
                <div className="h-full flex flex-col">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm Brand..." 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setView('CREATE')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Thêm Mới
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">
                                Chưa có hồ sơ nào. Hãy tạo mới!
                            </div>
                        ) : (
                            filtered.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => onSelect(p)}
                                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-1">{p.context}</p>
                                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">{p.tone}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDelete(p.id, e)}
                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col">
                     <button onClick={() => setView('LIST')} className="text-slate-400 text-sm mb-4 hover:text-white flex items-center gap-1">← Quay lại</button>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tên Brand</label>
                             <input 
                                 className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-indigo-500"
                                 placeholder="VD: Nike, Apple..."
                                 value={newName}
                                 onChange={e => setNewName(e.target.value)}
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Context / DNA (Reusable)</label>
                             <textarea 
                                 className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 text-sm outline-none focus:border-indigo-500 resize-none"
                                 placeholder="Nhập thông tin cốt lõi về thương hiệu..."
                                 value={newContext}
                                 onChange={e => setNewContext(e.target.value)}
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tone Mặc Định</label>
                             <select 
                                 value={newTone}
                                 onChange={e => setNewTone(e.target.value as ToneType)}
                                 className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-indigo-500"
                             >
                                 <option value="Professional">Professional</option>
                                 <option value="Emotional">Emotional</option>
                                 <option value="Witty">Witty</option>
                                 <option value="Urgent">Urgent</option>
                                 <option value="Luxury">Luxury</option>
                                 <option value="Minimalist">Minimalist</option>
                             </select>
                         </div>
                         <button 
                             onClick={handleSave}
                             disabled={!newName || !newContext}
                             className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold mt-4 shadow-lg transition-all"
                         >
                             Lưu Hồ Sơ
                         </button>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BrandProfileModal;
