
import React, { useState } from 'react';
import { ProductionManifest, Shot, ViralCritique } from '../types';
import { Copy, Check, Clapperboard, User, Palette, Volume2, Download, Film, Loader2, Sparkles, Image as ImageIcon, Video, Music, Hash, TrendingUp, Printer, FileJson, Layers, Eye, Mic, Type, Images, Paintbrush, Wand2, FileCode, Zap } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ToastType } from './Toast';

interface ManifestViewProps {
  manifest: ProductionManifest;
  critique?: ViralCritique;
  onUpdate?: (updatedManifest: ProductionManifest) => void;
  onUpdateCritique?: (c: ViralCritique) => void;
  addToast: (message: string, type: ToastType) => void;
}

const ManifestView: React.FC<ManifestViewProps> = ({ manifest: initialManifest, critique, onUpdate, onUpdateCritique, addToast }) => {
  const [manifest, setManifest] = useState(initialManifest);
  const [copied, setCopied] = React.useState(false);
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [generatingShotId, setGeneratingShotId] = useState<number | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [isAutoPainting, setIsAutoPainting] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [refiningPromptId, setRefiningPromptId] = useState<number | null>(null);
  const [analyzingViral, setAnalyzingViral] = useState(false);

  const updateManifest = (newManifest: ProductionManifest) => {
      setManifest(newManifest);
      if (onUpdate) onUpdate(newManifest);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    addToast("Đã sao chép JSON vào Clipboard", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- PREMIUM: XML EXPORT ---
  const handleExportXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <project>
    <name>${manifest.concept.title}</name>
    <children>
      <sequence>
        <name>${manifest.concept.title}_Sequence</name>
        <rate><timebase>30</timebase><ntsc>TRUE</ntsc></rate>
        <media>
          <video>
            <format><samplecharacteristics><width>1080</width><height>1920</height></samplecharacteristics></format>
            <track>
              ${manifest.sequence.map((shot, index) => `
              <clipitem id="clipitem-${index}">
                <name>Shot_${index + 1}_${shot.scene_type}</name>
                <duration>${shot.duration_sec * 30}</duration>
                <rate><timebase>30</timebase><ntsc>TRUE</ntsc></rate>
                <start>${index * 30 * 3}</start>
                <end>${(index + 1) * 30 * 3}</end>
                <labels><label2>${shot.scene_type}</label2></labels>
              </clipitem>
              `).join('')}
            </track>
          </video>
          <audio>
            <track>
                 ${manifest.sequence.map((shot, index) => `
                  <clipitem id="audioitem-${index}">
                    <name>${shot.layers.audio_engineering.voice_persona}_VO</name>
                    <duration>${shot.duration_sec * 30}</duration>
                    <start>${index * 30 * 3}</start>
                    <end>${(index + 1) * 30 * 3}</end>
                  </clipitem>
                  `).join('')}
            </track>
          </audio>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${manifest.concept.title.replace(/\s+/g, '_')}_Premier.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Đã xuất file XML cho Premiere Pro", 'success');
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const safeName = manifest.concept.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchorNode.setAttribute("download", `script_${safeName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addToast("Đã tải xuống file JSON", 'success');
  };

  const downloadImage = (dataUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadAllImages = async () => {
      const shotsWithImages = manifest.sequence.filter(s => s.generatedImageUrl);
      if (shotsWithImages.length === 0) {
          addToast("Chưa có hình ảnh nào được tạo.", 'warning');
          return;
      }

      addToast(`Đang tải ${shotsWithImages.length} ảnh...`, 'info');
      
      for (let i = 0; i < shotsWithImages.length; i++) {
          const shot = shotsWithImages[i];
          if (shot.generatedImageUrl) {
              const safeTitle = manifest.concept.title.replace(/[^a-z0-9]/gi, '_').substring(0, 10);
              downloadImage(shot.generatedImageUrl, `shot_${String(shot.id).padStart(2, '0')}_${safeTitle}.png`);
              await new Promise(resolve => setTimeout(resolve, 500));
          }
      }
      addToast("Hoàn tất tải ảnh", 'success');
  };

  const playAudio = async (text: string, section: string) => {
    if (playingSection) return;
    setPlayingSection(section);
    
    try {
        const audioBuffer = await geminiService.generateSpeech(text, voice);
        if (audioBuffer) {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.onended = () => setPlayingSection(null);
            source.start(0);
        } else {
            setPlayingSection(null);
            addToast("Không thể tạo giọng đọc lúc này.", 'error');
        }
    } catch (e) {
        console.error(e);
        setPlayingSection(null);
        addToast("Lỗi hệ thống TTS", 'error');
    }
  };

  // --- PREMIUM: MAGIC PROMPT REFINER ---
  const handleRefinePrompt = async (shotId: number, currentPrompt: string) => {
      if (refiningPromptId) return;
      setRefiningPromptId(shotId);
      addToast("AI đang tối ưu hóa prompt...", 'info');
      
      try {
          const refined = await geminiService.refinePrompt(currentPrompt);
          const newSequence = manifest.sequence.map(s => {
              if (s.id === shotId) {
                  return { 
                      ...s, 
                      master_prompts: { ...s.master_prompts, midjourney: refined } 
                  };
              }
              return s;
          });
          updateManifest({ ...manifest, sequence: newSequence });
          addToast("Prompt đã được nâng cấp!", 'success');
      } catch (e) {
          addToast("Lỗi tối ưu prompt", 'error');
      } finally {
          setRefiningPromptId(null);
      }
  };

  // --- PREMIUM: VIRAL ANALYSIS ---
  const handleViralAnalysis = async () => {
      if (analyzingViral) return;
      setAnalyzingViral(true);
      addToast("Viral Agent đang chấm điểm kịch bản...", 'info');
      try {
          const result = await geminiService.analyzeViralPotential(manifest);
          if (onUpdateCritique) onUpdateCritique(result);
          addToast("Phân tích hoàn tất!", 'success');
      } catch (e) {
          addToast("Lỗi phân tích", 'error');
      } finally {
          setAnalyzingViral(false);
      }
  };

  const generateShotImage = async (shot: Shot) => {
    if (generatingShotId) return;
    setGeneratingShotId(shot.id);
    
    try {
        const prompt = shot.master_prompts?.midjourney || shot.layers?.visual_core?.action || "Cinematic shot";
        const imageUrl = await geminiService.generateVisualForShot(prompt);
        if (imageUrl) {
            const newSequence = manifest.sequence.map(s => s.id === shot.id ? { ...s, generatedImageUrl: imageUrl } : s);
            updateManifest({ ...manifest, sequence: newSequence });
            addToast(`Đã tạo ảnh cho Shot ${shot.id}`, 'success');
        } else {
            addToast("Không thể tạo ảnh, vui lòng thử lại", 'warning');
        }
    } catch (e) {
        console.error(e);
        addToast("Lỗi kết nối khi tạo ảnh", 'error');
    } finally {
        setGeneratingShotId(null);
    }
  };

  const handleAutoPaint = async () => {
      if (isAutoPainting) return;
      setIsAutoPainting(true);
      const shotsToProcess = manifest.sequence.filter(s => !s.generatedImageUrl);
      addToast(`Bắt đầu vẽ ${shotsToProcess.length} shots còn thiếu...`, 'info');
      
      try {
          for (const shot of shotsToProcess) {
              setGeneratingShotId(shot.id);
              const prompt = shot.master_prompts?.midjourney || shot.layers?.visual_core?.action || "Cinematic shot";
              const imageUrl = await geminiService.generateVisualForShot(prompt);
              
              if (imageUrl) {
                  setManifest(current => {
                      const updated = {
                          ...current,
                          sequence: current.sequence.map(s => s.id === shot.id ? { ...s, generatedImageUrl: imageUrl } : s)
                      };
                      if (onUpdate) onUpdate(updated);
                      return updated;
                  });
              }
              await new Promise(resolve => setTimeout(resolve, 1500)); 
          }
          addToast("Hoàn tất vẽ Batch!", 'success');
      } catch (e) {
          console.error("Auto Paint Error", e);
          addToast("Lỗi trong quá trình vẽ tự động", 'error');
      } finally {
          setGeneratingShotId(null);
          setIsAutoPainting(false);
      }
  };

  const generateHookVideo = async () => {
    if (generatingVideo) return;
    setGeneratingVideo(true);
    addToast("Đang gửi yêu cầu Veo Video (có thể mất 1-2 phút)...", 'info');
    try {
        const veoPrompt = manifest.sequence[0]?.master_prompts?.veo || "Cinematic product shot";
        const prompt = `${manifest.script.hook}. ${veoPrompt}`;
        
        const videoUrl = await geminiService.generateVeoVideo(prompt);
        if (videoUrl) {
             updateManifest({ ...manifest, generatedVideoUrl: videoUrl });
             addToast("Đã tạo Video thành công!", 'success');
        }
    } catch (e) {
        console.error(e);
        addToast("Lỗi tạo video Veo (Kiểm tra Billing API Key)", 'error');
    } finally {
        setGeneratingVideo(false);
    }
  };

  const SectionCard = ({ icon: Icon, color, title, content }: any) => (
      <div className="bg-slate-800/40 backdrop-blur p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors print:border-slate-300 print:bg-white print:text-black">
        <div className={`flex items-center gap-2 ${color} mb-3`}>
            <Icon size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed print:text-black whitespace-pre-line">{content}</p>
      </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 print:block print:h-auto print:text-black">
      
      {/* 1. Header & Stats */}
      <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">MULTI-LAYER PRO</span>
              <span className="text-slate-400 text-xs">ID: {manifest.projectId.split('-')[0]}</span>
          </div>
          <div className="flex gap-2">
              <button onClick={handleExportXML} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors">
                  <FileCode size={14} /> Premiere XML
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-slate-700">
                  <FileJson size={14} /> JSON
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-slate-700">
                  <Printer size={14} /> PDF
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
        <SectionCard 
            icon={User} 
            color="text-indigo-400" 
            title="Target Audience" 
            content={manifest.dna.targetAudience} 
        />
        <SectionCard 
            icon={Palette} 
            color="text-pink-400" 
            title="Visual Style" 
            content={`${manifest.visualAnchors.style}\n${manifest.visualAnchors.environment}`} 
        />
        <SectionCard 
            icon={Clapperboard} 
            color="text-emerald-400" 
            title="Production Stats" 
            content={`${manifest.sequence.length} Shots • ${manifest.totalDuration}s • ~$${manifest.estimatedCost}`} 
        />
      </div>

      {/* 2. Viral Critique Section (NEW) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 rounded-xl border border-slate-800 p-4 print:break-inside-avoid">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2">
                 <Zap size={16} className="text-amber-400" /> Viral Agent Review
             </h3>
             <button 
                 onClick={handleViralAnalysis}
                 disabled={analyzingViral}
                 className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-2 hover:bg-amber-500/20 transition-colors"
             >
                 {analyzingViral ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                 {critique ? "Re-Analyze" : "Run Analysis"}
             </button>
         </div>
         
         {critique ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                 <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                     <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-600 mb-1">{critique.score}</div>
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest">Viral Score</span>
                 </div>
                 <div className="col-span-2 space-y-3">
                     <div className="flex gap-3">
                         <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                             <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Hook Analysis</p>
                             <p className="text-xs text-slate-300">{critique.hookAnalysis}</p>
                         </div>
                         <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                             <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Pacing</p>
                             <p className="text-xs text-slate-300">{critique.pacingAnalysis}</p>
                         </div>
                     </div>
                     <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-lg">
                         <p className="text-[10px] text-green-500 font-bold uppercase mb-1 flex items-center gap-1"><Check size={10} /> Top Suggestion</p>
                         <p className="text-xs text-green-300">{critique.improvementSuggestions[0]}</p>
                     </div>
                 </div>
             </div>
         ) : (
             <div className="text-center py-6 text-slate-500 text-xs italic bg-slate-950/30 rounded-lg">
                 Chưa có dữ liệu phân tích. Nhấn nút "Run Analysis" để AI chấm điểm kịch bản.
             </div>
         )}
      </div>

      {/* 3. Audio Script Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden print:bg-white print:border-slate-300 print:shadow-none print:break-inside-avoid">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl print:hidden"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 print:text-black">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Film size={18} />
                </div>
                Kịch Bản Tổng Thể (Voice & Audio)
            </h3>
            <div className="flex items-center gap-2 print:hidden">
                <span className="text-xs text-slate-500">Voice:</span>
                <select 
                    value={voice} 
                    onChange={(e) => setVoice(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500"
                >
                    <option value="Kore">Kore (Nam)</option>
                    <option value="Fenrir">Fenrir (Nam Trầm)</option>
                    <option value="Puck">Puck (Nữ)</option>
                    <option value="Zephyr">Zephyr (Nữ Nhẹ)</option>
                </select>
            </div>
        </div>
        
        <div className="space-y-4 relative z-10">
            {['hook', 'body', 'cta'].map((key) => {
                const text = (manifest.script as any)[key];
                const isPlaying = playingSection === key;
                return (
                    <div key={key} className="group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-slate-800 print:bg-gray-100 print:border-gray-300 print:text-black">
                                {key === 'hook' ? '01. Hook (3s)' : key === 'body' ? '02. Solution Body' : '03. Call To Action'}
                            </span>
                            <div className="flex gap-2 print:hidden">
                                {key === 'hook' && (
                                    <button
                                        onClick={generateHookVideo}
                                        disabled={generatingVideo || !!manifest.generatedVideoUrl}
                                        className={`text-xs flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${manifest.generatedVideoUrl ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                                    >
                                        {generatingVideo ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
                                        {manifest.generatedVideoUrl ? "Đã có Video" : "Tạo Veo Video"}
                                    </button>
                                )}
                                <button 
                                    onClick={() => playAudio(text, key)}
                                    disabled={!!playingSection}
                                    className={`
                                        text-xs flex items-center gap-2 px-3 py-1 rounded-full transition-all border
                                        ${isPlaying 
                                            ? 'bg-indigo-500 text-white border-indigo-400' 
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}
                                    `}
                                >
                                    {isPlaying ? <Loader2 size={12} className="animate-spin"/> : <Volume2 size={12} />}
                                    {isPlaying ? 'Playing...' : 'Nghe Thử'}
                                </button>
                            </div>
                        </div>
                        <div 
                            contentEditable 
                            suppressContentEditableWarning
                            className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-slate-200 text-sm leading-relaxed shadow-inner outline-none focus:ring-1 focus:ring-indigo-500/50 print:bg-white print:text-black print:border-slate-200"
                        >
                            {text}
                        </div>
                        {key === 'hook' && manifest.generatedVideoUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 relative aspect-video w-1/2 mx-auto print:hidden">
                                <video src={manifest.generatedVideoUrl} controls autoPlay muted className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* 4. VISUAL SEQUENCE (MULTI-LAYER) */}
      <div className="space-y-4 print:break-before-page">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 print:text-black">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers size={18} />
            </div>
            Multi-Layer Storyboard
            </h3>
            <div className="flex gap-2">
                <button 
                    onClick={handleAutoPaint}
                    disabled={isAutoPainting}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border print:hidden
                        ${isAutoPainting 
                            ? 'bg-slate-800 text-slate-400 border-slate-700' 
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}
                    `}
                >
                    {isAutoPainting ? <Loader2 size={14} className="animate-spin" /> : <Paintbrush size={14} />}
                    {isAutoPainting ? 'Đang Vẽ (Batch)...' : 'Auto-Paint All'}
                </button>
                <button 
                    onClick={handleDownloadAllImages}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors print:hidden"
                >
                    <Images size={14} /> Tải Tất Cả Ảnh
                </button>
            </div>
        </div>
        
        <div className="grid gap-4">
            {manifest.sequence.map((shot) => {
                const visualCore = shot.layers?.visual_core || { subject: 'N/A', action: 'N/A', lighting: 'N/A', camera_movement: 'N/A' };
                const audioLayer = shot.layers?.audio_engineering || { voice_script: 'N/A', voice_persona: 'N/A', sfx_ambience: 'N/A' };
                const tiktokLayer = shot.layers?.tiktok_native || { text_overlay: 'N/A', text_position: 'N/A' };
                const masterPrompts = shot.master_prompts || { midjourney: '', veo: '' };

                return (
                <div key={shot.id} className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all group print:bg-white print:border-slate-300 print:text-black print:break-inside-avoid shadow-sm">
                    
                    {/* Shot Header */}
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg font-bold text-slate-500 border border-slate-700 print:bg-slate-100 print:text-black">
                                {shot.id}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{shot.time_stamp}</span>
                                    <span className="text-[10px] font-mono text-slate-500">{shot.duration_sec}s</span>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">{shot.scene_type || 'SCENE'}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => generateShotImage(shot)}
                            disabled={generatingShotId === shot.id || isAutoPainting}
                            className="w-10 h-10 rounded-lg border border-slate-700 bg-black/40 flex items-center justify-center hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-slate-600 print:hidden"
                            title="Tạo hình ảnh minh họa"
                        >
                            {generatingShotId === shot.id ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                        </button>
                    </div>

                    {/* 3-COLUMN LAYOUT */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* COL 1: VISUAL CORE */}
                        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 flex flex-col gap-2">
                             <div className="flex items-center gap-2 mb-1 border-b border-slate-800/50 pb-1">
                                 <Eye size={12} className="text-blue-400" />
                                 <span className="text-[10px] font-bold text-blue-400 uppercase">Visual Layer</span>
                             </div>
                             <div className="space-y-2">
                                 <div>
                                     <p className="text-[10px] text-slate-500 uppercase">Subject & Action</p>
                                     <p className="text-xs text-slate-300 leading-snug">{visualCore.subject}. {visualCore.action}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div>
                                         <p className="text-[10px] text-slate-500 uppercase">Lighting</p>
                                         <p className="text-[10px] text-slate-400">{visualCore.lighting}</p>
                                     </div>
                                     <div>
                                         <p className="text-[10px] text-slate-500 uppercase">Camera</p>
                                         <p className="text-[10px] text-slate-400">{visualCore.camera_movement}</p>
                                     </div>
                                 </div>
                             </div>
                             
                             {shot.generatedImageUrl && (
                                 <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-700 w-full aspect-[9/16] group/image">
                                     <img src={shot.generatedImageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                        <p className="text-white font-bold text-center leading-tight drop-shadow-md" style={{
                                            fontSize: '14px',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                        }}>
                                            {tiktokLayer.text_overlay}
                                        </p>
                                     </div>
                                     <div className="absolute top-2 right-2 bg-black/60 text-[8px] text-white px-1.5 py-0.5 rounded backdrop-blur">
                                         PREVIEW
                                     </div>
                                     <button 
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             const safeTitle = manifest.concept.title.replace(/[^a-z0-9]/gi, '_').substring(0, 10);
                                             downloadImage(shot.generatedImageUrl!, `shot_${String(shot.id).padStart(2, '0')}_${safeTitle}.png`);
                                         }}
                                         className="absolute top-2 left-2 bg-black/60 hover:bg-indigo-600 text-white p-1.5 rounded-full backdrop-blur opacity-0 group-hover/image:opacity-100 transition-opacity"
                                         title="Tải ảnh này"
                                     >
                                         <Download size={12} />
                                     </button>
                                 </div>
                             )}
                        </div>

                        {/* COL 2: AUDIO ENGINEERING */}
                        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 flex flex-col gap-2">
                             <div className="flex items-center gap-2 mb-1 border-b border-slate-800/50 pb-1">
                                 <Mic size={12} className="text-pink-400" />
                                 <span className="text-[10px] font-bold text-pink-400 uppercase">Audio Layer</span>
                             </div>
                             <div className="space-y-3">
                                 <div>
                                     <div className="flex justify-between items-center mb-1">
                                         <p className="text-[10px] text-slate-500 uppercase">Voiceover</p>
                                         <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 rounded">{audioLayer.voice_persona}</span>
                                     </div>
                                     <p className="text-xs text-slate-300 italic">"{audioLayer.voice_script}"</p>
                                 </div>
                                 <div className="bg-pink-500/5 p-2 rounded border border-pink-500/10">
                                     <p className="text-[10px] text-pink-500 uppercase font-bold mb-1">SFX / Ambience</p>
                                     <p className="text-xs text-pink-300/80 font-medium">{audioLayer.sfx_ambience}</p>
                                 </div>
                             </div>
                        </div>

                        {/* COL 3: TIKTOK & PROMPTS */}
                        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 flex flex-col gap-2">
                             <div className="flex items-center gap-2 mb-1 border-b border-slate-800/50 pb-1">
                                 <Type size={12} className="text-emerald-400" />
                                 <span className="text-[10px] font-bold text-emerald-400 uppercase">TikTok & Prompts</span>
                             </div>
                             
                             <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10 mb-2">
                                 <p className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Text Overlay</p>
                                 <p className="text-xs text-white font-bold text-center py-2 bg-black/40 rounded border border-emerald-500/20">
                                     {tiktokLayer.text_overlay}
                                 </p>
                                 <p className="text-[9px] text-emerald-400/60 mt-1 text-center">Position: {tiktokLayer.text_position}</p>
                             </div>

                             <div className="space-y-2 mt-auto print:hidden">
                                <div className="bg-black/40 p-2 rounded border border-slate-800/50 relative group/prompt">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <Sparkles size={8} className="text-purple-400" />
                                            <span className="text-[9px] font-bold text-purple-400">MIDJOURNEY</span>
                                        </div>
                                        <button 
                                            onClick={() => handleRefinePrompt(shot.id, masterPrompts.midjourney)}
                                            disabled={!!refiningPromptId}
                                            className="opacity-0 group-hover/prompt:opacity-100 transition-opacity text-indigo-400 hover:text-white"
                                            title="Tự động nâng cấp Prompt"
                                        >
                                           {refiningPromptId === shot.id ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10}/>}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono line-clamp-2 hover:line-clamp-none cursor-text select-all">
                                        {masterPrompts.midjourney} --ar 9:16
                                    </p>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-slate-800/50">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Video size={8} className="text-cyan-400" />
                                        <span className="text-[9px] font-bold text-cyan-400">VEO VIDEO</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono line-clamp-2 hover:line-clamp-none cursor-text select-all">
                                        {masterPrompts.veo}
                                    </p>
                                </div>
                             </div>
                        </div>

                    </div>
                </div>
            )})}
        </div>
      </div>

      {/* 5. Footer Actions */}
      <div className="bg-black/80 rounded-xl overflow-hidden border border-slate-800 print:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <Hash size={16} />
            <span className="text-xs font-mono font-medium">manifest_final.json</span>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleCopy}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Sao chép JSON"
            >
                {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <pre className="p-4 text-[10px] font-mono text-emerald-500/80 overflow-x-auto max-h-40 custom-scrollbar">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ManifestView;
