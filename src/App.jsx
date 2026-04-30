import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "tax_tracker_v1";
const GROSS = 150000;
const TAX_RATE = 0.276;
const STANDARD_DEDUCTIONS = 36077;

const CATEGORIES = [
  { id: "home_office",    label: "Home Office",              icon: "🏠", color: "#E8C547" },
  { id: "internet_phone", label: "Internet & Phone",         icon: "📡", color: "#5B8EE6" },
  { id: "software",       label: "Software & Subscriptions", icon: "💻", color: "#7ED9A0" },
  { id: "equipment",      label: "Equipment",                icon: "🖥️", color: "#E87B5B" },
  { id: "education",      label: "Education & Dev",          icon: "📚", color: "#B87BE8" },
  { id: "travel",         label: "Travel & Mileage",         icon: "🚗", color: "#5BD9D9" },
  { id: "meals",          label: "Business Meals (50%)",     icon: "🍽️", color: "#E85B8E" },
  { id: "other",          label: "Other",                    icon: "📋", color: "#E8A05B" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS = [
  { label: "Q1", months: [0,1,2], due: "Apr 15" },
  { label: "Q2", months: [3,4,5], due: "Jun 16" },
  { label: "Q3", months: [6,7,8], due: "Sep 15" },
  { label: "Q4", months: [9,10,11], due: "Jan 15, 2027" },
];

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

function loadData() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "log", label: "Log", icon: "✏️" },
    { id: "summary", label: "Summary", icon: "📊" },
    { id: "tax", label: "Tax", icon: "💰" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(14,14,15,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", display: "flex", paddingBottom: "var(--safe-bottom)", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, border: "none", background: "none", padding: "12px 8px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: tab === t.id ? 1 : 0.45 }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: tab === t.id ? "var(--gold)" : "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.label}</span>
          {tab === t.id && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", marginTop: 1 }} />}
        </button>
      ))}
    </nav>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 16px", ...style }}>{children}</div>;
}

function SectionLabel({ children, color = "var(--gold)" }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.18em", color, textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 12 }}>{children}</div>;
}

function StatRow({ label, value, valueColor = "var(--text)", sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1E1E20" }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: valueColor, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function LogTab({ expenses, setExpenses }) {
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState(now.getMonth());
  const [form, setForm] = useState({ category: "software", description: "", amount: "" });
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  const monthKey = (m) => `2026-${String(m + 1).padStart(2, "0")}`;
  const monthExpenses = expenses[monthKey(activeMonth)] || [];
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const add = () => {
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) return;
    const key = monthKey(activeMonth);
    const entry = { id: Date.now(), ...form, amount: amt, ts: Date.now() };
    const updated = { ...expenses, [key]: [...(expenses[key] || []), entry] };
    setExpenses(updated);
    saveData(updated);
    setForm(f => ({ ...f, description: "", amount: "" }));
    setAdding(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const remove = (id) => {
    const key = monthKey(activeMonth);
    const updated = { ...expenses, [key]: expenses[key].filter(e => e.id !== id) };
    setExpenses(updated);
    saveData(updated);
  };

  return (
    <div className="fade-up" style={{ paddingBottom: 90 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.1, marginBottom: 4 }}>Expense Log</div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>2026 · Tyler, TX</div>
      </div>
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "16px 16px 4px", scrollbarWidth: "none" }}>
        {MONTHS.map((m, i) => {
          const hasData = (expenses[monthKey(i)] || []).length > 0;
          const active = activeMonth === i;
          return (
            <button key={m} onClick={() => setActiveMonth(i)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${active ? "var(--gold)" : hasData ? "var(--border)" : "#1E1E1E"}`, background: active ? "var(--gold)" : hasData ? "var(--surface)" : "transparent", color: active ? "#0E0E0F" : hasData ? "var(--text)" : "var(--dim)", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer", position: "relative" }}>
              {m}
              {hasData && !active && <span style={{ position: "absolute", top: 3, right: 5, width: 4, height: 4, background: "var(--gold)", borderRadius: "50%" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {monthTotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{MONTH_FULL[activeMonth]} Total</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--gold)", fontWeight: 500 }}>{fmt(monthTotal)}</div>
              <div style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--font-mono)" }}>saves ~{fmt(monthTotal * TAX_RATE)}</div>
            </div>
          </div>
        )}
        {!adding ? (
          <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px dashed var(--border)", background: "transparent", color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: 13, cursor: "pointer", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>+</span> ADD EXPENSE
          </button>
        ) : (
          <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionLabel>New Expense — {MONTHS[activeMonth]}</SectionLabel>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "11px 12px", fontSize: 14, width: "100%" }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input placeholder="Description (e.g. Adobe Creative Cloud)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "11px 14px", fontSize: 14, width: "100%" }} />
            <input placeholder="Amount (e.g. 54.99)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" inputMode="decimal" style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--gold)", padding: "11px 14px", fontSize: 16, fontFamily: "var(--font-mono)", width: "100%" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={add} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "var(--gold)", color: "#0E0E0F", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>SAVE</button>
            </div>
          </Card>
        )}
        {saved && <div style={{ textAlign: "center", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 12 }}>✓ Saved to your device</div>}
        {monthExpenses.length === 0 && !adding ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--dim)", fontStyle: "italic", fontSize: 14 }}>No expenses logged for {MONTHS[activeMonth]} yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...monthExpenses].reverse().map(e => {
              const cat = getCat(e.category);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: cat.color + "18", border: `1px solid ${cat.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{cat.label}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--green)", fontWeight: 500 }}>{fmtD(e.amount)}</div>
                    <button onClick={() => remove(e.id)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 8px" }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTab({ expenses }) {
  const allEntries = useMemo(() => Object.values(expenses).flat(), [expenses]);
  const yearTotal = allEntries.reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => {
    const t = {};
    allEntries.forEach(e => { t[e.category] = (t[e.category] || 0) + e.amount; });
    return t;
  }, [allEntries]);
  const monthKey = (m) => `2026-${String(m + 1).padStart(2, "0")}`;

  return (
    <div className="fade-up" style={{ padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.1, marginBottom: 4 }}>Summary</div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Fiscal Year 2026</div>
      </div>
      <Card style={{ background: "linear-gradient(135deg, #1A1E14, #141A1A)", border: "1px solid #7ED9A033" }}>
        <SectionLabel color="var(--green)">Total Deductions Logged</SectionLabel>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 42, color: "var(--gold)", lineHeight: 1 }}>{fmt(yearTotal)}</div>
        <div style={{ fontSize: 13, color: "var(--green)", marginTop: 6, fontFamily: "var(--font-mono)" }}>Est. tax savings: {fmt(yearTotal * TAX_RATE)}</div>
      </Card>
      <Card>
        <SectionLabel>By Category</SectionLabel>
        {CATEGORIES.map(cat => {
          const total = byCategory[cat.id] || 0;
          const pct = yearTotal > 0 ? (total / yearTotal) * 100 : 0;
          return (
            <div key={cat.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13 }}>{cat.icon} {cat.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: total > 0 ? cat.color : "var(--dim)" }}>{fmt(total)}</span>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 4, height: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </Card>
      <Card>
        <SectionLabel>Quarterly Breakdown</SectionLabel>
        {QUARTERS.map(q => {
          const qTotal = q.months.reduce((s, m) => s + (expenses[monthKey(m)] || []).reduce((a, e) => a + e.amount, 0), 0);
          return (
            <div key={q.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1E1E20" }}>
              <div>
                <div style={{ fontSize: 14 }}>{q.label} — {q.months.map(m => MONTHS[m]).join(", ")}</div>
                <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Due {q.due}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--gold)" }}>{fmt(qTotal)}</div>
                <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)" }}>~{fmt(qTotal * TAX_RATE)} saved</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function TaxTab({ expenses }) {
  const allEntries = useMemo(() => Object.values(expenses).flat(), [expenses]);
  const logged = allEntries.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = STANDARD_DEDUCTIONS + logged;
  const taxableIncome = Math.max(0, GROSS - totalDeductions);
  const federalTax = taxableIncome * 0.179;
  const seTax = 21194;
  const totalTax = federalTax + seTax;
  const monthlySet = totalTax / 12;
  const nextPayment = totalTax / 4;

  return (
    <div className="fade-up" style={{ padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.1, marginBottom: 4 }}>Tax Estimate</div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Updates as you log expenses</div>
      </div>
      <Card style={{ background: "linear-gradient(135deg, #1A1A2E, #0E1A1A)", border: "1px solid var(--gold)33" }}>
        <SectionLabel>Set Aside Monthly</SectionLabel>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 48, color: "var(--gold)", lineHeight: 1 }}>{fmt(monthlySet)}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Transfer this to savings on the 1st of each month</div>
      </Card>
      <Card>
        <SectionLabel>Income & Deductions</SectionLabel>
        <StatRow label="Gross Annual Income" value={fmt(GROSS)} />
        <StatRow label="Standard Deductions" value={`-${fmt(STANDARD_DEDUCTIONS)}`} valueColor="var(--red)" sub="SE tax + home office + fixed expenses" />
        <StatRow label="Additional Logged" value={`-${fmt(logged)}`} valueColor="var(--red)" sub="From your expense log" />
        <StatRow label="Taxable Income" value={fmt(taxableIncome)} valueColor="var(--gold)" />
      </Card>
      <Card>
        <SectionLabel>Tax Breakdown</SectionLabel>
        <StatRow label="Federal Income Tax" value={fmt(federalTax)} sub="~17.9% effective rate" />
        <StatRow label="Self-Employment Tax" value={fmt(seTax)} sub="15.3% (SS + Medicare)" />
        <StatRow label="Texas State Tax" value="$0" valueColor="var(--green)" sub="No state income tax 🤠" />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Total Tax Liability</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--red)", fontWeight: 600 }}>{fmt(totalTax)}</span>
        </div>
      </Card>
      <Card>
        <SectionLabel>Quarterly Payments</SectionLabel>
        {QUARTERS.map(q => <StatRow key={q.label} label={`${q.label} — Due ${q.due}`} value={fmt(nextPayment)} />)}
        <div style={{ marginTop: 12, padding: "12px", background: "var(--surface2)", borderRadius: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          💡 Next payment due <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>June 16, 2026</span>. Pay at <span style={{ color: "var(--blue)" }}>irs.gov/payments</span>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("log");
  const [expenses, setExpenses] = useState(() => loadData());
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      {tab === "log"     && <LogTab     expenses={expenses} setExpenses={setExpenses} />}
      {tab === "summary" && <SummaryTab expenses={expenses} />}
      {tab === "tax"     && <TaxTab     expenses={expenses} />}
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}
