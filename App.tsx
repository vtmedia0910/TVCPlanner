
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Layers, 
  Cpu, 
  Zap,
  Activity,
  Wand2,
  Check,
  BrainCircuit,
  LayoutGrid,
  Play,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  Square,
  CheckSquare,
  Package,
  Image as ImageIcon,
  Clock,
  Factory,
  Database,
  FolderDown,
  Archive,
  BookOpen,
  Briefcase,
  CircleHelp
} from 'lucide-react';
import { 
  ProjectTask, 
  PipelineStep,
  ToneType,
  PlatformType,
  ScriptConcept,
  ProductionManifest,
  ProductDNA,
  Shot,
  PromptConfig,
  BrandProfile,
  ViralCritique
} from './types';
import { SYSTEM_INSTRUCTION, BRAINSTORM_PROMPT, EXECUTION_PROMPT, ENHANCE_INSTRUCTION } from './constants';
import { geminiService } from './services/geminiService';
import { dbService } from './services/dbService';
import ProductCard from './components/ProductCard';
import ManifestView from './components/ManifestView';
import WelcomeScreen from './components/WelcomeScreen';
import PromptLibrary from './components/PromptLibrary';
import BrandProfileModal from './components/BrandProfileModal';
import UserGuideModal from './components/UserGuideModal';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';

// CONSTANTS FOR RATE LIMITING
const SCRIPT_DELAY_SECONDS = 40; 
const CAMPAIGN_DELAY_SECONDS = 120; 

export default function App() {
  // --- UI State ---
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize projects as empty array, load from IDB on mount
  const [projects, setProjects] = useState<ProjectTask[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewingConceptId, setViewingConceptId] = useState<string | null>(null);

  // --- FACTORY MODE STATE ---
  const [isFactoryMode, setIsFactoryMode] = useState(false);
  const [isFactoryRunning, setIsFactoryRunning] = useState(false);
  const [factoryStatus, setFactoryStatus] = useState("");
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isBatchRendering, setIsBatchRendering] = useState(false);
  const [batchCountdown, setBatchCountdown] = useState(0); 
  const batchQueueRef = useRef<string[]>([]);
  const timerRef = useRef<any>(null); 

  // Input State
  const [newName, setNewName] = useState("");
  const [newContext, setNewContext] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  
  // Config State
  const [tone, setTone] = useState<ToneType>('Emotional');
  const [platform, setPlatform] = useState<PlatformType>('TikTok');
  const [useSearch, setUseSearch] = useState(false);
  const [useDeepThinking, setUseDeepThinking] = useState(false);

  // Prompt Configuration State
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
      system: SYSTEM_INSTRUCTION,
      brainstorm: BRAINSTORM_PROMPT,
      execution: EXECUTION_PROMPT,
      enhance: ENHANCE_INSTRUCTION
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // --- TOAST HELPER ---
  const addToast = (message: string, type: ToastType = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      addToast("Chưa cấu hình API Key trong môi trường!", 'error');
    }
  }, []);

  // --- DATABASE PERSISTENCE ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedProjects = await dbService.getAllProjects();
        loadedProjects.sort((a, b) => b.createdAt - a.createdAt);
        setProjects(loadedProjects);
      } catch (e) {
        console.error("Failed to load projects from DB", e);
        addToast("Lỗi tải dữ liệu cũ", 'error');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;
    const saveTimer = setTimeout(() => {
        projects.forEach(p => dbService.saveProject(p));
    }, 1000); // 1s Debounce

    return () => clearTimeout(saveTimer);
  }, [projects]);


  // Clean selection when switching projects
  useEffect(() => {
      setSelectedConceptIds(new Set());
      setIsBatchRunning(false);
      setIsBatchRendering(false);
      setBatchCountdown(0);
      if (timerRef.current) clearInterval(timerRef.current);
  }, [selectedProjectId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + newImages.length > 5) {
          addToast("Tối đa 5 ảnh cho mỗi dự án", 'warning');
          return;
      }

      const base64Promises = files.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file as Blob);
      }));

      try {
          const base64Results = await Promise.all(base64Promises);
          setNewImages(prev => [...prev, ...base64Results]);
          addToast(`Đã thêm ${base64Results.length} ảnh`, 'success');
      } catch (error: any) {
          console.error("Error converting images", error);
          addToast("Lỗi tải ảnh. Vui lòng thử lại.", 'error');
      }
    }
  };

  const removeImage = (index: number) => {
      setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceDescription = async () => {
    if (!newContext || isEnhancing || apiKeyMissing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await geminiService.enhanceDescription(newContext || "", promptConfig.enhance);
      setNewContext(enhanced);
      addToast("Nội dung đã được tối ưu hóa!", 'success');
    } catch (err: any) {
      addToast("Không thể tối ưu mô tả lúc này.", 'warning');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSelectBrandProfile = (profile: BrandProfile) => {
      setNewName(prev => prev || profile.name); // Keep existing name if typed
      setNewContext(profile.context);
      setTone(profile.tone);
      setShowBrandModal(false);
      addToast(`Đã áp dụng hồ sơ Brand: ${profile.name}`, 'success');
  };

  // --- FACTORY INPUT ---
  const handleCreateOrQueue = async () => {
    if (!newName || !newContext) {
        addToast("Vui lòng nhập tên và nội dung context", 'warning');
        return;
    }
    if (apiKeyMissing) { 
        addToast("Missing API KEY", 'error'); 
        return; 
    }

    const projectId = crypto.randomUUID();
    const newProject: ProjectTask = {
      id: projectId,
      createdAt: Date.now(),
      status: isFactoryMode ? 'QUEUED' : 'BRAINSTORMING',
      input: {
        id: projectId,
        name: newName,
        context: newContext,
        images: newImages, 
        config: { tone, platform, useSearch, useDeepThinking }
      },
      concepts: []
    };

    setProjects(prev => [newProject, ...prev]);
    dbService.saveProject(newProject);
    
    setNewName("");
    setNewContext("");
    setNewImages([]);

    if (isFactoryMode) {
        addToast("Đã thêm vào hàng đợi Factory", 'success');
    } else {
        setSelectedProjectId(projectId);
        await performBrainstorm(newProject);
    }
  };

  const performBrainstorm = async (project: ProjectTask): Promise<{ dna: ProductDNA, concepts: Omit<ScriptConcept, 'id' | 'state'>[] }> => {
      try {
        const result = await geminiService.analyzeProject(
            project.input.name,
            project.input.context,
            project.input.images,
            (log: string) => console.log(log),
            promptConfig 
        );

        setProjects(prev => prev.map(p => {
            if (p.id === project.id) {
                return {
                    ...p,
                    status: 'READY',
                    dna: result.dna,
                    concepts: result.concepts.map((c, idx) => ({
                        ...c,
                        id: `${project.id}-c-${idx}`,
                        state: { status: PipelineStep.IDLE, progress: 0, logs: [] }
                    }))
                };
            }
            return p;
        }));
        return result; 
      } catch (err: any) {
        const e = err as any;
        console.error(e);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'DRAFT' } : p)); 
        addToast(`Lỗi phân tích: ${e?.message || String(e)}`, 'error');
        throw e;
      }
  };

  const toggleSelection = (conceptId: string) => {
      const newSet = new Set(selectedConceptIds);
      if (newSet.has(conceptId)) {
          newSet.delete(conceptId);
      } else {
          newSet.add(conceptId);
      }
      setSelectedConceptIds(newSet);
  };

  const toggleSelectAll = () => {
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;
      
      if (selectedConceptIds.size === project.concepts.length) {
          setSelectedConceptIds(new Set());
      } else {
          setSelectedConceptIds(new Set(project.concepts.map(c => c.id)));
      }
  };

  // --- BATCH SCRIPTING ENGINE ---
  const runBatchScripts = async () => {
      if (isBatchRunning || selectedConceptIds.size === 0) return;
      setIsBatchRunning(true);
      setBatchCountdown(0);
      
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const queue = project.concepts
          .filter(c => selectedConceptIds.has(c.id) && (c.state.status === PipelineStep.IDLE || c.state.status === PipelineStep.ERROR))
          .map(c => c.id);

      batchQueueRef.current = queue;
      addToast(`Bắt đầu xử lý hàng loạt ${queue.length} scripts`, 'info');
      processNextScriptInQueue(project.id);
  };

  const processNextScriptInQueue = async (targetProjectId: string) => {
      if (batchQueueRef.current.length === 0) {
          setIsBatchRunning(false);
          setBatchCountdown(0);
          addToast("Hoàn tất xử lý hàng loạt!", 'success');
          return;
      }

      const nextId = batchQueueRef.current[0];
      
      try {
          await runConcept(targetProjectId, nextId, true); 
      } catch (error: any) {
          console.error(`Batch Error on ${nextId}, skipping...`, error);
      }

      batchQueueRef.current.shift();

      if (batchQueueRef.current.length > 0) {
          let remainingSeconds = SCRIPT_DELAY_SECONDS;
          setBatchCountdown(remainingSeconds);

          if (timerRef.current) clearInterval(timerRef.current);
          
          timerRef.current = setInterval(() => {
              remainingSeconds -= 1;
              setBatchCountdown(remainingSeconds);

              if (remainingSeconds <= 0) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setBatchCountdown(0);
                  processNextScriptInQueue(targetProjectId); 
              }
          }, 1000);
      } else {
          setIsBatchRunning(false);
          setBatchCountdown(0);
          addToast("Hoàn tất xử lý hàng loạt!", 'success');
      }
  };

  const runConcept = async (targetProjectId: string, conceptId: string, isBatch: boolean = false) => {
      const project = projects.find(p => p.id === targetProjectId);
      if (!project || !project.dna) return;
      
      const conceptIndex = project.concepts.findIndex(c => c.id === conceptId);
      if (conceptIndex === -1) return;

      const updateConceptState = (partial: Partial<ScriptConcept['state']>) => {
          setProjects(prev => prev.map(p => {
              if (p.id === targetProjectId) {
                  const newConcepts = [...p.concepts];
                  newConcepts[conceptIndex] = {
                      ...newConcepts[conceptIndex],
                      state: { ...newConcepts[conceptIndex].state, ...partial }
                  };
                  return { ...p, status: 'EXECUTING', concepts: newConcepts };
              }
              return p;
          }));
      };

      try {
          updateConceptState({ status: PipelineStep.SCRIPTING, progress: 10, logs: ["Bắt đầu triển khai..."] });
          
          const result = await geminiService.executeConcept(
              project.input,
              project.dna as ProductDNA,
              project.concepts[conceptIndex],
              (log: string) => {
                  setProjects(prev => prev.map(p => {
                      if (p.id === targetProjectId) {
                          const newConcepts = [...p.concepts];
                          const idx = newConcepts.findIndex(c => c.id === conceptId);
                          if (idx !== -1) {
                              newConcepts[idx] = {
                                  ...newConcepts[idx],
                                  state: {
                                      ...newConcepts[idx].state,
                                      logs: [...newConcepts[idx].state.logs, log]
                                  }
                              };
                          }
                          return { ...p, concepts: newConcepts };
                      }
                      return p;
                  }));
              },
              promptConfig 
          );

           setProjects(prev => prev.map(p => {
              if (p.id === targetProjectId) {
                  const newConcepts = [...p.concepts];
                  newConcepts[conceptIndex] = {
                      ...newConcepts[conceptIndex],
                      manifest: result,
                      state: { ...newConcepts[conceptIndex].state, status: PipelineStep.COMPLETED, progress: 100 }
                  };
                  return { ...p, concepts: newConcepts };
              }
              return p;
          }));

      } catch (err: any) {
          const e = err as any;
          updateConceptState({ status: PipelineStep.ERROR, logs: [`Lỗi: ${e?.message || String(e)}`] });
          if (isBatch) throw e; 
          else addToast(`Lỗi tạo script: ${e?.message || String(e)}`, 'error');
      }
  };

  // --- FACTORY MASTER CONTROLLER ---
  const runFactorySequence = async () => {
      if (isFactoryRunning) return;
      setIsFactoryRunning(true);
      
      const queuedProjects = projects.filter(p => p.status === 'QUEUED');
      if (queuedProjects.length === 0) {
          addToast("Không có dự án nào trong hàng đợi.", 'warning');
          setIsFactoryRunning(false);
          return;
      }

      for (let i = 0; i < queuedProjects.length; i++) {
          const project = queuedProjects[i];
          setFactoryStatus(`[Project ${i+1}/${queuedProjects.length}] Starting: ${project.input.name}`);
          
          setSelectedProjectId(project.id);
          
          try {
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'BRAINSTORMING' } : p));
            setFactoryStatus(`[Project ${i+1}] Analyzing DNA & Concepts...`);
            
            const brainstormResult = await performBrainstorm(project);
            
            setFactoryStatus(`[Project ${i+1}] Brainstorm complete. Cooling down API for 30s...`);
            for (let cd = 30; cd > 0; cd--) {
                setFactoryStatus(`[Project ${i+1}] API Cooldown: ${cd}s`);
                await new Promise(r => setTimeout(r, 1000));
            }
            
            const conceptsToRun = brainstormResult.concepts;
            if (conceptsToRun.length === 0) {
                 setFactoryStatus(`[Project ${i+1}] No concepts found. Skipping.`);
                 continue;
            }

            setFactoryStatus(`[Project ${i+1}] Starting batch production of ${conceptsToRun.length} scripts...`);

            for (let cIdx = 0; cIdx < conceptsToRun.length; cIdx++) {
                const conceptData = conceptsToRun[cIdx];
                const conceptId = `${project.id}-c-${cIdx}`;
                
                try {
                   setFactoryStatus(`[Project ${i+1}] Generating script ${cIdx + 1}/${conceptsToRun.length}...`);
                   
                   const tempConceptObj: ScriptConcept = {
                       ...conceptData,
                       id: conceptId,
                       state: { status: PipelineStep.IDLE, progress: 0, logs: [] }
                   };

                   const manifest = await geminiService.executeConcept(
                       project.input,
                       brainstormResult.dna as ProductDNA,
                       tempConceptObj,
                       (_log: string) => {}, 
                       promptConfig 
                   );

                   setProjects(prev => prev.map(p => {
                       if (p.id === project.id) {
                           const newConcepts = [...p.concepts];
                           if (newConcepts[cIdx]) {
                               newConcepts[cIdx] = {
                                   ...newConcepts[cIdx],
                                   manifest: manifest,
                                   state: { status: PipelineStep.COMPLETED, progress: 100, logs: ['Completed by Factory'] }
                               };
                           }
                           return { ...p, status: 'EXECUTING', concepts: newConcepts };
                       }
                       return p;
                   }));

                } catch (err: any) {
                   const e = err as any;
                   const errorMsg = e instanceof Error ? e.message : String(e || "Unknown Error");
                   console.error(`Factory script error on ${conceptId}`, e);
                   setProjects(prev => prev.map(p => {
                       if (p.id === project.id) {
                           const newConcepts = [...p.concepts];
                           if (newConcepts[cIdx]) {
                                newConcepts[cIdx] = {
                                   ...newConcepts[cIdx],
                                   state: { status: PipelineStep.ERROR, progress: 0, logs: [`Factory Error: ${errorMsg}`] }
                               };
                           }
                           return { ...p, concepts: newConcepts };
                       }
                       return p;
                   }));
                }
                
                if (cIdx < conceptsToRun.length - 1) {
                    for (let cd = SCRIPT_DELAY_SECONDS; cd > 0; cd--) {
                        setFactoryStatus(`[Project ${i+1}] Script ${cIdx+1} Done. Next in: ${cd}s`);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }

            setFactoryStatus(`[Project ${i+1}] All scripts completed!`);
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'READY' } : p));

          } catch (e: any) {
              console.error(`Factory failed on project ${project.id}`, e);
              setFactoryStatus(`[Project ${i+1}] Critical Failure. Skipping project...`);
          }

          if (i < queuedProjects.length - 1) {
              for (let cd = CAMPAIGN_DELAY_SECONDS; cd > 0; cd--) {
                  setFactoryStatus(`Switching Campaigns... Google API Cooldown: ${cd}s`);
                  await new Promise(r => setTimeout(r, 1000));
              }
          }
      }

      setFactoryStatus("Factory Sequence Complete.");
      setIsFactoryRunning(false);
      addToast("Factory Run Complete! All queued projects processed.", 'success');
  };

  const runBatchImages = async () => {
      if (isBatchRendering || selectedConceptIds.size === 0) return;
      setIsBatchRendering(true);
      addToast("Bắt đầu render hình ảnh...", 'info');

      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const targetConceptIds = Array.from(selectedConceptIds).filter(id => {
          const c = project.concepts.find(con => con.id === id);
          return c?.state.status === PipelineStep.COMPLETED && c.manifest;
      });

      for (const cid of targetConceptIds) {
          await processImagesForConcept(cid);
          await new Promise(r => setTimeout(r, 1000));
      }

      setIsBatchRendering(false);
      addToast("Hoàn tất render hình ảnh!", 'success');
  };

  const processImagesForConcept = async (conceptId: string) => {
      let shotsToProcess: Shot[] = [];
      let currentProject: ProjectTask | undefined;
      
      setProjects(prev => {
          currentProject = prev.find(p => p.id === selectedProjectId);
          return prev;
      });

      if(!currentProject) return;
      const concept = currentProject.concepts.find(c => c.id === conceptId);
      if (!concept || !concept.manifest) return;

      shotsToProcess = concept.manifest.sequence.filter(s => !s.generatedImageUrl);
      
      for (const shot of shotsToProcess) {
           const prompt: string = shot.master_prompts?.midjourney || shot.layers?.visual_core?.action || "Cinematic shot";
           try {
                const imageUrl = await geminiService.generateVisualForShot(prompt);
                if (imageUrl) {
                    setProjects(prev => prev.map(p => {
                        if (p.id === selectedProjectId) {
                             const newConcepts = p.concepts.map(c => {
                                 if (c.id === conceptId && c.manifest) {
                                     const newSeq = c.manifest.sequence.map(s => s.id === shot.id ? { ...s, generatedImageUrl: imageUrl } : s);
                                     return { ...c, manifest: { ...c.manifest, sequence: newSeq } };
                                 }
                                 return c;
                             });
                             return { ...p, concepts: newConcepts };
                        }
                        return p;
                    }));
                }
           } catch (e: any) {
               console.error(`Failed shot ${shot.id} for concept ${concept.title}`, e);
           }
           await new Promise(r => setTimeout(r, 2000));
      }
  };

  const handleUpdateManifest = (updatedManifest: ProductionManifest) => {
      setProjects(prev => prev.map(p => {
          if (p.id === selectedProjectId) {
              const newConcepts = p.concepts.map(c => {
                  if (c.id === viewingConceptId) {
                      return { ...c, manifest: updatedManifest };
                  }
                  return c;
              });
              return { ...p, concepts: newConcepts };
          }
          return p;
      }));
      addToast("Cập nhật manifest thành công", 'success');
  };

  const handleUpdateCritique = (critique: ViralCritique) => {
      setProjects(prev => prev.map(p => {
          if (p.id === selectedProjectId) {
              const newConcepts = p.concepts.map(c => {
                  if (c.id === viewingConceptId) {
                      return { ...c, critique: critique };
                  }
                  return c;
              });
              return { ...p, concepts: newConcepts };
          }
          return p;
      }));
  }

  const deleteProject = async () => {
      if(selectedProjectId && confirm("Xóa dự án này?")) {
          await dbService.deleteProject(selectedProjectId);
          setProjects(prev => prev.filter(p => p.id !== selectedProjectId));
          setSelectedProjectId(null);
          addToast("Đã xóa dự án", 'info');
      }
  }

  // --- WAREHOUSE & EXPORT FUNCTIONS ---
  const handleBackupDatabase = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    const date = new Date().toISOString().slice(0, 10);
    downloadAnchorNode.setAttribute("download", `TVC_Factory_Backup_${date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast("Đã tải backup", 'success');
  };

  const handleExportAllCampaigns = async () => {
      const validProjects = projects.filter(p => p.status === 'READY' || p.status === 'EXECUTING' || p.concepts.some(c => c.manifest));

      if (validProjects.length === 0) {
          addToast("Chưa có dự án nào hoàn thành để xuất file.", 'warning');
          return;
      }

      if (!confirm(`Sẽ tải xuống ${validProjects.length} file JSON riêng biệt. \nLƯU Ý: Ảnh gốc sẽ được loại bỏ để giảm dung lượng file. Tiếp tục?`)) return;

      for (let i = 0; i < validProjects.length; i++) {
          const p = validProjects[i];
          const liteInput = { ...p.input, images: [] };

          const exportData = {
              project_info: liteInput,
              dna_analysis: p.dna,
              campaign_manifests: p.concepts.filter(c => c.manifest).map(c => c.manifest)
          };

          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.href = url;
          const safeName = p.input.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          downloadAnchorNode.setAttribute("download", `Campaign_${i+1}_${safeName}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          await new Promise(r => setTimeout(r, 3000)); 
      }
      addToast("Export hoàn tất", 'success');
  };

  const handleMasterExport = () => {
    if (!selectedProject) return;
    
    const exportData = {
        project_info: selectedProject.input,
        dna_analysis: selectedProject.dna,
        campaign_manifests: selectedProject.concepts.filter(c => c.manifest).map(c => c.manifest)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    const safeName = selectedProject.input.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchorNode.setAttribute("download", `${safeName}_MASTER_PACKAGE.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast("Master Export thành công", 'success');
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
      if (!selectedProject) return;
      
      let allShots: { url: string, name: string }[] = [];
      selectedProject.concepts.forEach(c => {
          if (c.manifest) {
              const safeTitle = c.manifest.concept.title.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
              c.manifest.sequence.forEach(s => {
                  if (s.generatedImageUrl) {
                      allShots.push({
                          url: s.generatedImageUrl,
                          name: `${safeTitle}_Shot${String(s.id).padStart(2,'0')}.png`
                      });
                  }
              });
          }
      });

      if (allShots.length === 0) {
          addToast("Chưa có ảnh nào được tạo", 'warning');
          return;
      }

      if(!confirm(`Chuẩn bị tải ${allShots.length} ảnh. Trình duyệt có thể hỏi quyền tải nhiều file. Tiếp tục?`)) return;

      for (const item of allShots) {
          downloadImage(item.url, item.name);
          await new Promise(r => setTimeout(r, 600)); 
      }
      addToast("Đã tải xong toàn bộ ảnh", 'success');
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const viewingConcept = selectedProject?.concepts.find(c => c.id === viewingConceptId);

  const selectionCount = selectedConceptIds.size;
  const readyToRunCount = Array.from(selectedConceptIds).filter(id => {
      const c = selectedProject?.concepts.find(con => con.id === id);
      return c?.state.status === PipelineStep.IDLE || c?.state.status === PipelineStep.ERROR;
  }).length;
  const readyToRenderCount = Array.from(selectedConceptIds).filter(id => {
       const c = selectedProject?.concepts.find(con => con.id === id);
       return c?.state.status === PipelineStep.COMPLETED;
  }).length;
  
  const queuedProjectsCount = projects.filter(p => p.status === 'QUEUED').length;

  return (
    <>
      {showWelcome && <WelcomeScreen onStart={() => setShowWelcome(false)} />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className={`flex h-screen overflow-hidden bg-[#0b1121] text-slate-100 font-sans transition-opacity duration-1000 ${showWelcome ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-slate-800 bg-[#0f172a] shadow-2xl z-10 print:hidden">
          <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0f172a]">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg">
                <Cpu size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">TVC Planner AI</h1>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check size={10} /> PRO STUDIO
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 pt-4 pb-2 space-y-3">
              {/* Mode Toggle Button */}
              <button 
                  onClick={() => setIsFactoryMode(!isFactoryMode)}
                  className={`
                    relative w-full p-1 rounded-lg flex transition-all border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                    ${isFactoryMode ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-900 border-slate-700'}
                  `}
                  aria-label={isFactoryMode ? "Switch to Single Mode" : "Switch to Factory Mode"}
              >
                  <div className={`flex-1 py-1.5 text-[10px] font-bold text-center rounded-md transition-all ${!isFactoryMode ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>SINGLE</div>
                  <div className={`flex-1 py-1.5 text-[10px] font-bold text-center rounded-md transition-all flex items-center justify-center gap-1 ${isFactoryMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}>
                      <Factory size={10} /> FACTORY
                  </div>
              </button>

              <button 
                  onClick={() => setShowPromptLibrary(true)}
                  className="w-full group flex items-center gap-3 p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all text-slate-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-indigo-400">
                      <BookOpen size={14} />
                  </div>
                  <div className="text-left flex-1">
                      <p className="text-xs font-bold">Thư viện Prompt</p>
                  </div>
              </button>

              <button 
                  onClick={() => setShowBrandModal(true)}
                  className="w-full group flex items-center gap-3 p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all text-slate-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-pink-400">
                      <Briefcase size={14} />
                  </div>
                  <div className="text-left flex-1">
                      <p className="text-xs font-bold">Brand DNA Vault</p>
                  </div>
              </button>

              <button 
                  onClick={() => setShowUserGuide(true)}
                  className="w-full group flex items-center gap-3 p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all text-slate-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-emerald-400">
                      <CircleHelp size={14} />
                  </div>
                  <div className="text-left flex-1">
                      <p className="text-xs font-bold">Hướng Dẫn Sử Dụng</p>
                  </div>
              </button>

              <button 
                  onClick={() => { setSelectedProjectId(null); setViewingConceptId(null); }}
                  className={`
                    w-full group flex items-center gap-3 p-3 rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500
                    ${selectedProjectId === null ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'}
                  `}
              >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedProjectId === null ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                      <Plus size={18} />
                  </div>
                  <div className="text-left">
                      <p className="text-sm font-bold">New Campaign</p>
                      <p className="text-[10px] opacity-70">
                          {isFactoryMode ? 'Add to Queue' : 'Start immediate'}
                      </p>
                  </div>
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" role="list" aria-label="Project List">
            {projects.map(p => (
              <ProductCard 
                key={p.id} 
                task={p} 
                isActive={selectedProjectId === p.id}
                onClick={() => { setSelectedProjectId(p.id); setViewingConceptId(null); }}
              />
            ))}
          </div>

           {isFactoryMode && (
               <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">FACTORY QUEUE</span>
                        <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">{queuedProjectsCount}</span>
                    </div>
                    {isFactoryRunning ? (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1 text-indigo-400 animate-pulse">
                                <Cpu size={14} />
                                <span className="text-xs font-bold">PROCESSING...</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-mono leading-tight">{factoryStatus}</p>
                        </div>
                    ) : (
                        <button 
                            onClick={runFactorySequence}
                            disabled={queuedProjectsCount === 0}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-orange-500/20 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            <Play size={14} fill="currentColor" /> START PRODUCTION LINE
                        </button>
                    )}
               </div>
           )}

           <div className="p-3 border-t border-slate-800 bg-black/20">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Database size={12} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Data Warehouse</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleBackupDatabase}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all text-slate-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        title="Backup Full Database (JSON)"
                    >
                        <Archive size={16} />
                        <span className="text-[9px] font-bold">Backup All</span>
                    </button>
                    <button 
                        onClick={handleExportAllCampaigns}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all text-slate-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        title="Export All Individual Campaigns"
                    >
                        <FolderDown size={16} />
                        <span className="text-[9px] font-bold">Export Seq.</span>
                    </button>
                </div>
           </div>
          
           {selectedProjectId && !isFactoryMode && (
             <div className="p-4 border-t border-slate-800">
                 <button onClick={deleteProject} className="w-full text-xs text-slate-500 hover:text-red-400 flex items-center justify-center gap-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">
                     <Trash2 size={12}/> Xóa Project
                 </button>
             </div>
           )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0b1121] to-[#0b1121] pointer-events-none print:hidden" />
          
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
              <div className="flex items-center gap-4">
                 {viewingConcept ? (
                    <button onClick={() => setViewingConceptId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg px-2 py-1">
                        <ArrowLeft size={18} /> Back to Grid
                    </button>
                 ) : (
                    <h2 className="font-semibold text-slate-200 text-lg tracking-tight flex items-center gap-2">
                        {isFactoryRunning && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                        {selectedProject ? selectedProject.input.name : "Campaign Studio"}
                    </h2>
                 )}
              </div>
              {apiKeyMissing && <div className="text-red-400 text-xs font-bold border border-red-500/20 px-3 py-1 rounded-full bg-red-500/10 animate-pulse">MISSING API KEY</div>}
          </div>

          <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar print:p-0 print:overflow-visible">
              
              {!selectedProject ? (
                  <div className="max-w-4xl mx-auto">
                      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                          {isFactoryMode && (
                              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                                  FACTORY INPUT MODE
                              </div>
                          )}
                          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                              <LayoutGrid className="text-indigo-400" /> 
                              {isFactoryMode ? "Thêm Vào Dây Chuyền Sản Xuất" : "Khởi Tạo Chiến Dịch Mới"}
                          </h3>
                          
                          <div className="space-y-6">
                              <input 
                                  type="text" 
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 outline-none text-xl font-bold focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Tên Chiến Dịch (VD: Xiaomi X20+ Launch)"
                              />
                              
                              <div className="relative">
                                  <div className="flex justify-between mb-2">
                                      <label className="text-xs font-bold text-slate-400 uppercase">Context Input (DNA + Concepts)</label>
                                      <div className="flex gap-2">
                                          <button onClick={() => setShowBrandModal(true)} className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded px-1">
                                             <Briefcase size={12} /> Load Brand
                                          </button>
                                          <button onClick={handleEnhanceDescription} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                                              {isEnhancing ? <Activity size={12} className="animate-spin"/> : <Wand2 size={12} />} Enhance
                                          </button>
                                      </div>
                                  </div>
                                  <textarea 
                                      value={newContext}
                                      onChange={(e) => setNewContext(e.target.value)}
                                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-4 text-slate-300 h-60 font-mono text-sm leading-relaxed focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder={`Paste nội dung vào đây:\n- Product Visual DNA...\n- 15 Viral Video Concepts...`}
                                  />
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Upload Hình Ảnh (Multi-select)</label>
                                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                      <label 
                                        className="aspect-square rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 hover:border-indigo-500 hover:bg-slate-900 cursor-pointer flex flex-col items-center justify-center transition-all outline-none focus-within:ring-2 focus-within:ring-indigo-500"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click() }}
                                      >
                                          <Upload className="text-slate-500 mb-2" size={20} />
                                          <span className="text-[10px] text-slate-500">Add Images</span>
                                          <input type="file" multiple onChange={handleImageUpload} className="hidden" accept="image/*" />
                                      </label>
                                      {newImages.map((src, i) => (
                                          <div key={i} className="aspect-square rounded-xl border border-slate-700 bg-slate-900 relative group overflow-hidden">
                                              <img src={src} className="w-full h-full object-cover" alt={`Upload ${i}`} />
                                              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                                                  <Trash2 size={12} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                  <select value={tone} onChange={(e) => setTone(e.target.value as ToneType)} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                      <option value="Emotional">Emotional Tone</option>
                                      <option value="Witty">Witty/GenZ Tone</option>
                                      <option value="Professional">Professional Tone</option>
                                      <option value="Urgent">Sales/Urgent Tone</option>
                                      <option value="Luxury">Luxury Tone</option>
                                      <option value="Minimalist">Minimalist Tone</option>
                                  </select>
                                  <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-1">
                                      {(['TikTok', 'Reels', 'Shorts'] as PlatformType[]).map(p => (
                                          <button key={p} onClick={() => setPlatform(p)} className={`flex-1 text-xs font-bold rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${platform === p ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{p}</button>
                                      ))}
                                  </div>
                              </div>

                              <button 
                                  onClick={handleCreateOrQueue}
                                  disabled={!newName || !newContext}
                                  className={`
                                    w-full py-4 rounded-xl font-bold text-lg shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30
                                    ${isFactoryMode 
                                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white shadow-slate-900/20' 
                                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20'
                                    }
                                  `}
                              >
                                  {isFactoryMode ? (
                                      <><Plus size={20} /> Add to Factory Queue</>
                                  ) : (
                                      <><BrainCircuit size={20} /> Phân Tích & Lên Concept</>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              ) : viewingConcept ? (
                  <div className="h-full">
                      {viewingConcept.manifest ? (
                          <ManifestView 
                            manifest={viewingConcept.manifest}
                            critique={viewingConcept.critique} 
                            onUpdate={handleUpdateManifest}
                            onUpdateCritique={handleUpdateCritique}
                            addToast={addToast}
                          />
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                             <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                             <p className="text-slate-400 animate-pulse">Đang tải dữ liệu...</p>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="pb-24"> 
                      {selectedProject.status === 'BRAINSTORMING' ? (
                          <div className="h-96 flex flex-col items-center justify-center">
                              <Layers size={64} className="text-indigo-500 animate-bounce mb-6" />
                              <h3 className="text-2xl font-bold text-white mb-2">Đang Phân Tích DNA</h3>
                              <p className="text-slate-400">Đọc context, phân tích hình ảnh và trích xuất ideas...</p>
                          </div>
                      ) : selectedProject.status === 'QUEUED' ? (
                           <div className="h-96 flex flex-col items-center justify-center opacity-70">
                              <Clock size={64} className="text-amber-500 mb-6" />
                              <h3 className="text-2xl font-bold text-white mb-2">WAITING IN QUEUE</h3>
                              <p className="text-slate-400 mb-6">Dự án này đang chờ đến lượt xử lý trong Factory Pipeline.</p>
                              {isFactoryRunning ? (
                                  <div className="flex items-center gap-2 text-indigo-400">
                                      <Loader2 size={16} className="animate-spin"/> Factory is Running...
                                  </div>
                              ) : (
                                  <button onClick={runFactorySequence} className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-full font-bold transition-colors">
                                      Start Factory Now
                                  </button>
                              )}
                          </div>
                      ) : (
                          <>
                              {selectedProject.dna && (
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                          <p className="text-[10px] text-slate-500 uppercase font-bold">Persona</p>
                                          <p className="text-sm text-slate-200">{selectedProject.dna.persona}</p>
                                      </div>
                                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 md:col-span-2">
                                          <p className="text-[10px] text-slate-500 uppercase font-bold">USP</p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                              {selectedProject.dna.usp.map((u,i) => (
                                                  <span key={i} className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">{u}</span>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                                          <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Progress</p>
                                            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full transition-all duration-500" 
                                                    style={{ width: `${(selectedProject.concepts.filter(c => c.state.status === PipelineStep.COMPLETED).length / selectedProject.concepts.length) * 100}%` }}
                                                />
                                            </div>
                                          </div>
                                          <button 
                                              onClick={toggleSelectAll}
                                              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                                          >
                                              {selectedConceptIds.size === selectedProject.concepts.length ? <CheckSquare size={14} /> : <Square size={14} />}
                                              {selectedConceptIds.size === selectedProject.concepts.length ? 'Deselect All' : 'Select All'}
                                          </button>
                                      </div>
                                  </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {selectedProject.concepts.map((concept) => {
                                      const isSelected = selectedConceptIds.has(concept.id);
                                      const isProcessing = concept.state.status === PipelineStep.SCRIPTING || concept.state.status === PipelineStep.QUEUED;
                                      const isDone = concept.state.status === PipelineStep.COMPLETED;
                                      const isError = concept.state.status === PipelineStep.ERROR;
                                      
                                      return (
                                          <button 
                                              key={concept.id} 
                                              onClick={(e) => {
                                                  // Prevent toggle when clicking inner buttons if any
                                                  if((e.target as HTMLElement).closest('[data-action="view"]')) return;
                                                  toggleSelection(concept.id);
                                              }}
                                              className={`
                                                  relative bg-slate-900/80 backdrop-blur rounded-xl border p-5 flex flex-col transition-all group cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500
                                                  ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-900/10' : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'}
                                                  ${isProcessing ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}
                                                  ${isError ? 'border-red-500/50 bg-red-500/5' : ''}
                                              `}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    toggleSelection(concept.id);
                                                }
                                              }}
                                          >
                                              <div className="absolute top-4 right-4">
                                                  {isSelected ? (
                                                      <CheckSquare className="text-indigo-500" size={20} />
                                                  ) : (
                                                      <Square className="text-slate-600 group-hover:text-slate-400" size={20} />
                                                  )}
                                              </div>

                                              <div className="flex justify-between items-start mb-3 pr-8">
                                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded">
                                                      {concept.category}
                                                  </span>
                                              </div>
                                              
                                              <h4 className="text-lg font-bold text-white mb-2 leading-tight">
                                                  {concept.title}
                                              </h4>
                                              <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">
                                                  {concept.summary}
                                              </p>
                                              
                                              <div className="mb-4 w-full">
                                                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                                                      <span>Status</span>
                                                      <span className={isDone ? "text-emerald-400" : isError ? "text-red-400" : isProcessing ? "text-blue-400" : "text-slate-500"}>
                                                          {isDone ? "Script Ready" : isError ? "Error" : isProcessing ? "Generating..." : "Idle"}
                                                      </span>
                                                  </div>
                                                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                      <div 
                                                          className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : isError ? 'bg-red-500' : isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}
                                                          style={{ width: isDone || isError ? '100%' : isProcessing ? '50%' : '0%' }}
                                                      />
                                                  </div>
                                              </div>

                                              <div className="mt-auto border-t border-slate-800/50 pt-3 flex gap-2 w-full">
                                                  {isDone ? (
                                                      <div 
                                                          data-action="view"
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setViewingConceptId(concept.id);
                                                          }}
                                                          className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                                      >
                                                          <Check size={14} /> Review Script
                                                      </div>
                                                  ) : isError ? (
                                                       <div className="w-full py-2 text-center text-xs text-red-500 italic">
                                                          Đã xảy ra lỗi
                                                      </div>
                                                  ) : (
                                                      <div className="w-full py-2 text-center text-xs text-slate-500 italic">
                                                          {isProcessing ? "Đang chờ xử lý..." : "Chọn để chạy"}
                                                      </div>
                                                  )}
                                              </div>
                                          </button>
                                      );
                                  })}
                              </div>
                              
                              <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 z-50 transition-all duration-300 ${selectionCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
                                  <div className="flex items-center gap-3 pr-4 border-r border-slate-700">
                                      <div className="bg-indigo-600 text-white text-xs font-bold rounded px-2 py-0.5">
                                          {selectionCount}
                                      </div>
                                      <span className="text-sm font-bold text-slate-300">Selected</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                      <button 
                                          onClick={runBatchScripts}
                                          disabled={isBatchRunning || readyToRunCount === 0}
                                          className={`
                                            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                            ${isBatchRunning || readyToRunCount === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}
                                          `}
                                      >
                                          {isBatchRunning ? (
                                              <>
                                                 <Loader2 size={14} className="animate-spin" /> 
                                                 {batchCountdown > 0 ? `Cooling down (${batchCountdown}s)` : 'Processing Queue...'}
                                              </>
                                          ) : (
                                              <>
                                                 <Play size={14} fill="currentColor" /> Run Scripts ({readyToRunCount})
                                              </>
                                          )}
                                      </button>

                                      <button 
                                          onClick={runBatchImages}
                                          disabled={isBatchRendering || readyToRenderCount === 0}
                                          className={`
                                            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-pink-500
                                            ${isBatchRendering || readyToRenderCount === 0 ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-pink-600/10 hover:bg-pink-600/20 text-pink-500 border-pink-500/50'}
                                          `}
                                      >
                                          {isBatchRendering ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14} />}
                                          Render Visuals ({readyToRenderCount})
                                      </button>
                                      
                                      <div className="h-4 w-px bg-slate-700 mx-2"></div>
                                      
                                      <button 
                                          onClick={handleMasterExport}
                                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                          title="Export Master JSON"
                                      >
                                          <Package size={18} />
                                      </button>

                                      <button 
                                          onClick={handleDownloadAllImages}
                                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                          title="Download All Images (Zip)"
                                      >
                                          <Download size={18} />
                                      </button>
                                  </div>
                              </div>
                          </>
                      )}
                  </div>
              )}
          </div>
        </div>
        
        <PromptLibrary 
            isOpen={showPromptLibrary}
            onClose={() => setShowPromptLibrary(false)}
            currentConfig={promptConfig}
            onSave={setPromptConfig}
        />
        
        <BrandProfileModal 
            isOpen={showBrandModal}
            onClose={() => setShowBrandModal(false)}
            onSelect={handleSelectBrandProfile}
            addToast={addToast}
        />

        <UserGuideModal 
            isOpen={showUserGuide}
            onClose={() => setShowUserGuide(false)}
        />
      </div>
    </>
  );
}
