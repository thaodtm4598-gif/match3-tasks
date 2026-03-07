/**
 * setup-db.mjs
 * Tự động tạo schema và seed dữ liệu ban đầu vào Supabase PostgreSQL.
 * Chạy: pnpm setup-db
 */

// Allow self-signed certs from Supabase pooler (dev script only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Parse .env.local ─────────────────────────────────────────────────────────
function loadEnv(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    console.error(`\n❌  File not found: ${filePath}`);
    process.exit(1);
  }

  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

const env = loadEnv(resolve(__dirname, '../.env.local'));

const connectionString = env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error('❌  POSTGRES_URL_NON_POOLING not found in .env.local');
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function banner(msg) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${msg}`);
  console.log('─'.repeat(50));
}

function ok(msg)   { console.log(`  ✓  ${msg}`); }
function fail(msg) { console.error(`  ✕  ${msg}`); }

// ─── Main ─────────────────────────────────────────────────────────────────────
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

banner('Match3 Task Board · DB Setup');

try {
  await client.connect();
  ok('Connected to PostgreSQL');

  // ── 1. Schema ──────────────────────────────────────────────────────────────
  console.log('\n[ 1/3 ] Creating schema…');

  // Tasks table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tasks (
      id          TEXT PRIMARY KEY,
      summary     TEXT        NOT NULL,
      label       TEXT        NOT NULL,
      status      TEXT        NOT NULL DEFAULT 'Open',
      priority    TEXT        NOT NULL DEFAULT 'Medium',
      assignee    TEXT                 DEFAULT '',
      start_date  TEXT,
      end_date    TEXT,
      sprint      TEXT                 DEFAULT 'Sprint 1',
      note        TEXT                 DEFAULT '',
      created_at  TIMESTAMPTZ          DEFAULT NOW(),
      updated_at  TIMESTAMPTZ          DEFAULT NOW()
    )
  `);
  ok('Table "tasks" ready');

  // updated_at trigger
  await client.query(`
    CREATE OR REPLACE FUNCTION public.update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
  await client.query(`
    DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
    CREATE TRIGGER tasks_updated_at
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()
  `);
  ok('Trigger "tasks_updated_at" ready');

  // ── 2. RLS ────────────────────────────────────────────────────────────────
  console.log('\n[ 2/3 ] Configuring Row Level Security…');

  await client.query(`ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY`);

  // Drop existing policy if any, then recreate
  await client.query(`
    DROP POLICY IF EXISTS "Authenticated users full access" ON public.tasks
  `);
  await client.query(`
    CREATE POLICY "Authenticated users full access"
      ON public.tasks FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true)
  `);
  ok('RLS policy "Authenticated users full access" applied');

  // Realtime publication
  try {
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks
    `);
    ok('Realtime publication enabled');
  } catch (e) {
    // Already added — not an error
    if (e.message?.includes('already member')) {
      ok('Realtime publication already enabled');
    } else {
      fail(`Realtime: ${e.message} (non-fatal, continuing…)`);
    }
  }

  // ── 3. Seed ───────────────────────────────────────────────────────────────
  console.log('\n[ 3/3 ] Seeding initial tasks…');

  const SEED = [
    ['M3-001', 'Restructure Kịch bản - Thêm đoạn dẫn nhập',          'Narrative',      'Open',        'Medium', 'DiepPB',   '2026-03-05', '2026-03-06', 'Sprint 1'],
    ['M3-002', 'Restructure Kịch bản (Cutscene)',                      'Cutscene',       'Open',        'Medium', 'DuyTD4',   '2026-03-09', '2026-03-11', 'Sprint 1'],
    ['M3-003', 'Onboarding guiding → Narrative viết chi tiết',         'Narrative',      'Open',        'High',   'DuongPQ',  '2026-03-05', '2026-03-05', 'Sprint 1'],
    ['M3-004', 'Thêm dialogue kiểm soát nhịp điệu',                   'Narrative',      'Open',        'Medium', 'DiepPB',   '2026-03-05', '2026-03-09', 'Sprint 1'],
    ['M3-005', 'Gen AI ghép thử comic + dialogue',                     'Cutscene',       'Open',        'Medium', 'LamNQ',    '2026-03-09', '2026-03-11', 'Sprint 1'],
    ['M3-009', 'Animation trám transition cutscene → in-game',         'Animation',      'To Do',       'High',   'DuongPQ',  '2026-03-09', '2026-03-12', 'Sprint 1'],
    ['M3-022', 'Spec core gameplay mechanics',                         'Core Game',      'To Do',       'High',   'SangVK',   '2026-03-09', '2026-03-09', 'Sprint 1'],
    ['M3-023', 'Spec gameplay UI (header, HUD, difficulty)',            'Core Game',      'To Do',       'High',   'ToanDV2',  '2026-03-06', '2026-03-09', 'Sprint 1'],
    ['M3-035', 'Update 3 thuật toán rơi hạt (Random, Bias, NonPU)',    'Level Design',   'Done',        'High',   'SangVK',   '2026-03-06', '2026-03-06', 'Sprint 1'],
    ['M3-040', 'Merge codebase: Feeling/Animation',                    'Dev',            'In Progress', 'High',   'kienlt3',  '2026-03-05', '2026-03-06', 'Sprint 1'],
    ['M3-044', '[ART] Map Saga - Concept 2D full map',                 'Art - Map Saga', 'To Do',       'High',   'VinhND',   '2026-03-11', '2026-03-13', 'Sprint 2'],
    ['M3-047', '[ART] ICON đảo - Retouch 4 icon đảo đã có',           'Art - Icons',    'To Do',       'High',   'VânNTT',   '2026-03-06', '2026-03-09', 'Sprint 1'],
    ['M3-050', '[ART] UI Region - Demo 3 picture vùng Đảo/Saga',       'Art - UI',       'To Do',       'High',   'HiềnNT',   '2026-03-09', '2026-03-10', 'Sprint 1'],
    ['M3-054', '[ART] Blocker - Thùng gỗ (6 mẫu)',                    'Art - Blocker',  'To Do',       'Medium', 'VânNTT',   '2026-03-16', '2026-03-17', 'Sprint 2'],
  ];

  let inserted = 0;
  let skipped  = 0;

  for (const [id, summary, label, status, priority, assignee, start_date, end_date, sprint] of SEED) {
    const res = await client.query(
      `INSERT INTO public.tasks (id, summary, label, status, priority, assignee, start_date, end_date, sprint, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'')
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [id, summary, label, status, priority, assignee, start_date, end_date, sprint],
    );
    if (res.rowCount > 0) { inserted++; ok(`Inserted ${id}`); }
    else                  { skipped++;  console.log(`  –  Skipped ${id} (already exists)`); }
  }

  console.log(`\n  📊 ${inserted} inserted, ${skipped} skipped`);

  // ── Done ──────────────────────────────────────────────────────────────────
  banner('Setup complete ✓');
  console.log('  Next steps:');
  console.log('  1. Go to Supabase Dashboard → Authentication → Users');
  console.log('  2. Add team member accounts (email + password)');
  console.log('  3. Run: pnpm dev\n');

} catch (err) {
  fail(err.message);
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}
