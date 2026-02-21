/**
 * Debounced auto-save of current project to API.
 * Schedule with scheduleProjectSave() after outline change, title change, chapter edit.
 */

import { StoryStorage } from '@/lib/storage/storyStorage';
import { updateProject } from '@/lib/api/projectsClient';

const DEBOUNCE_MS = 1500;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function scheduleProjectSave(options?: { templateUsed?: string }): void {
  const activeId = StoryStorage.getActiveProjectId();
  if (!activeId) return;

  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    timeoutId = null;
    const data = StoryStorage.loadAll();
    const outline = StoryStorage.loadOutline();
    const payload = {
      title: data.story?.title ?? 'Untitled',
      content: {
        story: data.story ?? null,
        scenes: data.scenes ?? [],
        characters: data.characters ?? [],
      },
      outline: outline ?? {},
      ...(options?.templateUsed != null && { templateUsed: options.templateUsed }),
    };
    await updateProject(activeId, payload);
  }, DEBOUNCE_MS);
}
