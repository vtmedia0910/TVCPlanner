
export enum PipelineStep {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED', // New: Waiting in batch line
  DNA_ANALYSIS = 'DNA_ANALYSIS', // Step 1
  MESSAGE_SELECTION = 'MESSAGE_SELECTION', // Step 2
  VISUAL_ANCHORING = 'VISUAL_ANCHORING', // Step 3
  SCRIPTING = 'SCRIPTING', // Step 4
  STORYBOARDING = 'STORYBOARDING', // Step 5
  PROMPT_GENERATION = 'PROMPT_GENERATION', // Step 6
  MANIFEST_CREATION = 'MANIFEST_CREATION', // Step 7
  OPTIMIZATION = 'OPTIMIZATION', // Step 8
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type ToneType = 'Witty' | 'Professional' | 'Emotional' | 'Urgent' | 'Minimalist' | 'Luxury';
export type PlatformType = 'TikTok' | 'Reels' | 'Shorts' | 'TVC 16:9';

// NEW: Brand Profile for saving reusable contexts
export interface BrandProfile {
  id: string;
  name: string;
  context: string; // The DNA/Context text
  tone: ToneType;
  logoUrl?: string; // Optional logo
}

// NEW: Viral Critique Structure
export interface ViralCritique {
  score: number; // 1-100
  hookAnalysis: string;
  pacingAnalysis: string;
  visualImpact: string;
  improvementSuggestions: string[];
}

// Cấu hình Prompt động
export interface PromptConfig {
  system: string;
  brainstorm: string;
  execution: string;
  enhance: string;
}

// Cấu hình đầu vào cho Project
export interface ProjectInput {
  id: string;
  name: string;
  context: string; // Nội dung text dài (DNA + Concepts)
  images: string[]; // Lưu trữ Base64 Data URL
  config: {
    useSearch: boolean;
    useDeepThinking: boolean;
    tone: ToneType;
    platform: PlatformType;
  }
}

// Trạng thái của từng Concept con
export interface ConceptState {
  status: PipelineStep;
  progress: number;
  logs: string[];
  error?: string;
}

// Cấu trúc 1 Concept (Ý tưởng sơ bộ)
export interface ScriptConcept {
  id: string;
  title: string;
  category: string; // Satisfying, Pain Point, Creative...
  hook: string;
  summary: string;
  state: ConceptState;
  manifest?: ProductionManifest; // Kết quả chi tiết sau khi chạy xong
  critique?: ViralCritique; // NEW: AI Review result
}

// Structured Output Interfaces
export interface ProductDNA {
  usp: string[];
  persona: string;
  brandTone: string;
  targetAudience: string;
}

export interface VisualAnchor {
  character: string;
  environment: string;
  style: string;
  colorPalette: string[];
}

// --- NEW SHOT STRUCTURE (MULTI-LAYER) ---
export interface Shot {
  id: number;
  time_stamp: string; // "00:00 - 00:05"
  duration_sec: number;
  scene_type: string; // "ASMR PEAK", "POV SHOT", "MACRO"...
  
  layers: {
    visual_core: {
      subject: string;
      action: string;
      lighting: string;
      camera_movement: string;
    };
    audio_engineering: {
      voice_script: string;
      voice_persona: string;
      sfx_ambience: string; // NEW: Sound Effects
    };
    tiktok_native: {
      text_overlay: string; // NEW: Text on screen
      text_position: string;
    };
  };

  master_prompts: {
    midjourney: string;
    veo: string;
  };
  
  generatedImageUrl?: string;
}

export interface SEOData {
  title: string;
  caption: string;
  hashtags: string[];
  viralScore: number; // 1-100
  musicSuggestion: string;
}

export interface ProductionManifest {
  projectId: string;
  conceptId: string; // Link với concept nào
  productName: string;
  dna: ProductDNA;
  concept: {
    title: string;
    category: string;
    hook: string;
  };
  visualAnchors: VisualAnchor;
  script: {
    hook: string;
    body: string;
    cta: string;
  };
  sequence: Shot[];
  seo: SEOData;
  totalDuration: number;
  estimatedCost: number;
  generatedVideoUrl?: string;
}

// Cấu trúc Project tổng thể
export interface ProjectTask {
  id: string;
  input: ProjectInput;
  createdAt: number;
  
  // Giai đoạn 1: Brainstorming/Extraction kết quả
  dna?: ProductDNA;
  concepts: ScriptConcept[]; 
  
  // Trạng thái tổng quan của Project
  // QUEUED: Added to factory line, waiting for master run
  status: 'DRAFT' | 'QUEUED' | 'BRAINSTORMING' | 'READY' | 'EXECUTING'; 
}