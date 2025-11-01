export enum Tab {
  Optimizer = 'Optimizer',
  AtsChecker = 'ATS Checker',
  SkillGap = 'Skill Gap',
  JobAlerts = 'Job Alerts',
  Templates = 'Templates',
}

export interface AtsResult {
  score: number;
  summary: string;
  keyword_match: {
    present: string[];
    missing: string[];
  };
  suggestions: string[];
}

export interface Job {
  company: string;
  title: string;
  location: string;
  summary: string;
  url: string;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface ResumeVersion {
  id: string;
  content: string;
  notes: string;
  createdAt: string;
}

export interface SkillGapResult {
  summary: string;
  keywordAnalysis: {
    keyword: string;
    status: 'Included' | 'Missing' | 'Partial';
  }[];
  actionableSuggestions: {
    title: string;
    description: string;
    priority: 'CRITICAL' | 'RECOMMENDED';
  }[];
}

export interface ResumeTemplate {
  name: string;
  description: string;
  content: string;
}

export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}