/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * lib/gemini.ts
 * Enterprise Dashboard Generator Logic
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ComplexityLevel, VisualStyle, AnalysisResult, BrandKit } from "../types";

const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

// --- Utility: Base64 Handling for Browser ---
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

// --- Utility: Retry Logic with Exponential Backoff ---
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      console.warn(`API call failed (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries reached");
}

const getLevelInstruction = (level: ComplexityLevel): string => {
  switch (level) {
    case 'Executive Summary':
      return "Target Audience: C-Suite. Focus on High-level KPIs, simple trend lines, and big numbers. Minimal clutter.";
    case 'Operational':
      return "Target Audience: Managers. Focus on real-time status, red/green indicators, and table rows for recent activity.";
    case 'Analytical':
      return "Target Audience: Data Analysts. Dense data, scatter plots, complex histograms, and filtering controls.";
    case 'Strategic':
      return "Target Audience: Planners. Long-term trend forecasting, year-over-year comparisons, and goal tracking.";
    default:
      return "Target Audience: General Business.";
  }
};

const getStyleInstruction = (style: VisualStyle): string => {
   const map: Record<VisualStyle, string> = {
       'Modern SaaS': "Aesthetic: Clean white UI, soft shadows, rounded corners, blue/purple accents (Salesforce/Stripe style).",
       'Dark Mode Analytics': "Aesthetic: Dark charcoal background, neon chart lines, high contrast for low-light environments.",
       'Financial Traditional': "Aesthetic: Conservative, serif fonts, muted colors, grid lines, dense tables (Bloomberg Terminal style).",
       'Minimalist': "Aesthetic: Maximum whitespace, thin lines, grayscale with one alert color.",
       'Futuristic HUD': "Aesthetic: Sci-fi interface, glowing elements, floating panels.",
       'Paper Wireframe': "Aesthetic: Low-fidelity sketch, hand-drawn lines, black and white.",
       'Neumorphism': "Aesthetic: Soft UI, extruded plastic look, low contrast shadows, pale background.",
       'Isometric 3D': "Aesthetic: 3D charts, angled perspective, vibrant gradients, floating elements.",
       'High Contrast': "Aesthetic: Maximum accessibility, black and white dominant, very thick lines, large text.",
       'Swiss Design': "Aesthetic: International typographic style, heavy use of grid, sans-serif fonts, asymmetrical layout.",
       'Vintage Terminal': "Aesthetic: Green/Amber text on black CRT screen, monospaced fonts, scanlines.",
       'Cyberpunk Neon': "Aesthetic: High-tech, pink/cyan gradients, glitch effects, dark background, futuristic typography.",
       'Hand-Drawn Sketch': "Aesthetic: Rough pencil lines, marker-style coloring, informal font, whiteboard feel.",
       'Corporate Clean': "Aesthetic: Professional blue/grey palette, standard enterprise layout, very structured, dense information.",
       'Data Journalism': "Aesthetic: Editorial style, large serif headings, beige/cream background, sophisticated chart types (Sankey, Chord).",
       'Glassmorphism': "Aesthetic: Translucent frosted glass panels, vivid blurred background blobs, white text, airy layout."
   };
   return map[style] || map['Modern SaaS'];
};

const getBrandInstruction = (brand?: BrandKit): string => {
  if (!brand) return "";
  return `
BRANDING CONSTRAINTS:
- Primary Color: ${brand.primaryColor} (Use this for primary buttons, active states, and main chart series).
- Secondary Color: ${brand.secondaryColor}.
- Accent Color: ${brand.accentColor} (Use for highlights or small details).
- Background Color: ${brand.backgroundColor}.
- Global Font: ${brand.fontFamily}.
- Heading Font: ${brand.headingFont}.
${brand.logo ? "- MANDATORY: Include the company logo (which is a circular/modern icon) in the top left header." : ""}
- Ensure all charts, tables, and UI components adhere strictly to this brand palette.
`;
};

export async function analyzeDashboardRequirements(
  objective: string, 
  dataContext: string,
  level: ComplexityLevel, 
  style: VisualStyle,
  brand?: BrandKit
): Promise<AnalysisResult> {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style);
  const brandInstr = getBrandInstruction(brand);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withRetry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `User Objective: "${objective}"\nData Context: ${dataContext}`,
    config: {
      systemInstruction: `You are a Senior Product Designer and Data Scientist. Your goal is to design a Dashboard UI based on the user's data sources and objective. Design constraints: ${levelInstr} ${styleInstr} ${brandInstr}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dashboardStrategy: {
            type: Type.STRING,
            description: "One sentence explaining the layout strategy"
          },
          kpis: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-5 key metrics to display at the top"
          },
          suggestedCharts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 main visualizations to include"
          }
        },
        required: ["dashboardStrategy", "kpis", "suggestedCharts"]
      }
    }
  }));

  const text = response.text;
  if (!text) throw new Error("Failed to analyze requirements");
  return JSON.parse(text);
}

/**
 * Generates an SVG dashboard mockup using the Text Model for vector precision.
 * Falls back to Raster Image model if SVG generation fails.
 */
export async function generateDashboardImage(prompt: string, style: VisualStyle, brand?: BrandKit, aspectRatio: string = "16:9", colorPalette: string = "Brand Default"): Promise<string> {
  const aesthetic = getStyleInstruction(style);
  const brandInstr = getBrandInstruction(brand);
  const paletteInstr = colorPalette !== "Brand Default" ? `\nCOLOR PALETTE: Use a ${colorPalette} color palette.` : "";
  
  // 1. Attempt to generate SVG Code
  // Enhanced prompt for interactivity and grounding
  const svgPrompt = `
    You are an expert Frontend Engineer and UI/UX Designer.
    Generate a comprehensive, high-fidelity Single Page Application (SPA) dashboard mockup using scalable vector graphics (SVG).
    
    Context:
    ${aesthetic}
    ${brandInstr}
    ${paletteInstr}
    Content Requirements: ${prompt}
    
    CRITICAL TECHNICAL CONSTRAINTS:
    1. Output MUST be valid, standalone SVG code.
    2. ViewBox: "0 0 1440 900" (Desktop resolution).
    3. INTERACTIVITY:
       - Use CSS within <style> tags inside the SVG.
       - Add ':hover' effects to buttons, sidebar links, and table rows (e.g., change opacity or fill).
       - Add 'cursor: pointer' to all interactive elements.
       - Create a "fake" navigation sidebar with at least 5 links (Dashboard, Analytics, Users, Settings, Reports) to mimic a real app.
    4. DATA GROUNDING (CRITICAL):
       - If "REAL DATA TO VISUALIZE" is provided in the prompt, you MUST use the exact numbers/labels from it.
       - Do not use "Lorem Ipsum". Use realistic business terminology matching the context.
    5. No markdown formatting. Return raw SVG code.
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await withRetry(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: svgPrompt,
    }));

    const text = response.text;
    if (text) {
        // Extract SVG if wrapped in markdown
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
            const svgCode = svgMatch[0];
            const base64Svg = encodeBase64(svgCode);
            return `data:image/svg+xml;base64,${base64Svg}`;
        }
    }
  } catch (e) {
    console.warn("SVG Generation failed, falling back to raster.", e);
  }

  // 2. Fallback to Raster Image Generation
  return generateRasterDashboard(prompt, style, brand, aspectRatio, colorPalette);
}

// Fallback function for Raster generation
async function generateRasterDashboard(prompt: string, style: VisualStyle, brand?: BrandKit, aspectRatio: string = "16:9", colorPalette: string = "Brand Default"): Promise<string> {
    const aesthetic = getStyleInstruction(style);
    const brandInstr = getBrandInstruction(brand);
    const paletteInstr = colorPalette !== "Brand Default" ? ` Use a ${colorPalette} color palette.` : "";
    const fullPrompt = `Generate a high-fidelity UI mockup of a business dashboard. ${aesthetic} ${brandInstr}${paletteInstr} Content requirements: ${prompt} Ensure all text is legible (pseudo-text is okay for body). Show a sidebar navigation and a top header with user profile. Make it look like a real React/Web application.`;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await withRetry(() => ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: fullPrompt,
        config: { 
            imageConfig: {
                aspectRatio: aspectRatio as any,
                imageSize: "1K"
            }
        }
    }));

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("Dashboard generation failed");
}

export async function editDashboardImage(imageBase64: string, instruction: string, brand?: BrandKit): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Handle SVG Editing
  if (imageBase64.startsWith('data:image/svg+xml')) {
      try {
          const base64Code = imageBase64.split(',')[1];
          const svgCode = decodeBase64(base64Code);
          const brandInstr = getBrandInstruction(brand);

          const fullPrompt = `
            You are an expert SVG coder.
            I will provide an existing SVG dashboard code. 
            Update the SVG code based on the user's instruction: "${instruction}".
            
            Constraints:
            - Maintain the original structure and style unless asked to change.
            - Keep the interactivity (CSS hover states).
            - Respect brand colors: ${brandInstr}
            - Output ONLY the updated SVG code. No markdown.
            
            Original SVG:
            ${svgCode}
          `;

          const response = await withRetry(() => ai.models.generateContent({
              model: TEXT_MODEL,
              contents: fullPrompt,
          }));

          const text = response.text;
          if (text) {
              const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
              if (svgMatch) {
                  const newSvgCode = svgMatch[0];
                  const newBase64 = encodeBase64(newSvgCode);
                  return `data:image/svg+xml;base64,${newBase64}`;
              }
          }
      } catch (e) {
          console.warn("SVG Edit failed", e);
          throw new Error("Failed to edit SVG dashboard.");
      }
  }

  // 2. Handle Raster Editing (Legacy / Fallback)
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const brandInstr = getBrandInstruction(brand);
  
  const response = await withRetry(() => ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
         { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
         { text: `Edit this UI mockup: ${instruction}. Keep the same visual style and respect these brand rules: ${brandInstr}` }
      ]
    },
    config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        }
    }
  }));
  
  if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
  }
  throw new Error("Edit failed");
}

export async function researchTopic(topic: string, audience: string): Promise<{ summary: string, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Research the following topic: "${topic}". Provide a comprehensive summary tailored for this audience: "${audience}". Include key statistics, trends, and actionable insights.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  }));

  const text = response.text || "No summary available.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { summary: text, sources: chunks };
}