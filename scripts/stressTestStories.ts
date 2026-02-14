/**
 * Stress test: insert 1 story + 300 scenes (each scene = 3000 words lorem ipsum).
 * Admin-level backend script using Supabase service role key (bypasses RLS).
 *
 * Requires env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 * STRESS_TEST_USER_ID (uuid of the user to attach story/scenes to)
 *
 * Run: npx tsx scripts/stressTestStories.ts
 * Loads .env.local / .env.local.txt from project root if present.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal(): void {
  const base = path.resolve(path.dirname(process.argv[1] ?? ''), '..');
  const candidates = ['.env.local', '.env.local.txt'];
  for (const name of candidates) {
    const p = path.join(base, name);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      }
      return;
    }
  }
}

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];

function loremWords(count: number): string {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(LOREM_WORDS[i % LOREM_WORDS.length]);
  }
  return out.join(' ');
}

const SCENE_WORD_COUNT = 3000;
const NUM_SCENES = 300;
const STORY_ID = crypto.randomUUID();

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('[stressTest] Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const userId = process.env.STRESS_TEST_USER_ID;
  if (!userId) {
    console.error('[stressTest] Missing STRESS_TEST_USER_ID (uuid of user to attach story/scenes to)');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);
  console.log('[stressTest] Running with Supabase service role (RLS bypass).');

  const startTotal = Date.now();
  const failures: string[] = [];

  console.log('[stressTest] Target user_id =', userId);

  console.log('[stressTest] Inserting 1 story:', STORY_ID);
  const storyRow = { id: STORY_ID, user_id: userId, title: 'Stress test story' };
  const { error: storyErr } = await supabase.from('stories').insert(storyRow as Record<string, unknown>);
  if (storyErr) {
    console.error('[stressTest] Story insert failed:', storyErr.message);
    failures.push(`story: ${storyErr.message}`);
  } else {
    console.log('[stressTest] Story inserted.');
  }

  const sceneContent = loremWords(SCENE_WORD_COUNT);
  console.log('[stressTest] Inserting', NUM_SCENES, 'scenes in 1 bulk insert (each', SCENE_WORD_COUNT, 'words)...');
  const sceneStart = Date.now();

  const sceneRows = Array.from({ length: NUM_SCENES }, (_, i) => ({
    id: crypto.randomUUID(),
    story_id: STORY_ID,
    user_id: userId,
    title: `Scene ${i + 1}`,
    content: sceneContent,
    position: i,
  }));

  const { error: sceneErr } = await supabase.from('scenes').insert(sceneRows as Record<string, unknown>[]);
  if (sceneErr) {
    console.error('[stressTest] Bulk scene insert failed:', sceneErr.message);
    for (let i = 0; i < NUM_SCENES; i++) failures.push(`scene ${i}: ${sceneErr.message}`);
  }

  const sceneElapsed = Date.now() - sceneStart;
  const totalElapsed = Date.now() - startTotal;

  console.log('');
  console.log('[stressTest] --- Summary ---');
  console.log('[stressTest] Total execution time:', totalElapsed, 'ms');
  console.log('[stressTest] Scene insert time:  ', sceneElapsed, 'ms');
  console.log('[stressTest] Failures:', failures.length);
  if (failures.length > 0) {
    console.log('[stressTest] First 10 failures:');
    failures.slice(0, 10).forEach((f) => console.log('  ', f));
  }
}

main().catch((e) => {
  console.error('[stressTest] Unhandled error:', e);
  process.exit(1);
});
