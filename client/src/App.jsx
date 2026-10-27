import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleHelp, Clock3, CloudSun, Heart, LayoutDashboard, Leaf,
  LogOut, Menu, MessageCircle, Moon, MoreHorizontal, Plus, Search, Settings2, ShieldCheck,
  Smile, Sparkles, Target, TrendingUp, X
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import api, { getErrorMessage } from "./api.js";
import AuthScreen from "./AuthScreen.jsx";

const MOODS = [
  { name: "Happy", emoji: "😊", color: "#f4c95d", tint: "#fff7d9", message: "A little joy goes a long way." },
  { name: "Excited", emoji: "🤩", color: "#f39b62", tint: "#fff0e5", message: "Hold on to that good energy." },
  { name: "Calm", emoji: "😌", color: "#65c8ac", tint: "#e5f8f1", message: "You deserve this moment of peace." },
  { name: "Neutral", emoji: "😐", color: "#91a4bf", tint: "#edf2f8", message: "It's okay to simply be." },
  { name: "Sad", emoji: "😔", color: "#7c9ce5", tint: "#eaf0ff", message: "Give yourself some extra kindness." },
  { name: "Anxious", emoji: "😰", color: "#a18ae5", tint: "#f1ebff", message: "Take a breath. One thing at a time." },
  { name: "Angry", emoji: "😠", color: "#ed8585", tint: "#fff0ef", message: "Pause, breathe, and make space." }
];

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.name, m]));
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "history", label: "Mood history", icon: CalendarDays },
  { id: "insights", label: "Insights", icon: TrendingUp }
];

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function dateLabel(value, options = { month: "short", day: "numeric" }) {
  return new Date(value).toLocaleDateString("en-US", options);
}
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return dateLabel(value);
}

function Dashboard({ user, onLogout }) {
  const [active, setActive] = useState("overview");
  const [moods, setMoods] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState("checking");
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [filter, setFilter] = useState("All moods");
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  const notify = useCallback((type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3600);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [moodResponse, analyticsResponse, healthResponse] = await Promise.all([
        api.get("/moods?limit=100"),
        api.get("/analytics/weekly"),
        api.get("/health")
      ]);
      setMoods(moodResponse.data.moods || []);
      setAnalytics(analyticsResponse.data);
      setApiStatus(healthResponse.data.database === "connected" ? "connected" : "disconnected");
    } catch (error) {
      setApiStatus("disconnected");
      notify("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayMood = useMemo(() => {
    const now = new Date();
    return moods.find((entry) => {
      const date = new Date(entry.createdAt);
      return date.toDateString() === now.toDateString();
    });
  }, [moods]);

  const averageIntensity = analytics?.averageIntensity || 0;
  const filteredMoods = useMemo(() => moods.filter((entry) => {
    const moodMatches = filter === "All moods" || entry.mood === filter;
    const query = search.trim().toLowerCase();
    const textMatches = !query || `${entry.mood} ${entry.note} ${(entry.tags || []).join(" ")}`.toLowerCase().includes(query);
    return moodMatches && textMatches;
  }), [moods, filter, search]);

  async function saveMood(event) {
    event.preventDefault();
    if (!selectedMood) {
      notify("error", "Choose the mood that feels closest to you.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/moods", {
        mood: selectedMood,
        intensity,
        note: note.trim(),
        tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean)
      });
      setModalOpen(false);
      setSelectedMood("");
      setIntensity(3);
      setNote("");
      setTagsText("");
      notify("success", "Your mood has been saved. Thanks for checking in!");
      await loadData();
    } catch (error) {
      notify("error", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMood(id) {
    if (!window.confirm("Delete this mood entry? This can't be undone.")) return;
    try {
      await api.delete(`/moods/${id}`);
      setMoods((current) => current.filter((entry) => entry._id !== id));
      notify("success", "Mood entry deleted.");
      const result = await api.get("/analytics/weekly");
      setAnalytics(result.data);
    } catch (error) {
      notify("error", getErrorMessage(error));
    }
  }

  function handleLogoutClick() {
    if (window.confirm("Log out of your space?")) onLogout();
  }

  const currentMood = todayMood ? MOOD_MAP[todayMood.mood] : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Leaf size={22} strokeWidth={2.4} /></div>
          <div><span className="brand-name">moodly<span className="brand-dot">.</span></span><span className="brand-caption">YOUR WELLNESS SPACE</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => { setActive(id); setMobileNav(false); }}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{id === "history" && <span className="nav-count">{moods.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-prompt">
          <div className="prompt-art"><CloudSun size={28} /><Sparkles size={15} className="prompt-sparkle" /></div>
          <h3>A gentle reminder</h3>
          <p>You don't have to feel your best to be doing your best.</p>
          <div className="prompt-line"><span /></div>
          <span className="prompt-footer">A LITTLE KINDNESS, DAILY</span>
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={16} /><span>Your feelings matter.<br /><b>Handle them with care.</b></span></div>
          <div className="profile-row">
            <div className="avatar">{(user?.name || "Y").charAt(0).toUpperCase()}</div>
            <div className="profile-copy"><b>{user?.name || "Your space"}</b><span>{user?.email || "Personal dashboard"}</span></div>
            <button className="icon-button logout-icon" onClick={handleLogoutClick} title="Log out" aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="breadcrumb">Your space <ChevronRight size={14} /> <b>{NAV.find((item) => item.id === active)?.label || "Overview"}</b></div>
          <div className="topbar-right">
            <div className={`connection-pill ${apiStatus}`}><span className="status-dot" />{apiStatus === "connected" ? "Synced with MongoDB" : apiStatus === "checking" ? "Connecting..." : "Database offline"}</div>
            <div className="top-date"><CalendarDays size={15} /> {dateLabel(new Date(), { month: "short", day: "numeric", year: "numeric" })}</div>
            <button className="logout-button" onClick={handleLogoutClick}><LogOut size={15} /> Log out</button>
          </div>
        </header>

        <div className="page-content">
          {active === "overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> {todayLabel().toUpperCase()}</div>
                  <h1>Make space for <span>yourself.</span></h1>
                  <p className="page-subtitle">A little check-in can make a big difference. How are you, really?</p>
                </div>
                <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> Log today's mood</button>
              </section>

              <section className="hero-card">
                <div className="hero-copy">
                  <div className="hero-kicker"><Sparkles size={14} /> YOUR DAILY CHECK-IN</div>
                  <h2>{todayMood ? "You've shown up for yourself today." : "How's your heart today?"}</h2>
                  <p>{todayMood ? `You checked in feeling ${todayMood.mood.toLowerCase()}. Keep giving yourself the space you deserve.` : "There is no right or wrong way to feel. Take a breath, tune in, and choose what feels right."}</p>
                  <button className="hero-button" onClick={() => setModalOpen(true)}>{todayMood ? "Update your check-in" : "Check in with yourself"} <ChevronRight size={17} /></button>
                  <div className="hero-decoration hero-decoration-one" /><div className="hero-decoration hero-decoration-two" />
                </div>
                <div className="hero-illustration" aria-hidden="true">
                  <div className="sun-halo" /><div className="sun-core"><Smile size={47} strokeWidth={1.4} /></div>
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <span className="float-star star-one">✳</span><span className="float-star star-two">✦</span><span className="float-star star-three">·</span>
                  <div className="float-pill pill-one"><span>✦</span> be kind to you</div>
                  <div className="float-pill pill-two"><Heart size={13} fill="currentColor" /> one day at a time</div>
                </div>
              </section>

              <section className="section-block">
                <div className="section-heading"><div><h2>Find your feeling</h2><p>Every emotion has a place here.</p></div><button className="text-button" onClick={() => setModalOpen(true)}>Log a mood <ChevronRight size={15} /></button></div>
                <div className="mood-grid">
                  {MOODS.map((mood) => (
                    <button key={mood.name} className="mood-tile" style={{ "--mood-color": mood.color, "--mood-tint": mood.tint }} onClick={() => { setSelectedMood(mood.name); setModalOpen(true); }}>
                      <span className="mood-emoji">{mood.emoji}</span><b>{mood.name}</b><span className="mood-tile-arrow"><ChevronRight size={15} /></span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="stats-grid">
                <StatCard icon={Activity} label="Total check-ins" value={moods.length} detail="Every check-in counts" tint="lavender" />
                <StatCard icon={Target} label="Average intensity" value={averageIntensity ? `${averageIntensity}/5` : "—"} detail="Across the last 7 days" tint="mint" />
                <StatCard icon={Heart} label="Most felt mood" value={analytics?.topMood || "—"} detail="Your most common feeling" tint="peach" />
                <StatCard icon={Sparkles} label="This week's entries" value={analytics?.totalEntries || 0} detail="Small steps, meaningful growth" tint="blue" />
              </section>

              <section className="bottom-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading"><div><h2>Your week, in feelings</h2><p>A softer look at your emotional rhythm.</p></div><span className="panel-icon"><TrendingUp size={18} /></span></div>
                  <div className="chart-legend"><span className="legend-dot" /> Average mood intensity <span className="legend-period">LAST 7 DAYS</span></div>
                  <MoodChart data={analytics?.days || []} />
                </div>
                <div className="panel recent-panel">
                  <div className="panel-heading"><div><h2>Recent check-ins</h2><p>Your feelings, captured along the way.</p></div><button className="round-link" onClick={() => setActive("history")} aria-label="View all history"><ChevronRight size={18} /></button></div>
                  {moods.length ? <div className="recent-list">{moods.slice(0, 4).map((entry) => <MoodRow key={entry._id} entry={entry} onDelete={deleteMood} />)}</div> : <EmptyState onAdd={() => setModalOpen(true)} />}
                  {moods.length > 0 && <button className="view-all-button" onClick={() => setActive("history")}>View all entries <ArrowUpRight size={15} /></button>}
                </div>
              </section>
              <footer className="page-footer"><span>Made with <Heart size={12} fill="currentColor" /> for your wellbeing.</span><span>Progress, not perfection.</span></footer>
            </>
          )}

          {active === "history" && (
            <>
              <section className="welcome-row compact-welcome"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR JOURNEY</div><h1>Your feelings, <span>over time.</span></h1><p className="page-subtitle">Every entry is a little more understanding of yourself.</p></div><button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> Add an entry</button></section>
              <section className="panel history-panel">
                <div className="history-toolbar"><div><h2>Mood history</h2><p>{filteredMoods.length} {filteredMoods.length === 1 ? "entry" : "entries"} found</p></div><div className="history-controls"><label className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." /></label><label className="select-wrap"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All moods</option>{MOODS.map((m) => <option key={m.name}>{m.name}</option>)}</select><ChevronDown size={15} /></label></div></div>
                {filteredMoods.length ? <div className="history-list">{filteredMoods.map((entry) => <MoodRow key={entry._id} entry={entry} onDelete={deleteMood} expanded />)}</div> : <EmptyState onAdd={() => setModalOpen(true)} />}
              </section>
              <footer className="page-footer"><span>Made with <Heart size={12} fill="currentColor" /> for your wellbeing.</span><span>Progress, not perfection.</span></footer>
            </>
          )}

          {active === "insights" && (
            <>
              <section className="welcome-row compact-welcome"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PATTERNS</div><h1>Little things, <span>revealed.</span></h1><p className="page-subtitle">Notice the patterns. Celebrate the progress. Be gentle with yourself.</p></div><div className="insight-badge"><Sparkles size={17} /> Your weekly snapshot</div></section>
              <section className="stats-grid insight-stats"><StatCard icon={Activity} label="Entries this week" value={analytics?.totalEntries || 0} detail="Your consistency matters" tint="lavender" /><StatCard icon={Target} label="Average intensity" value={averageIntensity ? `${averageIntensity}/5` : "—"} detail="Self-reported intensity" tint="mint" /><StatCard icon={Heart} label="Most common mood" value={analytics?.topMood || "—"} detail="Based on your check-ins" tint="peach" /><StatCard icon={CalendarDays} label="All-time check-ins" value={moods.length} detail="Your journey so far" tint="blue" /></section>
              <section className="panel insight-chart-panel"><div className="panel-heading"><div><h2>Your emotional rhythm</h2><p>Daily average intensity for the last seven days.</p></div><span className="panel-icon"><TrendingUp size={18} /></span></div><MoodChart data={analytics?.days || []} large /></section>
              <section className="panel mood-breakdown"><div className="panel-heading"><div><h2>Your mood mix</h2><p>How often each feeling showed up this week.</p></div></div>{Object.keys(analytics?.moodCounts || {}).length ? Object.entries(analytics.moodCounts).sort((a,b) => b[1]-a[1]).map(([name,count]) => <div className="breakdown-row" key={name}><span className="breakdown-emoji">{MOOD_MAP[name]?.emoji}</span><span className="breakdown-name">{name}</span><div className="breakdown-track"><span style={{ width: `${count / Math.max(...Object.values(analytics.moodCounts)) * 100}%`, background: MOOD_MAP[name]?.color }} /></div><b>{count}</b></div>) : <p className="empty-inline">Log a few moods to see your personal patterns here.</p>}</section>
              <footer className="page-footer"><span>Made with <Heart size={12} fill="currentColor" /> for your wellbeing.</span><span>Patterns are information, not labels.</span></footer>
            </>
          )}
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}><form className="mood-modal" onSubmit={saveMood}>
        <div className="modal-top"><div><span className="eyebrow"><span className="eyebrow-line" /> DAILY CHECK-IN</span><h2>What's the feeling?</h2><p>Take a breath. There's no wrong answer.</p></div><button type="button" className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={20} /></button></div>
        <div className="modal-moods">{MOODS.map((m) => <button type="button" key={m.name} className={`modal-mood ${selectedMood === m.name ? "selected" : ""}`} style={{ "--mood-color": m.color, "--mood-tint": m.tint }} onClick={() => setSelectedMood(m.name)}><span>{m.emoji}</span><b>{m.name}</b>{selectedMood === m.name && <Check size={14} />}</button>)}</div>
        {selectedMood && <div className="selected-message"><span>{MOOD_MAP[selectedMood].emoji}</span>{MOOD_MAP[selectedMood].message}</div>}
        <div className="field-group"><div className="field-label"><label>How intense is it?</label><span className="intensity-value">{intensity} <span>/ 5</span></span></div><input className="intensity-slider" type="range" min="1" max="5" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} style={{ "--range-progress": `${(intensity - 1) * 25}%` }} /><div className="range-labels"><span>A little</span><span>A lot</span></div></div>
        <div className="field-group"><label className="field-label" htmlFor="note">Anything on your mind? <span className="optional-label">OPTIONAL</span></label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Write a thought, a moment, or anything you want to remember..." rows={3} /></div>
        <div className="field-group"><label className="field-label" htmlFor="tags">Add a few tags <span className="optional-label">OPTIONAL</span></label><input id="tags" className="text-input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="studies, friends, family (comma separated)" /></div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : <><Check size={17} /> Save my mood</>}</button></div>
        <p className="modal-privacy"><ShieldCheck size={13} /> Your check-in is saved to your project database.</p>
      </form></div>}

      {notice && <div className={`toast toast-${notice.type}`} role="status">{notice.type === "success" ? <Check size={18} /> : <CircleHelp size={18} />}<span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
      {loading && <div className="loading-bar" />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, tint }) {
  return <article className={`stat-card tint-${tint}`}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div><div className="stat-value">{value}</div><div className="stat-detail"><span className="detail-dot" />{detail}</div></article>;
}

function MoodChart({ data, large = false }) {
  const chartData = data.map((day) => ({ ...day, averageIntensity: Number(day.averageIntensity) || 0 }));
  return <div className={`chart-wrap ${large ? "chart-large" : ""}`}>{chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9075f5" stopOpacity={0.22} /><stop offset="95%" stopColor="#9075f5" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="#efedf6" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9894aa", fontSize: 11 }} dy={10} /><YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} axisLine={false} tickLine={false} tick={{ fill: "#9894aa", fontSize: 11 }} /><Tooltip contentStyle={{ border: "1px solid #efedf6", borderRadius: 12, boxShadow: "0 8px 24px #28204b12", fontSize: 12 }} formatter={(value, name) => [value ? `${value}/5` : "No check-in", "Average intensity"]} labelFormatter={(label) => ` ${label}`} /><Area type="monotone" dataKey="averageIntensity" stroke="#9075f5" strokeWidth={2.5} fill="url(#moodGradient)" activeDot={{ r: 5, fill: "#9075f5", stroke: "#fff", strokeWidth: 2 }} dot={{ r: 3, fill: "#fff", stroke: "#9075f5", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer> : <div className="chart-empty"><Activity size={24} /><span>Your weekly mood trend will appear here.</span></div>}</div>;
}

function MoodRow({ entry, onDelete, expanded = false }) {
  const mood = MOOD_MAP[entry.mood] || MOOD_MAP.Neutral;
  return <article className={`mood-row ${expanded ? "mood-row-expanded" : ""}`}>
    <div className="row-emoji" style={{ background: mood.tint }}>{mood.emoji}</div>
    <div className="row-main"><div className="row-title"><b>{entry.mood}</b><span className="row-time">{relativeTime(entry.createdAt)}</span></div>
      {entry.note ? <p className="row-note">{entry.note}</p> : <p className="row-note muted-note">No note added</p>}
      {entry.tags?.length > 0 && <div className="tag-list">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
      {expanded && <div className="row-meta"><span><CalendarDays size={13} /> {dateLabel(entry.createdAt, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span><span><Activity size={13} /> Intensity {entry.intensity}/5</span></div>}
    </div>
    <div className="row-side"><span className="intensity-dots" aria-label={`Intensity ${entry.intensity} out of 5`}>{[1,2,3,4,5].map((n) => <i key={n} className={n <= entry.intensity ? "filled" : ""} style={n <= entry.intensity ? { background: mood.color } : {}} />)}</span><button className="delete-entry" onClick={() => onDelete(entry._id)} title="Delete entry" aria-label="Delete mood entry"><X size={15} /></button></div>
  </article>;
}

function EmptyState({ onAdd }) {
  return <div className="empty-state"><div className="empty-illustration"><Moon size={28} /><Sparkles size={15} /></div><h3>Your story starts here</h3><p>Your mood entries will show up here. Take a moment to check in with yourself.</p><button className="secondary-button" onClick={onAdd}><Plus size={16} /> Add your first mood</button></div>;
}

function App() {
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem("flexi_token"),
    user: JSON.parse(localStorage.getItem("flexi_user") || "null")
  }));
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem("flexi_token")));

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("flexi_token");
    if (!token) { setCheckingSession(false); return; }
    api.get("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        localStorage.setItem("flexi_user", JSON.stringify(data.user));
        setSession({ token, user: data.user });
      })
      .catch(() => {
        localStorage.removeItem("flexi_token");
        localStorage.removeItem("flexi_user");
        if (active) setSession({ token: null, user: null });
      })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  function handleAuthenticated(data) {
    localStorage.setItem("flexi_token", data.token);
    localStorage.setItem("flexi_user", JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
  }

  function handleLogout() {
    localStorage.removeItem("flexi_token");
    localStorage.removeItem("flexi_user");
    setSession({ token: null, user: null });
  }

  if (checkingSession) return <div className="auth-loading"><div className="auth-spinner" /><p>Getting your space ready…</p></div>;
  if (!session.token || !session.user) return <AuthScreen onAuthenticated={handleAuthenticated} />;
  return <Dashboard user={session.user} onLogout={handleLogout} />;
}

export default App;
