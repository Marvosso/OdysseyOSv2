/**
 * Sync Service
 *
 * - Saves story updates immediately to localStorage
 * - For pro/studio: debounces 3s then upserts to Supabase (story + scenes + characters)
 * - Uses updated_at timestamps and last-write-wins on pull
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import type { Story, Scene, Character } from '@/types/story';

const DEBOUNCE_MS = 3000;

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

function getTierFromRow(tier: unknown): 'free' | 'pro' | 'studio' {
  if (tier === 'pro' || tier === 'studio') return tier;
  return 'free';
}

class SyncService {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save story: write to localStorage immediately; if tier is pro/studio, schedule cloud upsert (3s debounce).
   */
  saveStory(story: Story): void {
    const now = new Date();
    const normalized: Story = {
      ...story,
      updatedAt: now,
      scenes: story.scenes ?? [],
      characters: story.characters ?? [],
    };

    StoryStorage.saveStory(normalized);
    StoryStorage.saveScenes(normalized.scenes);
    StoryStorage.saveCharacters(normalized.characters);

    this.scheduleCloudUpsert();
  }

  /**
   * Run cloud upsert immediately (and cancel any pending debounced upsert).
   */
  async syncNow(): Promise<boolean> {
    this.cancelDebounce();
    return this.pushToCloud();
  }

  /**
   * Pull current story from cloud; last-write-wins (newer updated_at wins). Writes to localStorage only when cloud is newer.
   */
  async pullFromCloud(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      const localStory = StoryStorage.loadStory();
      const storyId = localStory?.id;
      if (!storyId) return false;

      const { data: storyRow, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (storyError || !storyRow) return false;

      const cloudUpdatedAt = new Date((storyRow as CloudStoryRow).cloud_updated_at).getTime();
      const localUpdatedAt = localStory.updatedAt ? new Date(localStory.updatedAt).getTime() : 0;

      if (cloudUpdatedAt <= localUpdatedAt) {
        return true;
      }

      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (scenesError) return false;

      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      if (charactersError) return false;

      const metadata = ((storyRow as CloudStoryRow).metadata ?? {}) as Record<string, unknown>;
      const story: Story = {
        id: (storyRow as CloudStoryRow).id,
        title: (storyRow as CloudStoryRow).title ?? 'Untitled',
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

      return true;
    } catch (e) {
      console.error('[SyncService] pullFromCloud error:', e);
      return false;
    }
  }

  private cancelDebounce(): void {
    if (this.debounceTimer != null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleCloudUpsert(): void {
    this.cancelDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.pushToCloud();
    }, DEBOUNCE_MS);
  }

  private async pushToCloud(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();

      const tier = getTierFromRow(profileRow?.tier);
      if (tier !== 'pro' && tier !== 'studio') return false;

      const story = StoryStorage.loadStory();
      if (!story) return false;

      const scenes = StoryStorage.loadScenes();
      const characters = StoryStorage.loadCharacters();

      const wordCount =
        story.scenes?.reduce((sum, s) => sum + (s.wordCount ?? 0), 0) ??
        story.scenes?.reduce((sum, s) => sum + (s.content?.split(/\s+/).length ?? 0), 0) ??
        0;

      const { error: storyError } = await supabase.from('stories').upsert(
        {
          id: story.id,
          user_id: user.id,
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
      if (storyError) throw storyError;

      for (const scene of scenes) {
        const sceneWordCount = scene.wordCount ?? (scene.content?.trim() ? scene.content.split(/\s+/).length : 0);
        const { error } = await supabase.from('scenes').upsert(
          {
            id: scene.id,
            story_id: story.id,
            user_id: user.id,
            title: scene.title ?? '',
            content: scene.content ?? '',
            position: scene.position ?? 0,
            status: scene.status ?? 'draft',
            word_count: sceneWordCount,
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

      for (const character of characters) {
        const c = character as unknown as Record<string, unknown>;
        const goals = Array.isArray(c.goals) ? (c.goals as string[]).join('\n') : '';
        const flaws = Array.isArray(c.flaws) ? (c.flaws as string[]).join('\n') : '';
        const { error } = await supabase.from('characters').upsert(
          {
            id: String(c.id),
            story_id: story.id,
            user_id: user.id,
            name: (c.name as string) ?? '',
            description: (c.description as string) ?? '',
            role: (c.role as string) ?? 'supporting',
            goals,
            flaws,
            metadata: {
              ...c,
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

      return true;
    } catch (e) {
      console.error('[SyncService] pushToCloud error:', e);
      return false;
    }
  }
}

export const syncService = new SyncService();
