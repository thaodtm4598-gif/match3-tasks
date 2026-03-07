import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LABEL_META = {
  "Narrative":     { bg:"#2D1B69", fg:"#B8A9FF", dot:"#7C6CFA" },
  "Cutscene":      { bg:"#3D0A14", fg:"#FFA0B4", dot:"#F06090" },
  "Animation":     { bg:"#042838", fg:"#90DCFF", dot:"#40C0F0" },
  "Art":           { bg:"#062A18", fg:"#7EEFC0", dot:"#3ECF8E" },
  "Art / Effect":  { bg:"#1A2E00", fg:"#BCED70", dot:"#90D050" },
  "Art - Map Saga":{ bg:"#042A1E", fg:"#60EEC0", dot:"#2ED8A0" },
  "Art - Icons":   { bg:"#122000", fg:"#AAEE80", dot:"#80D850" },
  "Art - UI":      { bg:"#022830", fg:"#80E8EC", dot:"#40D0D8" },
  "Art - Blocker": { bg:"#2A1A00", fg:"#FFD090", dot:"#F0A040" },
  "Design":        { bg:"#2A1A00", fg:"#FFD080", dot:"#F0A030" },
  "Core Game":     { bg:"#071A38", fg:"#90C4FF", dot:"#5BA3F5" },
  "Meta Loop":     { bg:"#1E0A38", fg:"#D0A0FF", dot:"#A060F0" },
  "Meta":          { bg:"#1E0A38", fg:"#D0A0FF", dot:"#A060F0" },
  "Balance":       { bg:"#2A0A08", fg:"#FFA090", dot:"#F07060" },
  "Level Design":  { bg:"#012828", fg:"#70ECEC", dot:"#40D8D8" },
  "Research":      { bg:"#282200", fg:"#F0E090", dot:"#E0C040" },
  "Dev":           { bg:"#0A1830", fg:"#A0C0FF", dot:"#7090E0" },
  "Dev+design":    { bg:"#180A30", fg:"#C0B0FF", dot:"#9080D0" },
  "Direction":     { bg:"#2A0800", fg:"#FFA070", dot:"#F07040" },
};

const ALL_LABELS = Object.keys(LABEL_META);

const MEMBERS = [
  "DiepPB","DuyTD4","DuongPQ","LamNQ","ThaoDTM","SangVK","ToanDV2",
  "Tuanna10","CuongDD","KienHV","kienlt3","VinhND","VânNTT","HiềnNT",
];

const WORKFLOW_RULES = [
  { id:"cutscene-onboarding", name:"🎬 Cutscene · Onboarding",  labels:["Narrative","Cutscene"],             deadline_offset:6 },
  { id:"cutscene-quality",    name:"🎨 Cutscene · Quality",     labels:["Narrative","Cutscene","Animation"],  deadline_offset:8 },
  { id:"cutscene-transition", name:"⚡ Transition Cutscene↔Game",labels:["Art","Animation","Dev"],            deadline_offset:7 },
  { id:"core-loop",           name:"🎮 Core Gameplay Loop",     labels:["Core Game","Art - UI","Dev"],        deadline_offset:7 },
  { id:"map-saga",            name:"🗺️ Map Saga Visual",        labels:["Art - Map Saga","Art - Icons"],      deadline_offset:14 },
  { id:"kong-blocker",        name:"🪵 Kong Blocker System",    labels:["Research","Art - Blocker","Dev"],    deadline_offset:12 },
  { id:"level-tooling",       name:"🔧 Level Design Tooling",   labels:["Level Design","Dev"],                deadline_offset:8 },
  { id:"meta-loop",           name:"⭐ Meta Loop System",       labels:["Meta Loop","Meta","Balance"],        deadline_offset:10 },
];

const DELIVERABLE_RULES = [
  { id:"cutscene-scenes",  name:"Onboarding Cutscene (scenes)",       labels:["Narrative","Cutscene"],            fns:{design:1,narrative:1,art:1,dev:1,gd:0} },
  { id:"cutscene-quality", name:"Cutscene quality (pacing/SFX/grade)",labels:["Cutscene","Animation"],            fns:{design:0,narrative:1,art:1,dev:0,gd:0} },
  { id:"transition",       name:"Cutscene ↔ In-game transition",      labels:["Animation","Dev","Art"],           fns:{design:0,narrative:0,art:1,dev:1,gd:0} },
  { id:"map-saga",         name:"Map Saga + Island Icons",             labels:["Art - Map Saga","Art - Icons"],    fns:{design:0,narrative:0,art:1,dev:0,gd:1} },
  { id:"ui-screens",       name:"UI Screens (Play/Start/End)",         labels:["Art - UI","Core Game"],            fns:{design:1,narrative:0,art:1,dev:1,gd:1} },
  { id:"blocker-assets",   name:"Kong Blocker Assets",                 labels:["Art - Blocker","Research"],        fns:{design:0,narrative:0,art:1,dev:1,gd:1} },
  { id:"core-spec",        name:"Core Gameplay Spec",                  labels:["Core Game","Design"],              fns:{design:1,narrative:0,art:0,dev:1,gd:1} },
  { id:"level-tool",       name:"Level Design Tool + Data",            labels:["Level Design","Dev"],              fns:{design:1,narrative:0,art:0,dev:1,gd:1} },
  { id:"meta-spec",        name:"Meta Loop + Balance Config",          labels:["Meta Loop","Meta","Balance"],      fns:{design:1,narrative:0,art:1,dev:1,gd:1} },
];

const PRIORITY_OPTS = ["High","Medium","Low"];
const STATUS_OPTS   = ["Open","To Do","In Progress","Done"];

const STATUS_STYLE = {
  "Done":        { bg:"#0D2818", fg:"#3ECF7A", border:"#1A4A2E" },
  "In Progress": { bg:"#2A1800", fg:"#F0A030", border:"#4A2E00" },
  "To Do":       { bg:"#080E20", fg:"#7090C0", border:"#1A2A4A" },
  "Open":        { bg:"#0F1118", fg:"#505870", border:"#1E2336" },
};

const PRIORITY_STYLE = {
  "High":   { fg:"#F05050", icon:"🔴" },
  "Medium": { fg:"#F0B030", icon:"🟡" },
  "Low":    { fg:"#40C080", icon:"🟢" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function genId() { return "M3-" + String(Math.floor(Math.random()*9000)+1000); }
function today()  { return new Date().toISOString().slice(0,10); }
function fmt(d)   { if (!d) return "—"; return d.replace("2026-",""); }
function daysUntil(dateStr) {
  if (!dateStr || dateStr.includes("day")) return null;
  const diff = (new Date(dateStr) - new Date(today())) / 86400000;
  return Math.round(diff);
}

function inferWorkflow(label) {
  for (const wf of WORKFLOW_RULES) {
    if (wf.labels.includes(label)) return wf.id;
  }
  return null;
}

function inferDeliverables(label) {
  return DELIVERABLE_RULES.filter(d => d.labels.includes(label)).map(d => d.id);
}

function getDeadlineAlerts(tasks) {
  const alerts = [];
  const tod = today();
  tasks.forEach(t => {
    if (t.status === "Done") return;
    const d = daysUntil(t.endDate);
    if (d === null) return;
    if (d < 0) alerts.push({ task: t, type: "overdue", days: Math.abs(d) });
    else if (d === 0) alerts.push({ task: t, type: "today", days: 0 });
    else if (d <= 2) alerts.push({ task: t, type: "soon", days: d });
  });
  return alerts.sort((a,b) => a.days - b.days);
}

// ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
const SEED_TASKS = [
  { id:"M3-001", summary:"Restructure Kịch bản - Thêm đoạn dẫn nhập", label:"Narrative", status:"Open", priority:"Medium", assignee:"DiepPB", startDate:"2026-03-05", endDate:"2026-03-06", sprint:"Sprint 1", note:"" },
  { id:"M3-002", summary:"Restructure Kịch bản (Cutscene)", label:"Cutscene", status:"Open", priority:"Medium", assignee:"DuyTD4", startDate:"2026-03-09", endDate:"2026-03-11", sprint:"Sprint 1", note:"" },
  { id:"M3-003", summary:"Onboarding guiding → Narrative viết chi tiết", label:"Narrative", status:"Open", priority:"High", assignee:"DuongPQ", startDate:"2026-03-05", endDate:"2026-03-05", sprint:"Sprint 1", note:"" },
  { id:"M3-004", summary:"Thêm dialogue kiểm soát nhịp điệu", label:"Narrative", status:"Open", priority:"Medium", assignee:"DiepPB", startDate:"2026-03-05", endDate:"2026-03-09", sprint:"Sprint 1", note:"" },
  { id:"M3-005", summary:"Gen AI ghép thử comic + dialogue", label:"Cutscene", status:"Open", priority:"Medium", assignee:"LamNQ", startDate:"2026-03-09", endDate:"2026-03-11", sprint:"Sprint 1", note:"" },
  { id:"M3-009", summary:"Animation trám transition cutscene → in-game", label:"Animation", status:"To Do", priority:"High", assignee:"DuongPQ", startDate:"2026-03-09", endDate:"2026-03-12", sprint:"Sprint 1", note:"" },
  { id:"M3-022", summary:"Spec core gameplay mechanics", label:"Core Game", status:"To Do", priority:"High", assignee:"SangVK", startDate:"2026-03-09", endDate:"2026-03-09", sprint:"Sprint 1", note:"" },
  { id:"M3-023", summary:"Spec gameplay UI (header, HUD, difficulty)", label:"Core Game", status:"To Do", priority:"High", assignee:"ToanDV2", startDate:"2026-03-06", endDate:"2026-03-09", sprint:"Sprint 1", note:"" },
  { id:"M3-035", summary:"Update 3 thuật toán rơi hạt (Random, Bias, NonPU)", label:"Level Design", status:"Done", priority:"High", assignee:"SangVK", startDate:"2026-03-06", endDate:"2026-03-06", sprint:"Sprint 1", note:"" },
  { id:"M3-040", summary:"Merge codebase: Feeling/Animation", label:"Dev", status:"In Progress", priority:"High", assignee:"kienlt3", startDate:"2026-03-05", endDate:"2026-03-06", sprint:"Sprint 1", note:"" },
  { id:"M3-044", summary:"[ART] Map Saga - Concept 2D full map", label:"Art - Map Saga", status:"To Do", priority:"High", assignee:"VinhND", startDate:"2026-03-11", endDate:"2026-03-13", sprint:"Sprint 2", note:"" },
  { id:"M3-047", summary:"[ART] ICON đảo - Retouch 4 icon đảo đã có", label:"Art - Icons", status:"To Do", priority:"High", assignee:"VânNTT", startDate:"2026-03-06", endDate:"2026-03-09", sprint:"Sprint 1", note:"" },
  { id:"M3-050", summary:"[ART] UI Region - Demo 3 picture vùng Đảo/Saga", label:"Art - UI", status:"To Do", priority:"High", assignee:"HiềnNT", startDate:"2026-03-09", endDate:"2026-03-10", sprint:"Sprint 1", note:"" },
  { id:"M3-054", summary:"[ART] Blocker - Thùng gỗ (6 mẫu)", label:"Art - Blocker", status:"To Do", priority:"Medium", assignee:"VânNTT", startDate:"2026-03-16", endDate:"2026-03-17", sprint:"Sprint 2", note:"" },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function LabelPill({ label, size = "sm" }) {
  const m = LABEL_META[label] || { bg:"#1a1e2a", fg:"#8090b0", dot:"#5060a0" };
  const pad = size === "sm" ? "2px 8px" : "3px 10px";
  const fs  = size === "sm" ? 10 : 11;
  return (
    <span style={{
      background: m.bg, color: m.fg,
      border: `1px solid ${m.dot}44`,
      borderRadius: 4, padding: pad,
      fontSize: fs, fontWeight: 700,
      letterSpacing: ".3px", whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: m.dot, display:"inline-block" }} />
      {label}
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Open"];
  return (
    <span onClick={onClick} style={{
      background: s.bg, color: s.fg,
      border: `1px solid ${s.border}`,
      borderRadius: 4, padding: "2px 8px",
      fontSize: 10, fontWeight: 700,
      cursor: onClick ? "pointer" : "default",
      userSelect: "none", whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

function PriorityDot({ priority }) {
  const p = PRIORITY_STYLE[priority] || PRIORITY_STYLE["Medium"];
  return <span style={{ fontSize: 12 }} title={priority}>{p.icon}</span>;
}

function Avatar({ name }) {
  if (!name) return <span style={{ color:"#3c4260", fontSize:11 }}>—</span>;
  const initials = name.replace(/[^A-Za-zÀ-ỹ]/g,"").slice(0,2).toUpperCase();
  const hue = name.split("").reduce((a,c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span style={{
      width: 24, height: 24, borderRadius: "50%",
      background: `hsl(${hue},45%,25%)`,
      border: `1.5px solid hsl(${hue},55%,40%)`,
      color: `hsl(${hue},70%,70%)`,
      fontSize: 9, fontWeight: 800,
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      flexShrink: 0,
    }} title={name}>{initials}</span>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks]           = useState(SEED_TASKS);
  const [activeTab, setActiveTab]   = useState("backlog");
  const [filterStatus, setFS]       = useState("all");
  const [filterLabel, setFL]        = useState("all");
  const [filterMember, setFM]       = useState("all");
  const [searchQ, setSearch]        = useState("");
  const [showAddModal, setAddModal] = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [showBot, setShowBot]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  // ── persistent storage ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("m3_tasks");
        if (r && r.value) setTasks(JSON.parse(r.value));
      } catch(_) {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (newTasks) => {
    setSaving(true);
    try { await window.storage.set("m3_tasks", JSON.stringify(newTasks)); } catch(_) {}
    setSaving(false);
  }, []);

  const updateTasks = (newTasks) => { setTasks(newTasks); save(newTasks); };

  function showToast(msg, type="success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // ── filter ────────────────────────────────────────────────────────────────
  const visible = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterLabel  !== "all" && t.label  !== filterLabel)  return false;
    if (filterMember !== "all" && t.assignee !== filterMember) return false;
    if (searchQ && !t.summary.toLowerCase().includes(searchQ.toLowerCase()) &&
        !t.id.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  // ── add / edit ─────────────────────────────────────────────────────────────
  function handleSaveTask(data) {
    if (data.id && tasks.find(t => t.id === data.id)) {
      const newT = tasks.map(t => t.id === data.id ? data : t);
      updateTasks(newT);
      showToast(`✓ Updated ${data.id}`);
    } else {
      const newT = [{ ...data, id: genId() }, ...tasks];
      updateTasks(newT);
      showToast(`✓ Added task → auto-routed to ${data.assignee || "team"}`);
    }
    setAddModal(false); setEditTask(null);
  }

  function markDone(id) {
    const newT = tasks.map(t => t.id === id ? { ...t, status:"Done" } : t);
    updateTasks(newT);
    showToast("✓ Task marked as Done!");
  }

  function cycleStatus(id) {
    const task = tasks.find(t => t.id === id);
    const idx  = STATUS_OPTS.indexOf(task.status);
    const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length];
    const newT = tasks.map(t => t.id === id ? { ...t, status: next } : t);
    updateTasks(newT);
  }

  function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    updateTasks(tasks.filter(t => t.id !== id));
    showToast("Task deleted", "error");
  }

  const alerts = getDeadlineAlerts(tasks);

  // ── kpi ───────────────────────────────────────────────────────────────────
  const kpi = {
    total: tasks.length,
    done:  tasks.filter(t=>t.status==="Done").length,
    wip:   tasks.filter(t=>t.status==="In Progress").length,
    todo:  tasks.filter(t=>t.status==="To Do").length,
    alert: alerts.length,
  };

  if (!loaded) return (
    <div style={{ background:"#090b10", color:"#4060a0", display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"monospace", fontSize:14 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ background:"#090b10", color:"#dde3f0", fontFamily:"'DM Sans',system-ui,sans-serif", minHeight:"100vh", display:"flex", flexDirection:"column" }}>

      {/* ── HEADER ── */}
      <header style={{ background:"#0e1220", borderBottom:"1px solid #1a2035", padding:"14px 24px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:800, letterSpacing:"-.3px" }}>
            Match&thinsp;3 <span style={{ color:"#4a90d9" }}>Build 1.2</span>
          </div>
          <div style={{ fontSize:11, color:"#3c4870", marginTop:2 }}>Sprint Mar 2026 · Task Board</div>
        </div>
        {/* KPIs */}
        {[
          { n: kpi.total,  l:"Total",    c:"#7090c0" },
          { n: kpi.done,   l:"Done",     c:"#3ecf7a" },
          { n: kpi.wip,    l:"In Prog",  c:"#f0a030" },
          { n: kpi.todo,   l:"To Do",    c:"#7090c0" },
          { n: kpi.alert,  l:"⚠️ Alerts", c:"#f05060" },
        ].map(k => (
          <div key={k.l} style={{ textAlign:"right" }}>
            <div style={{ fontSize:18, fontWeight:800, color:k.c, fontVariantNumeric:"tabular-nums" }}>{k.n}</div>
            <div style={{ fontSize:9, color:"#3c4870", textTransform:"uppercase", letterSpacing:1 }}>{k.l}</div>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginLeft:8 }}>
          <Btn onClick={() => setShowBot(!showBot)}
            style={{ background: alerts.length > 0 ? "#2a0a0a" : "#0e1220",
              border:`1px solid ${alerts.length > 0 ? "#f0506080" : "#1a2035"}`,
              color: alerts.length > 0 ? "#f05060" : "#506090",
              position:"relative" }}>
            🤖 Bot {alerts.length > 0 && <span style={{ position:"absolute", top:-4, right:-4, background:"#f05060", color:"#fff", borderRadius:"50%", width:14, height:14, fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800 }}>{alerts.length}</span>}
          </Btn>
          <Btn primary onClick={() => setAddModal(true)}>+ Add Task</Btn>
        </div>
      </header>

      {/* ── TABS ── */}
      <div style={{ background:"#0e1220", borderBottom:"1px solid #1a2035", padding:"0 24px", display:"flex", gap:0 }}>
        {[["backlog","📋 Backlog"],["assignee","👤 By Assignee"],["workflow","🔗 Workflows"],["deliverables","📦 Deliverables"]].map(([id,label]) => (
          <Tab key={id} active={activeTab===id} onClick={()=>setActiveTab(id)}>{label}</Tab>
        ))}
        {saving && <span style={{ marginLeft:"auto", alignSelf:"center", fontSize:10, color:"#3c4870" }}>saving…</span>}
      </div>

      {/* ── FILTER BAR ── */}
      {(activeTab === "backlog" || activeTab === "assignee") && (
        <div style={{ background:"#0b0d14", borderBottom:"1px solid #141828", padding:"10px 24px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <input value={searchQ} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search tasks…"
            style={{ background:"#0e1220", border:"1px solid #1a2035", borderRadius:6, padding:"5px 10px", color:"#dde3f0", fontSize:11, width:160, outline:"none" }} />
          <FSelect value={filterStatus} onChange={setFS} opts={["all",...STATUS_OPTS]} label="Status" />
          <FSelect value={filterLabel}  onChange={setFL} opts={["all",...ALL_LABELS]} label="Label" />
          <FSelect value={filterMember} onChange={setFM} opts={["all",...MEMBERS]} label="Assignee" />
          {(filterStatus!=="all"||filterLabel!=="all"||filterMember!=="all"||searchQ) && (
            <Btn onClick={()=>{setFS("all");setFL("all");setFM("all");setSearch("")}} style={{ fontSize:10, padding:"3px 8px", color:"#506090" }}>✕ Clear</Btn>
          )}
          <span style={{ marginLeft:"auto", fontSize:10, color:"#3c4870" }}>{visible.length} tasks</span>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ flex:1, overflow:"auto", padding:"20px 24px" }}>
        {activeTab === "backlog"      && <BacklogView tasks={visible} onEdit={t=>{setEditTask(t);setAddModal(true)}} onCycle={cycleStatus} onDone={markDone} onDelete={deleteTask} />}
        {activeTab === "assignee"     && <AssigneeView tasks={visible} onCycle={cycleStatus} onDone={markDone} />}
        {activeTab === "workflow"     && <WorkflowView tasks={tasks} />}
        {activeTab === "deliverables" && <DeliverablesView tasks={tasks} />}
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      {showAddModal && (
        <TaskModal
          initial={editTask}
          onSave={handleSaveTask}
          onClose={()=>{setAddModal(false);setEditTask(null)}}
        />
      )}

      {/* ── BOT PANEL ── */}
      {showBot && <BotPanel alerts={alerts} tasks={tasks} onClose={()=>setShowBot(false)} />}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24,
          background: toast.type==="error" ? "#2a0808" : "#082a18",
          border:`1px solid ${toast.type==="error" ? "#f05060" : "#3ecf7a"}`,
          color: toast.type==="error" ? "#f07070" : "#3ecf7a",
          borderRadius:8, padding:"10px 18px", fontSize:12, fontWeight:600,
          zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.5)",
          animation:"slideIn .2s ease",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ─── BACKLOG VIEW ─────────────────────────────────────────────────────────────
function BacklogView({ tasks, onEdit, onCycle, onDone, onDelete }) {
  return (
    <div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Key","Summary","Label","Status","Priority","Assignee","Start","Due","Sprint","Workflow","✓"].map(h => (
              <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontSize:9, textTransform:"uppercase", letterSpacing:1, color:"#3c4870", whiteSpace:"nowrap", fontWeight:700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => {
            const d = daysUntil(t.endDate);
            const overdue = d !== null && d < 0 && t.status !== "Done";
            const dueToday = d === 0 && t.status !== "Done";
            const rowBg = t.status === "Done" ? "#0a0d12" : i%2===0 ? "transparent" : "#0b0e15";
            return (
              <tr key={t.id} style={{ background: rowBg, borderBottom:"1px solid #12162000",
                opacity: t.status==="Done" ? .5 : 1,
                transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#0e1828"}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <td style={{ padding:"7px 10px", color:"#4a80c0", fontWeight:700, fontSize:11, whiteSpace:"nowrap" }}>
                  <button onClick={()=>onEdit(t)} style={{ background:"none", border:"none", color:"#4a80c0", cursor:"pointer", fontWeight:700, fontSize:11, padding:0 }}>{t.id}</button>
                </td>
                <td style={{ padding:"7px 10px", maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={t.summary}>
                  {t.summary}
                  {t.note && <span style={{ marginLeft:6, color:"#3c4870", fontSize:10 }}>📝</span>}
                </td>
                <td style={{ padding:"7px 8px" }}><LabelPill label={t.label} /></td>
                <td style={{ padding:"7px 8px" }}><StatusBadge status={t.status} onClick={()=>onCycle(t.id)} /></td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}><PriorityDot priority={t.priority} /></td>
                <td style={{ padding:"7px 8px" }}><Avatar name={t.assignee} /></td>
                <td style={{ padding:"7px 8px", color:"#3c5070", fontSize:10, whiteSpace:"nowrap" }}>{fmt(t.startDate)}</td>
                <td style={{ padding:"7px 8px", whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:10, color: overdue?"#f05060":dueToday?"#f0a030":"#3c5070", fontWeight: (overdue||dueToday)?700:400 }}>
                    {fmt(t.endDate)}
                    {overdue && " ⚠️"}
                    {dueToday && " 🔔"}
                  </span>
                </td>
                <td style={{ padding:"7px 8px", color:"#2a3a5a", fontSize:10 }}>{t.sprint}</td>
                <td style={{ padding:"7px 8px" }}>
                  {inferWorkflow(t.label) && (
                    <span style={{ fontSize:9, color:"#3a6090", background:"#0a1828", border:"1px solid #1a3050", borderRadius:3, padding:"1px 5px" }}>
                      {WORKFLOW_RULES.find(w=>w.id===inferWorkflow(t.label))?.name.split(" ").slice(0,2).join(" ") || ""}
                    </span>
                  )}
                </td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>
                  {t.status !== "Done"
                    ? <button onClick={()=>onDone(t.id)} title="Mark Done"
                        style={{ background:"none", border:"1px solid #1a3a20", borderRadius:4, color:"#2a6040", cursor:"pointer", padding:"2px 6px", fontSize:11 }}>✓</button>
                    : <span style={{ color:"#2a6040", fontSize:14 }}>✓</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && <EmptyState msg="No tasks match the current filters." />}
    </div>
  );
}

// ─── ASSIGNEE VIEW ────────────────────────────────────────────────────────────
function AssigneeView({ tasks, onCycle, onDone }) {
  const grouped = {};
  tasks.forEach(t => {
    const key = t.assignee || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
      {Object.entries(grouped).sort().map(([person, ptasks]) => {
        const done = ptasks.filter(t=>t.status==="Done").length;
        const pct  = Math.round(done/ptasks.length*100);
        const hue  = person.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
        return (
          <div key={person} style={{ background:"#0e1220", border:"1px solid #1a2035", borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", background:`hsl(${hue},30%,8%)`, borderBottom:"1px solid #1a2035", display:"flex", alignItems:"center", gap:10 }}>
              <Avatar name={person} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{person}</div>
                <div style={{ fontSize:10, color:"#3c5070" }}>{ptasks.length} tasks · {done} done</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:800, color:`hsl(${hue},60%,55%)` }}>{pct}%</div>
              </div>
            </div>
            {/* progress bar */}
            <div style={{ height:3, background:"#0a0d14" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:`hsl(${hue},60%,45%)`, transition:"width .3s" }} />
            </div>
            <div style={{ padding:8 }}>
              {ptasks.map(t => {
                const d = daysUntil(t.endDate);
                const urgent = d !== null && d <= 1 && t.status !== "Done";
                return (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:6, marginBottom:2, background: urgent ? "#1a0a0a" : "transparent", border:`1px solid ${urgent ? "#f0506030":"transparent"}` }}>
                    <PriorityDot priority={t.priority} />
                    <div style={{ flex:1, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity: t.status==="Done"?.5:1 }}>{t.summary}</div>
                    <span style={{ fontSize:10, color: d!==null&&d<0?"#f05060":d===0?"#f0a030":"#2a3a5a", whiteSpace:"nowrap" }}>{fmt(t.endDate)}</span>
                    <StatusBadge status={t.status} onClick={()=>onCycle(t.id)} />
                    {t.status!=="Done" && <button onClick={()=>onDone(t.id)} style={{ background:"none", border:"1px solid #1a3a20", borderRadius:3, color:"#2a6040", cursor:"pointer", padding:"1px 5px", fontSize:10 }}>✓</button>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WORKFLOW VIEW ────────────────────────────────────────────────────────────
function WorkflowView({ tasks }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {WORKFLOW_RULES.map(wf => {
        const wfTasks = tasks.filter(t => inferWorkflow(t.label) === wf.id);
        if (wfTasks.length === 0) return null;
        const done = wfTasks.filter(t=>t.status==="Done").length;
        const pct  = Math.round(done/wfTasks.length*100);
        const roleGroups = {};
        wf.labels.forEach(l => { roleGroups[l] = wfTasks.filter(t=>t.label===l); });

        return (
          <div key={wf.id} style={{ background:"#0e1220", border:"1px solid #1a2035", borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", background:"#0a0e1a", borderBottom:"1px solid #1a2035", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800 }}>{wf.name}</div>
                <div style={{ fontSize:10, color:"#3c5070", marginTop:2 }}>
                  {wfTasks.length} tasks · {done} done · {pct}% complete
                </div>
              </div>
              <div style={{ height:6, width:120, background:"#0a0d14", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:"#3ecf7a", transition:"width .3s" }} />
              </div>
              <span style={{ fontSize:13, fontWeight:800, color:"#3ecf7a" }}>{pct}%</span>
            </div>

            <div style={{ display:"flex", overflowX:"auto", padding:"16px 20px", gap:0 }}>
              {wf.labels.map((l, li) => {
                const ltasks = tasks.filter(t => t.label === l && inferWorkflow(t.label) === wf.id);
                if (ltasks.length === 0) return null;
                const m = LABEL_META[l] || {};
                return (
                  <div key={l} style={{ display:"flex", alignItems:"stretch", gap:0 }}>
                    {li > 0 && <div style={{ display:"flex", alignItems:"center", padding:"0 12px", color:"#2a3a5a", fontSize:20 }}>→</div>}
                    <div style={{ minWidth:220, maxWidth:280, flex:1 }}>
                      <div style={{ background: m.bg||"#1a2035", border:`1px solid ${m.dot||"#2a3a5a"}44`, borderRadius:8, overflow:"hidden" }}>
                        <div style={{ padding:"8px 12px", borderBottom:`1px solid ${m.dot||"#2a3a5a"}33` }}>
                          <LabelPill label={l} />
                        </div>
                        <div style={{ padding:8, display:"flex", flexDirection:"column", gap:6 }}>
                          {ltasks.map(t => (
                            <div key={t.id} style={{ background:"#090b12", border:"1px solid #141828", borderRadius:6, padding:"8px 10px" }}>
                              <div style={{ fontSize:11, marginBottom:5, lineHeight:1.4 }}>{t.summary}</div>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                                  <Avatar name={t.assignee} />
                                  <span style={{ fontSize:9, color:"#2a3a5a" }}>{fmt(t.endDate)}</span>
                                </div>
                                <StatusBadge status={t.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DELIVERABLES VIEW ────────────────────────────────────────────────────────
function DeliverablesView({ tasks }) {
  const FNS = [
    { key:"design",    label:"Design",     color:"#f0a030" },
    { key:"narrative", label:"Narrative",  color:"#9080f0" },
    { key:"art",       label:"Art",        color:"#3ecf7a" },
    { key:"dev",       label:"Dev",        color:"#5ba3f5" },
    { key:"gd",        label:"Game Design",color:"#40c0f0" },
  ];

  const delivProgress = DELIVERABLE_RULES.map(d => {
    const related = tasks.filter(t => d.labels.includes(t.label));
    const done    = related.filter(t => t.status === "Done").length;
    const pct     = related.length > 0 ? Math.round(done/related.length*100) : 0;
    return { ...d, related, done, pct };
  });

  const cats = [...new Set(DELIVERABLE_RULES.map(d => {
    if (d.labels.some(l=>["Narrative","Cutscene","Animation"].includes(l))) return "Cutscene & Story";
    if (d.labels.some(l=>l.startsWith("Art"))) return "Art Assets";
    if (d.labels.some(l=>["Core Game","Dev"].includes(l)&&!d.labels.includes("Level Design"))) return "Gameplay";
    if (d.labels.some(l=>l==="Level Design")) return "Level Design";
    return "Meta / Balance";
  }))];

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
        <thead>
          <tr style={{ borderBottom:"2px solid #1a2035" }}>
            <th style={{ ...thStyle, width:36 }}>#</th>
            <th style={{ ...thStyle, textAlign:"left" }}>Deliverable</th>
            <th style={{ ...thStyle }}>Progress</th>
            {FNS.map(f => (
              <th key={f.key} style={{ ...thStyle, color:f.color }}>{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {delivProgress.map((d, i) => {
            const color = d.pct===100 ? "#3ecf7a" : d.pct > 0 ? "#f0a030" : "#506090";
            return (
              <tr key={d.id} style={{ borderBottom:"1px solid #141828" }}
                onMouseEnter={e=>e.currentTarget.style.background="#0e1828"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"8px 10px", color:"#2a3a5a", fontSize:10, textAlign:"center", fontFamily:"monospace" }}>{String(i+1).padStart(2,"0")}</td>
                <td style={{ padding:"8px 10px" }}>
                  <div style={{ fontWeight:600, fontSize:12 }}>{d.name}</div>
                  <div style={{ fontSize:10, color:"#3c5070", marginTop:2 }}>{d.done}/{d.related.length} tasks done</div>
                </td>
                <td style={{ padding:"8px 10px", textAlign:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                    <div style={{ width:60, height:6, background:"#0a0d14", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${d.pct}%`, background:color, transition:"width .3s" }} />
                    </div>
                    <span style={{ fontSize:10, color, fontWeight:700, fontVariantNumeric:"tabular-nums", width:30 }}>{d.pct}%</span>
                  </div>
                </td>
                {FNS.map(f => (
                  <td key={f.key} style={{ padding:"8px 10px", textAlign:"center" }}>
                    {d.fns[f.key]
                      ? <span style={{ color:f.color, fontSize:14, fontWeight:800 }}>✓</span>
                      : <span style={{ color:"#1a2035", fontSize:14 }}>·</span>
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding:"8px 10px", fontSize:9, textTransform:"uppercase", letterSpacing:1.2, color:"#3c4870", fontWeight:700, textAlign:"center", whiteSpace:"nowrap" };

// ─── BOT PANEL ────────────────────────────────────────────────────────────────
function BotPanel({ alerts, tasks, onClose }) {
  return (
    <div style={{ position:"fixed", right:0, top:0, bottom:0, width:340, background:"#0a0d14", borderLeft:"1px solid #1a2035", display:"flex", flexDirection:"column", zIndex:200, boxShadow:"-8px 0 30px rgba(0,0,0,.5)" }}>
      <div style={{ padding:"16px 18px", borderBottom:"1px solid #1a2035", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:18 }}>🤖</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800 }}>Reminder Bot</div>
          <div style={{ fontSize:10, color:"#3c5070" }}>{new Date().toLocaleDateString("vi-VN")}</div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#3c5070", cursor:"pointer", fontSize:16 }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:12 }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign:"center", color:"#2a3a5a", padding:"40px 20px" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#3c5070" }}>Tất cả task đều on track!</div>
            <div style={{ fontSize:11, color:"#2a3a5a", marginTop:6 }}>Không có deadline cần nhắc hôm nay.</div>
          </div>
        ) : (
          <>
            {alerts.filter(a=>a.type==="overdue").length > 0 && (
              <BotSection title="🚨 Overdue" color="#f05060" bg="#1a0808">
                {alerts.filter(a=>a.type==="overdue").map(a => <BotCard key={a.task.id} alert={a} />)}
              </BotSection>
            )}
            {alerts.filter(a=>a.type==="today").length > 0 && (
              <BotSection title="🔔 Due Today" color="#f0a030" bg="#1a0f00">
                {alerts.filter(a=>a.type==="today").map(a => <BotCard key={a.task.id} alert={a} />)}
              </BotSection>
            )}
            {alerts.filter(a=>a.type==="soon").length > 0 && (
              <BotSection title="⚡ Due Soon (≤2 days)" color="#f0d040" bg="#181400">
                {alerts.filter(a=>a.type==="soon").map(a => <BotCard key={a.task.id} alert={a} />)}
              </BotSection>
            )}
          </>
        )}

        {/* Summary today */}
        <div style={{ marginTop:16, background:"#0e1220", border:"1px solid #1a2035", borderRadius:8, padding:"12px 14px" }}>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:8, color:"#5070a0" }}>📊 Today's Summary</div>
          {[
            { label:"Total tasks",    val: tasks.length,                                color:"#5070a0" },
            { label:"Done",           val: tasks.filter(t=>t.status==="Done").length,   color:"#3ecf7a" },
            { label:"In Progress",    val: tasks.filter(t=>t.status==="In Progress").length, color:"#f0a030" },
            { label:"Overdue",        val: alerts.filter(a=>a.type==="overdue").length, color:"#f05060" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #141828" }}>
              <span style={{ fontSize:11, color:"#3c5070" }}>{r.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BotSection({ title, color, bg, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color, background:bg, borderRadius:6, padding:"5px 10px", marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
}

function BotCard({ alert: a }) {
  const { task: t, type, days } = a;
  const label = type==="overdue" ? `${days}d overdue` : type==="today" ? "Due today!" : `Due in ${days}d`;
  const color = type==="overdue" ? "#f05060" : type==="today" ? "#f0a030" : "#f0d040";
  return (
    <div style={{ background:"#090b12", border:"1px solid #141828", borderRadius:6, padding:"8px 10px", marginBottom:6 }}>
      <div style={{ fontSize:10, color:"#3c5070", marginBottom:3 }}>{t.id}</div>
      <div style={{ fontSize:11, marginBottom:5 }}>{t.summary}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <Avatar name={t.assignee} />
          <LabelPill label={t.label} />
        </div>
        <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
      </div>
    </div>
  );
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────
function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    summary:"", label:"Core Game", status:"To Do", priority:"Medium",
    assignee:"", startDate:"", endDate:"", sprint:"Sprint 1", note:"",
  });

  const wf   = inferWorkflow(form.label);
  const wfName = wf ? WORKFLOW_RULES.find(w=>w.id===wf)?.name : null;
  const delivs = inferDeliverables(form.label);

  const set = (k,v) => setForm(p => ({...p, [k]:v}));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }} onClick={onClose}>
      <div style={{ background:"#0e1220", border:"1px solid #1a2035", borderRadius:12, padding:"24px", width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.7)" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800 }}>{initial?.id ? `Edit ${initial.id}` : "Add New Task"}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#506090", cursor:"pointer", fontSize:18 }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="Summary *">
            <input value={form.summary} onChange={e=>set("summary",e.target.value)}
              placeholder="Describe the task…"
              style={inputStyle} />
          </Field>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Label / Epic">
              <select value={form.label} onChange={e=>set("label",e.target.value)} style={inputStyle}>
                {ALL_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Assignee">
              <select value={form.assignee} onChange={e=>set("assignee",e.target.value)} style={inputStyle}>
                <option value="">— Select —</option>
                {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e=>set("status",e.target.value)} style={inputStyle}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={inputStyle}>
                {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Due Date">
              <input type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Sprint">
              <select value={form.sprint} onChange={e=>set("sprint",e.target.value)} style={inputStyle}>
                {["Sprint 1","Sprint 2","Sprint 3","Backlog"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Note">
            <input value={form.note} onChange={e=>set("note",e.target.value)}
              placeholder="Optional note / blocker…" style={inputStyle} />
          </Field>

          {/* ── Auto-route preview ── */}
          {(wfName || delivs.length > 0) && (
            <div style={{ background:"#07101a", border:"1px solid #0f2a3a", borderRadius:8, padding:"12px 14px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#4a90c0", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>⚡ Auto-routing preview</div>
              {wfName && (
                <div style={{ marginBottom:6 }}>
                  <span style={{ fontSize:10, color:"#3c5070" }}>Workflow chain: </span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#5ba3f5" }}>{wfName}</span>
                </div>
              )}
              {delivs.length > 0 && (
                <div>
                  <span style={{ fontSize:10, color:"#3c5070" }}>Linked deliverables: </span>
                  <div style={{ marginTop:4, display:"flex", flexWrap:"wrap", gap:4 }}>
                    {delivs.map(did => {
                      const d = DELIVERABLE_RULES.find(x=>x.id===did);
                      return d ? <span key={did} style={{ fontSize:9, background:"#0a1828", border:"1px solid #1a3050", borderRadius:3, padding:"2px 6px", color:"#5070a0" }}>{d.name}</span> : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn primary onClick={() => { if (!form.summary.trim()) return alert("Summary is required"); onSave(form); }}>
              {initial?.id ? "Save Changes" : "Add Task →"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Tab({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"10px 18px", background:"none", border:"none",
      borderBottom:`2px solid ${active?"#4a90d9":"transparent"}`,
      color: active ? "#4a90d9" : "#3c5070",
      fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer",
      transition:"all .15s", whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function Btn({ children, onClick, primary, style }) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 14px", borderRadius:6, cursor:"pointer",
      fontFamily:"inherit", fontSize:12, fontWeight:700,
      background: primary ? "#1a4a8a" : "#0e1220",
      border: `1px solid ${primary ? "#2a6acc" : "#1a2035"}`,
      color: primary ? "#80b8f8" : "#506090",
      transition:"all .15s",
      position:"relative",
      ...style,
    }}>{children}</button>
  );
}

function FSelect({ value, onChange, opts, label }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{
      background:"#0e1220", border:"1px solid #1a2035", borderRadius:6,
      padding:"5px 10px", color: value!=="all" ? "#dde3f0" : "#506090",
      fontSize:11, fontFamily:"inherit", outline:"none",
    }}>
      <option value="all">All {label}</option>
      {opts.filter(o=>o!=="all").map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:10, color:"#3c5070", fontWeight:700, textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>{label}</div>
      {children}
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"#2a3a5a" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
      <div style={{ fontSize:13 }}>{msg}</div>
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"#090b12", border:"1px solid #1a2035",
  borderRadius:6, padding:"7px 10px", color:"#dde3f0", fontSize:12,
  fontFamily:"inherit", outline:"none",
};
