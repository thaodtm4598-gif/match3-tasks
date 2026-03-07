export const LABEL_META: Record<string, { bg: string; fg: string; dot: string }> = {
  Narrative:       { bg: '#2D1B69', fg: '#B8A9FF', dot: '#7C6CFA' },
  Cutscene:        { bg: '#3D0A14', fg: '#FFA0B4', dot: '#F06090' },
  Animation:       { bg: '#042838', fg: '#90DCFF', dot: '#40C0F0' },
  Art:             { bg: '#062A18', fg: '#7EEFC0', dot: '#3ECF8E' },
  'Art / Effect':  { bg: '#1A2E00', fg: '#BCED70', dot: '#90D050' },
  'Art - Map Saga':{ bg: '#042A1E', fg: '#60EEC0', dot: '#2ED8A0' },
  'Art - Icons':   { bg: '#122000', fg: '#AAEE80', dot: '#80D850' },
  'Art - UI':      { bg: '#022830', fg: '#80E8EC', dot: '#40D0D8' },
  'Art - Blocker': { bg: '#2A1A00', fg: '#FFD090', dot: '#F0A040' },
  Design:          { bg: '#2A1A00', fg: '#FFD080', dot: '#F0A030' },
  'Core Game':     { bg: '#071A38', fg: '#90C4FF', dot: '#5BA3F5' },
  'Meta Loop':     { bg: '#1E0A38', fg: '#D0A0FF', dot: '#A060F0' },
  Meta:            { bg: '#1E0A38', fg: '#D0A0FF', dot: '#A060F0' },
  Balance:         { bg: '#2A0A08', fg: '#FFA090', dot: '#F07060' },
  'Level Design':  { bg: '#012828', fg: '#70ECEC', dot: '#40D8D8' },
  Research:        { bg: '#282200', fg: '#F0E090', dot: '#E0C040' },
  Dev:             { bg: '#0A1830', fg: '#A0C0FF', dot: '#7090E0' },
  'Dev+design':    { bg: '#180A30', fg: '#C0B0FF', dot: '#9080D0' },
  Direction:       { bg: '#2A0800', fg: '#FFA070', dot: '#F07040' },
};

export const ALL_LABELS = Object.keys(LABEL_META);

export const MEMBERS = [
  'DiepPB', 'DuyTD4', 'DuongPQ', 'LamNQ', 'ThaoDTM', 'SangVK', 'ToanDV2',
  'Tuanna10', 'CuongDD', 'KienHV', 'kienlt3', 'VinhND', 'VânNTT', 'HiềnNT',
];

export const WORKFLOW_RULES = [
  { id: 'cutscene-onboarding', name: '🎬 Cutscene · Onboarding',    labels: ['Narrative', 'Cutscene'],              deadline_offset: 6  },
  { id: 'cutscene-quality',    name: '🎨 Cutscene · Quality',       labels: ['Narrative', 'Cutscene', 'Animation'], deadline_offset: 8  },
  { id: 'cutscene-transition', name: '⚡ Transition Cutscene↔Game', labels: ['Art', 'Animation', 'Dev'],            deadline_offset: 7  },
  { id: 'core-loop',           name: '🎮 Core Gameplay Loop',       labels: ['Core Game', 'Art - UI', 'Dev'],       deadline_offset: 7  },
  { id: 'map-saga',            name: '🗺️ Map Saga Visual',          labels: ['Art - Map Saga', 'Art - Icons'],      deadline_offset: 14 },
  { id: 'kong-blocker',        name: '🪵 Kong Blocker System',      labels: ['Research', 'Art - Blocker', 'Dev'],   deadline_offset: 12 },
  { id: 'level-tooling',       name: '🔧 Level Design Tooling',     labels: ['Level Design', 'Dev'],                deadline_offset: 8  },
  { id: 'meta-loop',           name: '⭐ Meta Loop System',         labels: ['Meta Loop', 'Meta', 'Balance'],       deadline_offset: 10 },
];

export const DELIVERABLE_RULES = [
  { id: 'cutscene-scenes',  name: 'Onboarding Cutscene (scenes)',        labels: ['Narrative', 'Cutscene'],            fns: { design: 1, narrative: 1, art: 1, dev: 1, gd: 0 } },
  { id: 'cutscene-quality', name: 'Cutscene quality (pacing/SFX/grade)', labels: ['Cutscene', 'Animation'],            fns: { design: 0, narrative: 1, art: 1, dev: 0, gd: 0 } },
  { id: 'transition',       name: 'Cutscene ↔ In-game transition',       labels: ['Animation', 'Dev', 'Art'],          fns: { design: 0, narrative: 0, art: 1, dev: 1, gd: 0 } },
  { id: 'map-saga',         name: 'Map Saga + Island Icons',              labels: ['Art - Map Saga', 'Art - Icons'],   fns: { design: 0, narrative: 0, art: 1, dev: 0, gd: 1 } },
  { id: 'ui-screens',       name: 'UI Screens (Play/Start/End)',           labels: ['Art - UI', 'Core Game'],           fns: { design: 1, narrative: 0, art: 1, dev: 1, gd: 1 } },
  { id: 'blocker-assets',   name: 'Kong Blocker Assets',                  labels: ['Art - Blocker', 'Research'],       fns: { design: 0, narrative: 0, art: 1, dev: 1, gd: 1 } },
  { id: 'core-spec',        name: 'Core Gameplay Spec',                   labels: ['Core Game', 'Design'],             fns: { design: 1, narrative: 0, art: 0, dev: 1, gd: 1 } },
  { id: 'level-tool',       name: 'Level Design Tool + Data',             labels: ['Level Design', 'Dev'],             fns: { design: 1, narrative: 0, art: 0, dev: 1, gd: 1 } },
  { id: 'meta-spec',        name: 'Meta Loop + Balance Config',           labels: ['Meta Loop', 'Meta', 'Balance'],    fns: { design: 1, narrative: 0, art: 1, dev: 1, gd: 1 } },
];

export const PRIORITY_OPTS = ['High', 'Medium', 'Low'] as const;
export const STATUS_OPTS   = ['Open', 'To Do', 'In Progress', 'Done'] as const;
export const SPRINT_OPTS   = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog'] as const;

export const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  Done:          { bg: '#0D2818', fg: '#3ECF7A', border: '#1A4A2E' },
  'In Progress': { bg: '#2A1800', fg: '#F0A030', border: '#4A2E00' },
  'To Do':       { bg: '#080E20', fg: '#7090C0', border: '#1A2A4A' },
  Open:          { bg: '#0F1118', fg: '#505870', border: '#1E2336' },
};

export const PRIORITY_STYLE: Record<string, { fg: string; icon: string }> = {
  High:   { fg: '#F05050', icon: '🔴' },
  Medium: { fg: '#F0B030', icon: '🟡' },
  Low:    { fg: '#40C080', icon: '🟢' },
};
