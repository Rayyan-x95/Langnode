/**
 * Career Path and Competency Landscape Service
 * Fetches dynamic competency roles, skills, and role-skill mappings from FastAPI / Supabase.
 */

import { ApiService } from './api';
import { getItemAsync, setItemAsync } from './storage';

export interface RoleSkillInfo {
  skill_id: string;
  skill_name: string;
  category: string;
  importance: 'Essential' | 'Core' | 'Recommended' | 'Bonus';
  expected_proficiency: 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  proficiency_level: number;
  description: string;
}

export interface CareerRoleSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  badge_color: string;
  total_skills: number;
  essential_count: number;
  growth_outlook: string;
  avg_salary: string;
}

export interface CareerRoleDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  badge_color: string;
  growth_outlook: string;
  avg_salary: string;
  why_choose_this: string[];
  skills: RoleSkillInfo[];
  categories_covered: string[];
}

export interface CareerListResponse {
  roles: CareerRoleSummary[];
  categories: string[];
}

export interface SkillCategoryInfo {
  name: string;
  count: number;
  icon: string;
}

const STORAGE_KEY_ROLES = 'langnode_cached_careers_roles';
const STORAGE_KEY_CATEGORIES = 'langnode_cached_careers_categories';
const STORAGE_KEY_ROLE_DETAIL_PREFIX = 'langnode_cached_career_detail_';

export class CareerService {
  /**
   * Fetch all available career roles with optional search and category filters.
   */
  static async listRoles(search = '', category = 'All'): Promise<CareerListResponse> {
    const baseUrl = await ApiService.getBaseUrl();
    const query = new URLSearchParams();
    if (search.trim()) query.append('search', search.trim());
    if (category && category !== 'All') query.append('category', category);

    const url = `${baseUrl}/api/careers/roles?${query.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: CareerListResponse = await res.json();
        // Cache full list when unfiltered
        if (!search && (!category || category === 'All')) {
          await setItemAsync(STORAGE_KEY_ROLES, JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.warn('[CareerService] Failed to fetch live career roles, falling back to cache:', err);
    }

    // Fallback to cache
    const cached = await getItemAsync(STORAGE_KEY_ROLES);
    if (cached) {
      try {
        const parsed: CareerListResponse = JSON.parse(cached);
        let roles = parsed.roles;
        if (search.trim()) {
          const s = search.toLowerCase();
          roles = roles.filter(
            r => r.name.toLowerCase().includes(s) || r.description.toLowerCase().includes(s)
          );
        }
        if (category && category !== 'All') {
          roles = roles.filter(r => r.category.toLowerCase() === category.toLowerCase());
        }
        return { roles, categories: parsed.categories };
      } catch {
        // Cache parse failure
      }
    }

    // Default safe fallback if backend is unreachable on first boot
    return {
      roles: [],
      categories: ['Engineering', 'Data & Intelligence', 'Design', 'Security & Infrastructure'],
    };
  }

  /**
   * Fetch full role detail with required skills, expected proficiencies, and importance ranking.
   */
  static async getRoleDetail(roleId: string): Promise<CareerRoleDetail> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/careers/roles/${roleId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: CareerRoleDetail = await res.json();
        await setItemAsync(`${STORAGE_KEY_ROLE_DETAIL_PREFIX}${roleId}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`[CareerService] Failed to fetch role ${roleId}, checking cache:`, err);
    }

    const cached = await getItemAsync(`${STORAGE_KEY_ROLE_DETAIL_PREFIX}${roleId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    throw new Error(`Unable to load career details for '${roleId}'. Please verify network connection.`);
  }

  /**
   * Fetch all 9 canonical skill categories and aggregate skill counts.
   */
  static async listCategories(): Promise<SkillCategoryInfo[]> {
    const baseUrl = await ApiService.getBaseUrl();
    const url = `${baseUrl}/api/careers/categories`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: SkillCategoryInfo[] = await res.json();
        await setItemAsync(STORAGE_KEY_CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[CareerService] Failed to fetch categories, checking cache:', err);
    }

    const cached = await getItemAsync(STORAGE_KEY_CATEGORIES);
    if (cached) {
      return JSON.parse(cached);
    }

    return [
      { name: 'Programming', count: 6, icon: 'code-slash' },
      { name: 'Frameworks', count: 4, icon: 'layers' },
      { name: 'Databases', count: 3, icon: 'server' },
      { name: 'Cloud', count: 3, icon: 'cloud' },
      { name: 'AI/ML', count: 3, icon: 'hardware-chip' },
      { name: 'Design', count: 3, icon: 'color-palette' },
      { name: 'Communication', count: 2, icon: 'chatbubble-ellipses' },
      { name: 'Problem Solving', count: 3, icon: 'git-branch' },
      { name: 'Tools', count: 3, icon: 'build' },
    ];
  }
}
