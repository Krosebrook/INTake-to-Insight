/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Domain Entities ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  avatar?: string;
  persona?: string; // e.g., "Critical Thinker", "Strategic Exec", "Operational Manager"
}

export interface TeamMember extends User {
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  joinedAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  ownerId: string;
  brandKit?: BrandKit;
}

export type DataSourceType = 'FILE_UPLOAD' | 'API_REST' | 'GOOGLE_DRIVE' | 'DROPBOX' | 'ONEDRIVE';

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  status: 'CONNECTED' | 'ERROR' | 'PENDING';
  meta?: {
    rowCount?: number;
    fileSize?: string;
    lastSync?: number;
  };
}

export interface GeneratedImage {
  id: string;
  data: string; // Base64 string
  prompt: string;
  timestamp: number;
  level: ComplexityLevel;
  style: VisualStyle;
}

export interface BrandKit {
  logo?: string; // Base64
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  headingFont: string;
}

export interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  
  // Dashboard Config
  dataSources: DataSource[];
  prompt: string;
  level: ComplexityLevel;
  style: VisualStyle;
  
  // Canvas Data
  canvasState: {
    baseImage?: string;
    annotations: Annotation[];
    comments: Comment[];
  };

  // Versioning
  history: GeneratedImage[];
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'GENERATE' | 'EDIT' | 'EXPORT' | 'DELETE' | 'LOGIN' | 'INVITE';
  resourceId?: string;
  resourceType?: string;
  timestamp: number;
  details: string;
}

export interface UsageStats {
  tokensUsed: number;
  imagesGenerated: number;
  storageUsed: string;
  periodStart: number;
  periodEnd: number;
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
}

export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  resolved: boolean;
  timestamp: number;
}

// --- Enums & Options ---

export type ComplexityLevel = 'Executive Summary' | 'Operational' | 'Analytical' | 'Strategic';

export type VisualStyle = 
  | 'Modern SaaS' 
  | 'Dark Mode Analytics' 
  | 'Financial Traditional' 
  | 'Minimalist' 
  | 'Futuristic HUD' 
  | 'Paper Wireframe'
  | 'Neumorphism'
  | 'Isometric 3D'
  | 'High Contrast'
  | 'Swiss Design'
  | 'Vintage Terminal'
  | 'Cyberpunk Neon'
  | 'Hand-Drawn Sketch'
  | 'Corporate Clean'
  | 'Data Journalism'
  | 'Glassmorphism';

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface AnalysisResult {
  dashboardStrategy: string;
  kpis: string[];
  suggestedCharts: string[];
}