/**
 * Concurrency stress test: 20 concurrent users, each creates 1 story + 20 scenes.
 * Uses Supabase service role key (bypasses RLS).
 *
 * Requires env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STRESS_TEST_USER_ID (uuid of user in auth.users - used for all 20 simulated users)
 *
 * Run: npx tsx scripts/stressTestConcurrency.ts
 * Loads .env.local / .env.local.txt from project root if present.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const NUM_USERS = 20;
const SCENES_PER_STORY = 20;

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

function randomUuid(): string {
  return crypto.randomUUID();
}

type UserResult = {
  userIndex: number;
  storyId: string;
  failures: string[];
};

async function runUser(
  supabase: ReturnType<typeof createClient>,
  userIndex: number,
  userId: string
): Promise<UserResult> {
  const storyId = randomUuid();
  const failures: string[] = [];

  // Insert story
  const { error: storyErr } = await supabase.from('stories').insert({
    id: storyId,
    user_id: userId,
    title: `Stress test story (user ${userIndex})`,
  });

  if (storyErr) {
    failures.push(`story: ${storyErr.message}`);
    return { userIndex, storyId, failures };
  }

  // Insert scenes
  const sceneRows = Array.from({ length: SCENES_PER_STORY }, (_, i) => ({
    id: randomUuid(),
    story_id: storyId,
    user_id: userId,
    title: `Scene ${i + 1}`,
    content: `Scene ${i + 1} content for user ${userIndex}`,
    position: i,
  }));

  const { error: sceneErr } = await supabase.from('scenes').insert(sceneRows);
  if (sceneErr) {
    failures.push(`scenes: ${sceneErr.message}`);
  }

  return { userIndex, storyId, failures };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      '[stressConcurrency] Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const userId = process.env.STRESS_TEST_USER_ID;
  if (!userId) {
    console.error(
      '[stressConcurrency] Missing STRESS_TEST_USER_ID (uuid of user in auth.users to attach stories/scenes to)'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);
  console.log('[stressConcurrency] Running with Supabase service role (RLS bypass).');
  console.log(`[stressConcurrency] Simulating ${NUM_USERS} concurrent users, ${SCENES_PER_STORY} scenes per story.`);
  console.log('');

  const startTotal = Date.now();

  const userTasks = Array.from({ length: NUM_USERS }, (_, i) => runUser(supabase, i, userId));
  const results = await Promise.all(userTasks);

  const totalElapsed = Date.now() - startTotal;

  // Summary
  const failedUsers = results.filter((r) => r.failures.length > 0);
  const totalFailures = results.reduce((sum, r) => sum + r.failures.length, 0);

  console.log('[stressConcurrency] --- Summary ---');
  console.log('[stressConcurrency] Total execution time:', totalElapsed, 'ms');
  console.log('[stressConcurrency] Users succeeded:', NUM_USERS - failedUsers.length, '/', NUM_USERS);
  console.log('[stressConcurrency] Users failed:    ', failedUsers.length, '/', NUM_USERS);
  console.log('[stressConcurrency] Total failures: ', totalFailures);
  console.log('');

  if (failedUsers.length > 0) {
    console.log('[stressConcurrency] Failures per user:');
    for (const r of failedUsers) {
      console.log(`  User ${r.userIndex}:`, r.failures.join('; '));
    }
  }
}

main().catch((e) => {
  console.error('[stressConcurrency] Unhandled error:', e);
  process.exit(1);
});
