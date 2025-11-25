
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION, BRAINSTORM_PROMPT, EXECUTION_PROMPT, ENHANCE_INSTRUCTION } from "../constants";
import { ProductionManifest, ProjectInput, ProductDNA, ScriptConcept, PromptConfig, ViralCritique } from "../types";

// Helper for Audio Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to parse Data URL
const parseBase64Data = (dataUrl: string) => {
    try {
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error("Invalid Base64 Data URL");
        }
        return { mimeType: matches[1], data: matches[2] };
    } catch (e) {
        console.error("Error parsing base64 image", e);
        return { mimeType: 'image/jpeg', data: '' };
    }
};

// Helper to clean JSON string from Markdown fences
const cleanJsonString = (text: string): string => {
    if (!text) return "{}";
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned;
};

// --- DEFINING STRICT SCHEMAS FOR GEMINI 2.5 FLASH ---
const EXECUTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        visualAnchors: {
            type: Type.OBJECT,
            properties: {
                character: { type: Type.STRING },
                environment: { type: Type.STRING },
                style: { type: Type.STRING },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['style', 'environment', 'colorPalette']
        },
        script: {
            type: Type.OBJECT,
            properties: {
                hook: { type: Type.STRING },
                body: { type: Type.STRING },
                cta: { type: Type.STRING }
            },
            required: ['hook', 'body', 'cta']
        },
        sequence: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    time_stamp: { type: Type.STRING },
                    duration_sec: { type: Type.NUMBER },
                    scene_type: { type: Type.STRING },
                    layers: {
                        type: Type.OBJECT,
                        properties: {
                            visual_core: {
                                type: Type.OBJECT,
                                properties: {
                                    subject: { type: Type.STRING },
                                    action: { type: Type.STRING },
                                    lighting: { type: Type.STRING },
                                    camera_movement: { type: Type.STRING }
                                },
                                required: ['subject', 'action']
                            },
                            audio_engineering: {
                                type: Type.OBJECT,
                                properties: {
                                    voice_script: { type: Type.STRING },
                                    voice_persona: { type: Type.STRING },
                                    sfx_ambience: { type: Type.STRING }
                                },
                                required: ['voice_script']
                            },
                            tiktok_native: {
                                type: Type.OBJECT,
                                properties: {
                                    text_overlay: { type: Type.STRING },
                                    text_position: { type: Type.STRING }
                                }
                            }
                        },
                        required: ['visual_core', 'audio_engineering']
                    },
                    master_prompts: {
                        type: Type.OBJECT,
                        properties: {
                            midjourney: { type: Type.STRING },
                            veo: { type: Type.STRING }
                        }
                    }
                },
                required: ['id', 'time_stamp', 'layers']
            }
        },
        seo: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                caption: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                viralScore: { type: Type.INTEGER },
                musicSuggestion: { type: Type.STRING }
            }
        },
        totalDuration: { type: Type.NUMBER },
        estimatedCost: { type: Type.NUMBER }
    },
    required: ['visualAnchors', 'script', 'sequence', 'seo']
};

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
    }
    this.client = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async enhanceDescription(currentText: string, customPrompt?: string): Promise<string> {
    if (!currentText.trim()) return "";
    const sysInstruction = customPrompt || ENHANCE_INSTRUCTION;

    try {
        const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Hãy viết lại mô tả sản phẩm sau cho thật chuyên nghiệp và hấp dẫn, làm nổi bật USP: "${currentText}"`,
        config: {
            systemInstruction: sysInstruction,
        }
        });
        return response.text || currentText;
    } catch (e) {
        console.error("Enhance Error", e);
        return currentText;
    }
  }

  // --- PREMIUM FEATURE: PROMPT REFINER ---
  async refinePrompt(rawPrompt: string, style: string = 'Cinematic'): Promise<string> {
      try {
          const response = await this.client.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Upgrade this image prompt to be detailed, high-quality, and suited for Midjourney v6. Style: ${style}. \n\nRaw Prompt: "${rawPrompt}"\n\nOutput ONLY the prompt text, no explanations.`,
          });
          return response.text?.trim() || rawPrompt;
      } catch (e) {
          console.error("Prompt Refine Error", e);
          return rawPrompt;
      }
  }

  // --- PREMIUM FEATURE: VIRAL CRITIQUE AGENT ---
  async analyzeViralPotential(manifest: ProductionManifest): Promise<ViralCritique> {
      try {
          const content = JSON.stringify({
              title: manifest.concept.title,
              hook: manifest.script.hook,
              sequence: manifest.sequence.map(s => ({
                  time: s.time_stamp,
                  visual: s.layers.visual_core.action,
                  audio: s.layers.audio_engineering.voice_script
              }))
          });

          const response = await this.client.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Act as a Viral Marketing Expert. Critique this Short Video Script.
              Input: ${content}
              
              Analyze strictly on:
              1. Hook strength (first 3s)
              2. Pacing (Is it boring?)
              3. Visual Impact
              
              Return JSON:
              {
                "score": number (1-100),
                "hookAnalysis": "string",
                "pacingAnalysis": "string",
                "visualImpact": "string",
                "improvementSuggestions": ["string", "string", "string"]
              }`,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          score: { type: Type.INTEGER },
                          hookAnalysis: { type: Type.STRING },
                          pacingAnalysis: { type: Type.STRING },
                          visualImpact: { type: Type.STRING },
                          improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }}
                      }
                  }
              }
          });
          
          const json = JSON.parse(cleanJsonString(response.text || "{}"));
          return json as ViralCritique;

      } catch (e) {
          console.error("Viral Analysis Error", e);
          throw new Error("Could not analyze viral potential.");
      }
  }

  // --- STAGE 1: BRAINSTORM & EXTRACTION ---
  async analyzeProject(
    productName: string,
    context: string,
    images: string[],
    onProgress: (log: string) => void,
    promptConfig?: PromptConfig
  ): Promise<{ dna: ProductDNA, concepts: Omit<ScriptConcept, 'id' | 'state'>[] }> {
    
    onProgress("Đang xử lý hình ảnh và phân tích ngữ cảnh...");

    const imageParts = images.map((dataUrl) => {
        const { mimeType, data } = parseBase64Data(dataUrl);
        return {
            inlineData: { mimeType, data }
        };
    });

    const textPart = {
        text: `SẢN PHẨM: ${productName}\n\nCONTEXT & CONCEPT DATA:\n${context}`
    };

    const mainPrompt = promptConfig?.brainstorm || BRAINSTORM_PROMPT;
    const sysInstruction = promptConfig?.system || SYSTEM_INSTRUCTION;

    const contents = [
        { text: mainPrompt },
        textPart,
        ...imageParts
    ];

    onProgress("Đang trích xuất DNA và danh sách Concepts (Strict JSON Schema)...");

    let retries = 0;
    while (retries < 3) {
        try {
            const response = await this.client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: contents },
                config: {
                    systemInstruction: sysInstruction,
                    responseMimeType: "application/json",
                    temperature: 0.5,
                    maxOutputTokens: 8192,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            dna: {
                                type: Type.OBJECT,
                                properties: {
                                    usp: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    persona: { type: Type.STRING },
                                    brandTone: { type: Type.STRING },
                                    targetAudience: { type: Type.STRING }
                                },
                                required: ["usp", "persona", "brandTone", "targetAudience"]
                            },
                            concepts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        category: { type: Type.STRING },
                                        hook: { type: Type.STRING },
                                        summary: { type: Type.STRING }
                                    },
                                    required: ["title", "category", "hook", "summary"]
                                }
                            }
                        },
                        required: ["dna", "concepts"]
                    }
                }
            });

            const rawText = response.text;
            if (!rawText) throw new Error("Empty response from AI");

            const cleanedText = cleanJsonString(rawText);
            const data = JSON.parse(cleanedText);
            
            const safeDNA: ProductDNA = {
                usp: data.dna?.usp || ["Chưa xác định"],
                persona: data.dna?.persona || "Chung chung",
                brandTone: data.dna?.brandTone || "Professional",
                targetAudience: data.dna?.targetAudience || "Mọi người"
            };

            const safeConcepts = (data.concepts || []).map((c: any) => ({
                title: c.title || "Untitled Concept",
                category: c.category || "General",
                hook: c.hook || "No hook provided",
                summary: c.summary || "No summary provided"
            }));

            onProgress(`Hoàn tất! Đã tìm thấy ${safeConcepts.length} ý tưởng.`);
            return { dna: safeDNA, concepts: safeConcepts };

        } catch (e: any) {
             console.warn(`Attempt ${retries + 1} failed:`, e);
             if (e.message?.includes("429") || e.status === 429) {
                 retries++;
                 const waitTime = retries * 5; 
                 onProgress(`⚠️ Rate Limit (429). Đang chờ ${waitTime}s...`);
                 await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                 continue; 
             }
             
             if(retries < 2) {
                 retries++;
                 onProgress(`Gặp lỗi xử lý, đang thử lại (${retries}/3)...`);
                 await new Promise(resolve => setTimeout(resolve, 2000));
                 continue;
             }
             throw new Error(`Lỗi phân tích từ AI: ${e.message}`);
        }
    }
    throw new Error("Hệ thống quá tải hoặc không phản hồi sau nhiều lần thử.");
  }

  // --- STAGE 2: EXECUTION (UPGRADED TO SCHEMA) ---
  async executeConcept(
    projectInput: ProjectInput,
    dna: ProductDNA,
    concept: ScriptConcept,
    onProgress: (log: string) => void,
    promptConfig?: PromptConfig
  ): Promise<ProductionManifest> {

    onProgress(`Đang triển khai kịch bản: ${concept.title}...`);

    let imagePart = null;
    if (projectInput.images && projectInput.images.length > 0) {
        const { mimeType, data } = parseBase64Data(projectInput.images[0]);
        imagePart = { inlineData: { mimeType, data } };
    }

    const rawPrompt = promptConfig?.execution || EXECUTION_PROMPT;
    const sysInstruction = promptConfig?.system || SYSTEM_INSTRUCTION;

    const prompt = rawPrompt
        .replace("{{CONCEPT_TITLE}}", concept.title)
        .replace("{{CONCEPT_HOOK}}", concept.hook)
        .replace("{{CONCEPT_SUMMARY}}", concept.summary)
        .replace("{{PRODUCT_DNA}}", JSON.stringify(dna))
        .replace("{{TONE}}", projectInput.config.tone)
        .replace("{{PLATFORM}}", projectInput.config.platform);

    const contents: any[] = [{ text: prompt }];
    if (imagePart) contents.push(imagePart);

    const config: any = {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: EXECUTION_SCHEMA
    };

    if (projectInput.config.useDeepThinking) {
        config.thinkingConfig = { thinkingBudget: 2048 };
    }

    let attempts = 0;
    let lastError = null;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
        try {
            attempts++;
            if (attempts > 1) onProgress(`Thử lại lần ${attempts}...`);

            const response = await this.client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: contents },
                config: config
            });

            const rawText = response.text;
            if (!rawText) throw new Error("Empty response from AI");
            
            let resultData;
            try {
                const cleanedText = cleanJsonString(rawText);
                resultData = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error("JSON Parse Error despite Schema:", parseError);
                throw new Error("Invalid JSON structure received");
            }
            
            if (!resultData.sequence) resultData.sequence = [];
            if (!resultData.script) resultData.script = { hook: "", body: "", cta: "" };

            onProgress("Hoàn tất triển khai Concept.");

            return {
                projectId: projectInput.id,
                conceptId: concept.id,
                productName: projectInput.name,
                dna: dna,
                concept: {
                    title: concept.title,
                    category: concept.category,
                    hook: concept.hook
                },
                ...resultData,
                totalDuration: resultData.totalDuration || 0,
                estimatedCost: resultData.estimatedCost || 0
            };

        } catch (e: any) {
             console.error(`Attempt ${attempts} failed:`, e.message);
             lastError = e;
             
             if (e.message?.includes("429") || e.status === 429) {
                 onProgress("⛔ PHÁT HIỆN QUÁ TẢI (429). HỆ THỐNG TẠM DỪNG 60S ĐỂ HỒI PHỤC...");
                 await new Promise(resolve => setTimeout(resolve, 60000));
                 attempts--; 
                 continue;
             }
        }
    }

    throw new Error(`Lỗi sau ${MAX_ATTEMPTS} lần thử: ${lastError?.message}`);
  }

  // --- FEATURES ---

  async generateSpeech(text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> {
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }, 
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return null;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await audioContext.decodeAudioData(decode(base64Audio).buffer);
      return audioBuffer;

    } catch (error) {
      console.error("TTS Error:", error);
      return null;
    }
  }

  async generateVisualForShot(prompt: string): Promise<string | null> {
    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Gen Error:", error);
      return null;
    }
  }

  async generateVeoVideo(prompt: string): Promise<string | null> {
    try {
      if(window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
          this.client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' }); 
      }

      let operation = await this.client.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await this.client.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;
      
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);

    } catch (error) {
      console.error("Veo Gen Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
