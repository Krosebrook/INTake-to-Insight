
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DEPRECATED
 * This service has been moved to src/lib/gemini.ts as part of the Phase 2 Architecture Refactor.
 * Please import from '../lib/gemini' instead.
 */

import { generateDashboardImage, editDashboardImage } from '../lib/gemini';

// Stubs for deprecated functions to maintain compatibility with legacy code
const researchTopic = async (topic: string) => {
  return { topic, facts: [] };
};

const generateImage = async (prompt: string) => {
    // Basic mapping: new API requires a style
    const data = await generateDashboardImage(prompt, 'Modern SaaS'); 
    return {
        id: Date.now().toString(),
        data,
        prompt,
        level: 'Operational',
        style: 'Modern SaaS'
    };
};

const editImage = async (image: any, prompt: string) => {
    const data = await editDashboardImage(image.data || image, prompt);
    return { ...image, data };
};

export const researchTopicForPrompt = researchTopic;
export const generateInfographicImage = generateImage;
export const editInfographicImage = editImage;
export const verifyInfographicAccuracy = async () => ({ isAccurate: true, critique: "" });
export const fixInfographicImage = editImage;
