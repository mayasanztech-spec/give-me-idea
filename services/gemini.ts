
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using gemini-3-pro-preview for complex coding tasks.
const GEMINI_MODEL = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert AI Engineer and Product Designer specializing in "bringing artifacts to life".
Your goal is to take a user uploaded file (or a textual description) and instantly generate a fully functional, interactive, single-page HTML/JS/CSS application.

CORE DIRECTIVES FOR AESTHETICS & SMOOTHNESS:
1. **Perfect Centering**: 
    - By default, ensure the application content is centered. Use a wrapper like <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4">.
    - If it's a dashboard, use a centered container: <div class="max-w-5xl mx-auto w-full">.
2. **Smooth Transitions**:
    - **CRITICAL**: Apply 'transition-all duration-300 ease-in-out' to all interactive elements (buttons, cards, links).
    - Use hover effects like 'hover:scale-105' or 'hover:shadow-xl' to make it feel "alive".
3. **Modern UI Polish**:
    - Use 'rounded-2xl' or 'rounded-3xl' for corners.
    - Use subtle borders (border border-white/10) and glassmorphism (backdrop-blur-md bg-white/5).
    - Use high-quality typography (Inter or system-ui).
4. **NO EXTERNAL IMAGES**:
    - **CRITICAL**: Do NOT use <img src="..."> with external URLs.
    - **INSTEAD**: Use Lucide icons (via CDN), inline SVGs, Emojis, or CSS gradients.

FUNCTIONAL DIRECTIVES:
1. **Analyze & Abstract**: Detect buttons, inputs, and layout from images and turn them into functional components.
2. **Interactive**: Use Lucide icons for visual flair. The app must have state management (simple JS) for interactivity.
3. **Self-Contained**: Single HTML file with Tailwind via CDN.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown code blocks. Start immediately with <!DOCTYPE html>.`;

export interface GenerationResult {
  html: string;
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string): Promise<GenerationResult> {
  const parts: any[] = [];
  
  // Construct the final instruction for the model
  let finalPrompt = "";
  if (fileBase64) {
    finalPrompt = prompt 
      ? `Analyze this artifact and build a functional web application based on it. USER INSTRUCTIONS: ${prompt}. Ensure the UI is centered, perfectly aligned, and has smooth CSS transitions.`
      : "Analyze this image/document. Build a fully interactive web app that is centered, smooth, and modern. IMPORTANT: Do NOT use external image URLs.";
  } else {
    finalPrompt = prompt || "Create a creative and interactive demo application that is perfectly centered and smooth.";
  }

  parts.push({ text: finalPrompt });

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    let text = response.text || "<!-- Failed to generate content -->";

    // Cleanup if the model still included markdown fences despite instructions
    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return {
      html: text,
      usage: response.usageMetadata
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}
