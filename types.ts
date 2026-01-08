export enum Sender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text?: string;
  images?: string[]; // Base64 strings
  timestamp: number;
}

// --- Card Content Types for Mode 2 ---
export interface LinkCardData {
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ToolData {
  name: 'Recording' | 'Memo' | 'Camera' | 'Calculator';
}

export type MultiCardItem = 
  | { type: 'link'; data: LinkCardData }
  | { type: 'text'; data: string }
  | { type: 'table'; data: TableData }
  | { type: 'tool'; data: ToolData };


// --- Main AI Response Structure ---
export interface StructuredResponse {
  title: string; 
  insight: string; 
  
  // Mode 1 (Step 1)
  isConfirmation?: boolean;

  // Mode 4 / 1 (Step 2)
  recommendations?: string[];
  
  // Mode 3
  linkCard?: LinkCardData;

  // Mode 2
  multiCardContent?: MultiCardItem[];
}

export interface UserContext {
  mode: number; // 1: Focus, 2: Fluent, 3: Rescue, 4: Explore
  task: string;
  preferences: string;
  status: string;
}

export interface Coordinates {
  x: number;
  y: number;
}

export enum AppState {
  SETUP = 'SETUP',
  IDLE = 'IDLE',
  HOVERING = 'HOVERING', 
  MONITORING = 'MONITORING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  FOCUSED = 'FOCUSED', // Special state for Mode 1 active
}