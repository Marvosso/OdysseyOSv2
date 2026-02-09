'use client';

/**
 * Minimal Cloud Sync
 *
 * Syncs the current story (story + scenes + characters) to Supabase.
 * Uses StoryStorage's single current project; no per-storyId getters.
 *
 * Required Supabase tables (with RLS for user_id):
 *   - stories: id (uuid/pk), user_id, title, summary, word_count, status, metadata (jsonb), cloud_updated_at
 *   - scenes: id (uuid/pk), story_id, user_id, title, content, position, status, word_count, metadata (jsonb), cloud_updated_at
 *   - characters: id (uuid/pk), story_id, user_id, name, description, role, goals, flaws, metadata (jsonb), cloud_updated_at
 * Use upsert so the same story can be pushed repeatedly; conflict on (id, user_id) if you use composite unique.
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import type { Story, Scene, Character } from '@/types/story';

// Cloud row types (Supabase schema)
interface CloudStoryRow {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  word_count: number;
  status: string;
  metadata: Record<string, unknown>;
  cloud_updated_at: string;
}

interface CloudSceneRow {
  id: string;
  story_id: string;
  user_id: string;
  title: string;
  content: string;
  position: number;
  status: string;
  word_count: number;
  metadata: Record<string, unknown>;
  cloud_updated_at: string;
}

interface CloudCharacterRow {
  id: string;
  story_id: string;
  user_id: string;
  name: string;
  description: string;
  role: string;
  goals: string;
  flaws: string;
  metadata: Record<string, unknown>;
  cloud_updated_at: string;
}

const LAST_SYNC_KEY = 'odysseyos_last_sync';

export class MinimalCloudSync {
  private isSyncing = false;
  private syncQueue: Array<() => Promise<void>> = [];

  /**
   * Sync the current story to cloud (story + scenes + characters).
   * Uses the single story from StoryStorage; storyId must match current story.id.
   */
  async syncStory(storyId?: string): Promise<boolean> {
    if (this.isSyncing) {
      console.log('[Cloud] Already syncing, queuing...');
      this.syncQueue.push(() => this.syncStory(storyId).then(() => {}));
      return false;
    }

    this.isSyncing = true;

    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('[Cloud] No user logged in');
        return false;
      }

      const story = StoryStorage.loadStory();
      if (!story) {
        console.log('[Cloud] No story in storage');
        return false;
      }

      const id = storyId ?? story.id;
      if (id !== story.id) {
        console.log('[Cloud] storyId does not match current story, syncing current:', story.id);
      }

      const scenes = StoryStorage.loadScenes();
      const characters = StoryStorage.loadCharacters();

      console.log('[Cloud] Syncing story:', story.title);

      await this.pushStoryToCloud(user.id, story);
      for (const scene of scenes) {
        await this.pushSceneToCloud(user.id, story.id, scene);
      }
      for (const character of characters) {
        await this.pushCharacterToCloud(user.id, story.id, character as unknown as Record<string, unknown>);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      }
      console.log('[Cloud] Sync completed successfully');
      return true;
    } catch (error) {
      console.error('[Cloud] Sync error:', error);
      return false;
    } finally {
      this.isSyncing = false;
      this.processQueue();
    }
  }

  private async pushStoryToCloud(userId: string, story: Story): Promise<void> {
    const wordCount =
      story.scenes?.reduce((sum, s) => sum + (s.wordCount ?? 0), 0) ??
      story.scenes?.reduce((sum, s) => sum + (s.content?.split(/\s+/).length ?? 0), 0) ??
      0;

    const { error } = await supabase.from('stories').upsert(
      {
        id: story.id,
        user_id: userId,
        title: story.title || 'Untitled',
        summary: '',
        word_count: wordCount,
        status: 'draft',
        metadata: {
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
        },
        cloud_updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  private async pushSceneToCloud(userId: string, storyId: string, scene: Scene): Promise<void> {
    const wordCount = scene.wordCount ?? (scene.content?.trim() ? scene.content.split(/\s+/).length : 0);
    const { error } = await supabase.from('scenes').upsert(
      {
        id: scene.id,
        story_id: storyId,
        user_id: userId,
        title: scene.title ?? '',
        content: scene.content ?? '',
        position: scene.position ?? 0,
        status: scene.status ?? 'draft',
        word_count: wordCount,
        metadata: {
          emotion: scene.emotion,
          pov_character: scene.povCharacter,
          location: scene.location,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt,
        },
        cloud_updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  private async pushCharacterToCloud(
    userId: string,
    storyId: string,
    character: Record<string, unknown>
  ): Promise<void> {
    const goals = Array.isArray(character.goals) ? (character.goals as string[]).join('\n') : '';
    const flaws = Array.isArray(character.flaws) ? (character.flaws as string[]).join('\n') : '';
    const { error } = await supabase.from('characters').upsert(
      {
        id: String(character.id),
        story_id: storyId,
        user_id: userId,
        name: (character.name as string) ?? '',
        description: (character.description as string) ?? '',
        role: (character.role as string) ?? 'supporting',
        goals,
        flaws,
        metadata: {
          ...character,
          goals: undefined,
          flaws: undefined,
          id: undefined,
          name: undefined,
          description: undefined,
          role: undefined,
        },
        cloud_updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  /**
   * Load a story from cloud into local storage (becomes current project).
   */
  async loadStoryFromCloud(storyId: string): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      console.log('[Cloud] Loading story from cloud:', storyId);

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single();

      if (storyError) throw storyError;
      if (!storyData) return false;

      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (scenesError) throw scenesError;

      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      if (charactersError) throw charactersError;

      const metadata = (storyData.metadata as Record<string, unknown>) ?? {};
      const story: Story = {
        id: storyData.id,
        title: storyData.title ?? 'Untitled',
        scenes: [],
        characters: [],
        createdAt: (metadata.createdAt as string) ? new Date(metadata.createdAt as string) : new Date(),
        updatedAt: (metadata.updatedAt as string) ? new Date(metadata.updatedAt as string) : new Date(),
      };

      const scenes: Scene[] = (scenesData ?? []).map((row: CloudSceneRow) => {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          title: row.title ?? '',
          content: row.content ?? '',
          position: row.position ?? 0,
          emotion: (meta.emotion as Scene['emotion']) ?? 'neutral',
          status: (row.status as Scene['status']) ?? 'draft',
          wordCount: row.word_count,
          povCharacter: meta.pov_character as string | undefined,
          location: meta.location as string | undefined,
          createdAt: (meta.createdAt as string) ? new Date(meta.createdAt as string) : new Date(),
          updatedAt: (meta.updatedAt as string) ? new Date(meta.updatedAt as string) : undefined,
        };
      });

      const characters: Character[] = (charactersData ?? []).map((row: CloudCharacterRow) => {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        const goalsStr = row.goals ?? '';
        const flawsStr = row.flaws ?? '';
        return {
          id: row.id,
          name: row.name ?? '',
          description: row.description ?? '',
          goals: goalsStr ? goalsStr.split('\n').filter(Boolean) : [],
          flaws: flawsStr ? flawsStr.split('\n').filter(Boolean) : [],
          relationships: [],
          ...meta,
        } as Character;
      });

      StoryStorage.saveStory(story);
      StoryStorage.saveScenes(scenes);
      StoryStorage.saveCharacters(characters);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      console.log('[Cloud] Loaded from cloud:', {
        story: story.title,
        scenes: scenes.length,
        characters: characters.length,
      });
      return true;
    } catch (error) {
      console.error('[Cloud] Load error:', error);
      return false;
    }
  }

  /**
   * Sync the single current local story (OdysseyOS has one current project).
   */
  async syncAllLocalStories(): Promise<{ success: number; failed: number }> {
    const story = StoryStorage.loadStory();
    if (!story) {
      return { success: 0, failed: 0 };
    }
    const ok = await this.syncStory(story.id);
    return { success: ok ? 1 : 0, failed: ok ? 0 : 1 };
  }

  /**
   * List the user's stories in the cloud.
   */
  async getCloudStories(): Promise<CloudStoryRow[]> {
    try {
      const user = await getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('cloud_updated_at', { ascending: false });

      if (error) throw error;
      return (data as CloudStoryRow[]) ?? [];
    } catch (error) {
      console.error('[Cloud] Get stories error:', error);
      return [];
    }
  }

  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  private async processQueue(): Promise<void> {
    if (this.syncQueue.length > 0 && !this.isSyncing) {
      const next = this.syncQueue.shift();
      if (next) await next();
    }
  }
}

export const cloudSync = new MinimalCloudSync();
