-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- Run AFTER schema.sql. Inserts the initial demo tasks.

INSERT INTO public.tasks (id, summary, label, status, priority, assignee, start_date, end_date, sprint, note) VALUES
  ('M3-001', 'Restructure Kịch bản - Thêm đoạn dẫn nhập',          'Narrative',     'Open',        'Medium', 'DiepPB',   '2026-03-05', '2026-03-06', 'Sprint 1', ''),
  ('M3-002', 'Restructure Kịch bản (Cutscene)',                      'Cutscene',      'Open',        'Medium', 'DuyTD4',   '2026-03-09', '2026-03-11', 'Sprint 1', ''),
  ('M3-003', 'Onboarding guiding → Narrative viết chi tiết',         'Narrative',     'Open',        'High',   'DuongPQ',  '2026-03-05', '2026-03-05', 'Sprint 1', ''),
  ('M3-004', 'Thêm dialogue kiểm soát nhịp điệu',                   'Narrative',     'Open',        'Medium', 'DiepPB',   '2026-03-05', '2026-03-09', 'Sprint 1', ''),
  ('M3-005', 'Gen AI ghép thử comic + dialogue',                     'Cutscene',      'Open',        'Medium', 'LamNQ',    '2026-03-09', '2026-03-11', 'Sprint 1', ''),
  ('M3-009', 'Animation trám transition cutscene → in-game',         'Animation',     'To Do',       'High',   'DuongPQ',  '2026-03-09', '2026-03-12', 'Sprint 1', ''),
  ('M3-022', 'Spec core gameplay mechanics',                         'Core Game',     'To Do',       'High',   'SangVK',   '2026-03-09', '2026-03-09', 'Sprint 1', ''),
  ('M3-023', 'Spec gameplay UI (header, HUD, difficulty)',            'Core Game',     'To Do',       'High',   'ToanDV2',  '2026-03-06', '2026-03-09', 'Sprint 1', ''),
  ('M3-035', 'Update 3 thuật toán rơi hạt (Random, Bias, NonPU)',    'Level Design',  'Done',        'High',   'SangVK',   '2026-03-06', '2026-03-06', 'Sprint 1', ''),
  ('M3-040', 'Merge codebase: Feeling/Animation',                    'Dev',           'In Progress', 'High',   'kienlt3',  '2026-03-05', '2026-03-06', 'Sprint 1', ''),
  ('M3-044', '[ART] Map Saga - Concept 2D full map',                 'Art - Map Saga','To Do',       'High',   'VinhND',   '2026-03-11', '2026-03-13', 'Sprint 2', ''),
  ('M3-047', '[ART] ICON đảo - Retouch 4 icon đảo đã có',           'Art - Icons',   'To Do',       'High',   'VânNTT',   '2026-03-06', '2026-03-09', 'Sprint 1', ''),
  ('M3-050', '[ART] UI Region - Demo 3 picture vùng Đảo/Saga',       'Art - UI',      'To Do',       'High',   'HiềnNT',   '2026-03-09', '2026-03-10', 'Sprint 1', ''),
  ('M3-054', '[ART] Blocker - Thùng gỗ (6 mẫu)',                    'Art - Blocker', 'To Do',       'Medium', 'VânNTT',   '2026-03-16', '2026-03-17', 'Sprint 2', '')
ON CONFLICT (id) DO NOTHING;
