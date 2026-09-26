export type ExplanationLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ExplanationLevelConfig {
  id: ExplanationLevel;
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
  description: string;
  guidelines: string;
}

export const EXPLANATION_LEVELS: ExplanationLevelConfig[] = [
  {
    id: 'Beginner',
    title: 'Beginner',
    subtitle: 'Intuitive & Analogy-Driven',
    icon: 'school-outline',
    badgeColor: '#10B981',
    description: 'Bite-sized metaphors, zero prerequisite jargon, clear everyday analogies.',
    guidelines: 'Use concrete everyday analogies, avoid dense math or jargon unless defined, keep sentences short and encouraging.',
  },
  {
    id: 'Intermediate',
    title: 'Intermediate',
    subtitle: 'Applied & Conceptual',
    icon: 'bulb-outline',
    badgeColor: '#3B82F6',
    description: 'Standard technical terms explained with practical code/system use cases.',
    guidelines: 'Provide clear definitions, real-world engineering or scientific context, balanced detail, and practical examples.',
  },
  {
    id: 'Advanced',
    title: 'Advanced',
    subtitle: 'Rigorous & Deep Architecture',
    icon: 'rocket-outline',
    badgeColor: '#8B5CF6',
    description: 'Underlying mechanics, edge cases, algorithmic complexities, and design trade-offs.',
    guidelines: 'Include algorithmic nuances, asymptotic complexity, underlying memory/hardware implications, and architectural trade-offs.',
  },
];

export const DEFAULT_EXPLANATION_LEVEL: ExplanationLevel = 'Beginner';

export function getExplanationLevelConfig(level: ExplanationLevel): ExplanationLevelConfig {
  return EXPLANATION_LEVELS.find((l) => l.id === level) || EXPLANATION_LEVELS[0];
}
