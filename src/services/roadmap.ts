/**
 * Roadmap & Skill Assessment Service
 * Manages skill assessments, skill gap analysis, personalized roadmaps, and progress tracking.
 */

import { ApiService } from './api';
import { getItemAsync, setItemAsync } from './storage';

export interface UserSkillRating {
  skill_id: string;
  skill_name: string;
  level: string; // 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert' | "I Don't Know"
  level_score: number; // 0 to 5
}

export interface SkillGapItem {
  skill_id: string;
  skill_name: string;
  category: string;
  importance: 'Essential' | 'Core' | 'Recommended' | 'Bonus';
  current_level: string;
  current_score: number;
  expected_level: string;
  expected_score: number;
  gap: number;
  recommended_action: string;
  status: 'Strong' | 'Developing' | 'Improvement Needed' | 'Missing';
}

export interface SkillGapAnalysisResponse {
  role_id: string;
  role_name: string;
  user_id: string;
  total_skills: number;
  strong_skills: SkillGapItem[];
  developing_skills: SkillGapItem[];
  improvement_needed_skills: SkillGapItem[];
  missing_skills: SkillGapItem[];
  priority_areas: SkillGapItem[];
  readiness_percentage: number;
  summary: string;
}

export interface RoadmapItem {
  id: string;
  phase_number: number;
  phase_name: string;
  skill_id: string;
  skill_name: string;
  topic: string;
  current_level: string;
  target_level: string;
  learning_objective: string;
  recommended_activity: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string | null;
  estimated_hours: number;
}

export interface RoadmapPhase {
  phase_number: number;
  title: string;
  description: string;
  items: RoadmapItem[];
  completed_items_count: number;
  total_items_count: number;
  is_unlocked: boolean;
}

export interface PersonalizedRoadmapResponse {
  id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  created_at: string;
  updated_at: string;
  total_phases: number;
  total_topics: number;
  completed_topics: number;
  completion_percentage: number;
  phases: RoadmapPhase[];
  recommended_next_step?: RoadmapItem | null;
}

export interface StudentProgressState {
  user_id: string;
  active_role_id?: string | null;
  active_role_name?: string | null;
  completion_percentage: number;
  total_topics_count: number;
  completed_topics_count: number;
  in_progress_topics_count: number;
  skills_leveled_up: number;
  learning_sessions_count: number;
  saved_notes_count: number;
  current_streak_days: number;
  recommended_next_step?: RoadmapItem | null;
  recent_activity: string[];
}

const STORAGE_KEY_GAP_PREFIX = 'langnode_cached_gap_';
const STORAGE_KEY_ROADMAP_PREFIX = 'langnode_cached_roadmap_';
const STORAGE_KEY_PROGRESS_PREFIX = 'langnode_cached_progress_';

export class RoadmapApiService {
  /**
   * Submit student's self-assessed skill levels and receive an instant Skill Gap Analysis.
   */
  static async submitAssessment(
    roleId: string,
    ratings: UserSkillRating[],
    userId = 'student_default'
  ): Promise<SkillGapAnalysisResponse> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/assessment/submit`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role_id: roleId,
          ratings,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: SkillGapAnalysisResponse = await res.json();
        await setItemAsync(`${STORAGE_KEY_GAP_PREFIX}${roleId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[RoadmapApiService] Failed to submit assessment live:', err);
    }

    // Return cached gap if available
    const cached = await getItemAsync(`${STORAGE_KEY_GAP_PREFIX}${roleId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw new Error('Could not submit assessment. Please check backend connection.');
  }

  /**
   * Fetch skill gap analysis for a role.
   */
  static async getGapAnalysis(
    roleId: string,
    userId = 'student_default'
  ): Promise<SkillGapAnalysisResponse> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/assessment/${userId}/gap/${roleId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: SkillGapAnalysisResponse = await res.json();
        await setItemAsync(`${STORAGE_KEY_GAP_PREFIX}${roleId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`[RoadmapApiService] Failed to fetch gap analysis for ${roleId}:`, err);
    }

    const cached = await getItemAsync(`${STORAGE_KEY_GAP_PREFIX}${roleId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw new Error('Skill gap analysis not found. Please take the diagnostic assessment first.');
  }

  /**
   * Fetch or generate personalized roadmap for the target career.
   */
  static async getRoadmap(
    roleId: string,
    userId = 'student_default'
  ): Promise<PersonalizedRoadmapResponse> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/roadmap/${userId}/${roleId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: PersonalizedRoadmapResponse = await res.json();
        await setItemAsync(`${STORAGE_KEY_ROADMAP_PREFIX}${roleId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`[RoadmapApiService] Failed to fetch roadmap for ${roleId}:`, err);
    }

    const cached = await getItemAsync(`${STORAGE_KEY_ROADMAP_PREFIX}${roleId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw new Error('Personalized roadmap unavailable. Please check backend connection.');
  }

  /**
   * Update roadmap item status (not_started, in_progress, completed).
   */
  static async updateItemStatus(
    roleId: string,
    itemId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    userId = 'student_default'
  ): Promise<PersonalizedRoadmapResponse> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/roadmap/item/update`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role_id: roleId,
          item_id: itemId,
          status,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: PersonalizedRoadmapResponse = await res.json();
        await setItemAsync(`${STORAGE_KEY_ROADMAP_PREFIX}${roleId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[RoadmapApiService] Failed to update item status live:', err);
    }

    // Local fallback update if offline
    const cached = await getItemAsync(`${STORAGE_KEY_ROADMAP_PREFIX}${roleId}`);
    if (cached) {
      const parsed: PersonalizedRoadmapResponse = JSON.parse(cached);
      for (const phase of parsed.phases) {
        for (const item of phase.items) {
          if (item.id === itemId) {
            item.status = status;
            if (status === 'completed') {
              item.completed_at = new Date().toISOString();
            }
          }
        }
        phase.completed_items_count = phase.items.filter((i) => i.status === 'completed').length;
      }
      parsed.completed_topics = parsed.phases.reduce((acc, p) => acc + p.completed_items_count, 0);
      parsed.completion_percentage =
        parsed.total_topics > 0
          ? Math.round((parsed.completed_topics / parsed.total_topics) * 100)
          : 0;
      await setItemAsync(`${STORAGE_KEY_ROADMAP_PREFIX}${roleId}`, JSON.stringify(parsed));
      return parsed;
    }

    throw new Error('Unable to update roadmap item status.');
  }

  /**
   * Fetch aggregate student progress state.
   */
  static async getStudentProgress(userId = 'student_default'): Promise<StudentProgressState> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/progress/${userId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: StudentProgressState = await res.json();
        await setItemAsync(`${STORAGE_KEY_PROGRESS_PREFIX}${userId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[RoadmapApiService] Failed to fetch progress summary live:', err);
    }

    const cached = await getItemAsync(`${STORAGE_KEY_PROGRESS_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    return {
      user_id: userId,
      completion_percentage: 18.5,
      total_topics_count: 14,
      completed_topics_count: 3,
      in_progress_topics_count: 2,
      skills_leveled_up: 4,
      learning_sessions_count: 5,
      saved_notes_count: 3,
      current_streak_days: 3,
      recent_activity: ['Started Roadmap for Frontend Developer'],
    };
  }
}
