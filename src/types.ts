export interface Tool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  category: 'Writing' | 'Video' | 'Image' | 'Automation' | 'Coding' | 'Marketing' | 'Business' | 'Productivity' | 'Audio' | 'Research' | '3D' | 'Design' | 'Social Media';
  pricing: 'Free' | 'Paid' | 'Freemium';
  trending?: boolean;
  hidden?: boolean;
  upcoming?: boolean;
  rating: number;
  reviewsCount: number;
  websiteUrl: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  alternatives: string[];
  videoPreviewUrl?: string;
  trendingScore?: number;
  growthIndicator?: 'rising' | 'stable' | 'declining';
  earlySignal?: boolean;
  launchStage?: 'beta' | 'waitlist' | 'live';
  futureImpact?: string;
  verified?: boolean;
  qualityScore?: number;
  isToolOfTheDay?: boolean;
  createdAt: any;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: any;
  workflowSteps: string[];
}

export interface ToolStack {
  id: string;
  goalId: string;
  title: string;
  tools: string[]; // Tool IDs
  workflow: { step: string; toolId: string; description: string }[];
}

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  tags: string[];
  author: string;
  publishedAt: any;
  insight?: string; // "🧠 What This Means"
  type?: 'AI' | 'Startup' | 'Funding' | 'Launch';
  timeAgo?: string;
}

export interface TrendingTrend {
  id: string;
  name: string;
  reason: string;
  indicator: 'Rising' | 'Exploding';
  score: number;
}

export interface Prediction {
  id: string;
  name: string;
  stage: 'Beta' | 'Waitlist' | 'New Launch';
  prediction: string;
  imageUrl: string;
  whyViral: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  avatarUrl?: string;
  bookmarks: string[];
  role: 'user' | 'admin';
  isCreator?: boolean;
  plan: 'Starter' | 'Featured' | 'Premium';
  credits: number;
  collections?: {
    id: string;
    title: string;
    description: string;
    toolIds: string[];
    createdAt: string;
  }[];
  createdAt: any;
}

export interface WorkflowStep {
  step: string;
  description: string;
  tools: { name: string; reason: string }[];
}

export interface AIWorkflow {
  goal: string;
  workflow: WorkflowStep[];
  executionPlan: {
    timeline: string;
    phases: { name: string; tasks: string[] }[];
  };
  successMetrics: string[];
}

export interface Workflow {
  id: string;
  goal: string;
  steps: WorkflowStep[];
  userId: string;
  createdAt: any;
}

export interface Analytics {
  id: string;
  toolId: string;
  views: number;
  clicks: number;
  revenue: number;
  date: string;
}

export interface Review {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}
