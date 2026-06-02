import { useState, useEffect, useRef } from "react";

// ─── DESIGN ───────────────────────────────────────────────────────────────────
const C = {
  bg:       "#0a0c10",
  surface:  "#111318",
  card:     "#161a22",
  border:   "#1e2330",
  blue:     "#3b82f6",
  blueD:    "#1d4ed8",
  teal:     "#14b8a6",
  gold:     "#f59e0b",
  green:    "#10b981",
  red:      "#ef4444",
  text:     "#f1f5f9",
  muted:    "#64748b",
  soft:     "#94a3b8",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');`;

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
function getSB() {
  const url = localStorage.getItem("sb_url");
  const key = localStorage.getItem("sb_key");
  const token = localStorage.getItem("sb_token");
  if (!url || !key) return null;
  const hdrs = { "apikey": key, "Authorization": `Bearer ${token||key}`, "Content-Type": "application/json", "Prefer": "return=representation" };
  const base = (t) => `${url}/rest/v1/${t}`;
  return {
    async select(table, q="*", extra="") {
      const r = await fetch(`${base(table)}?select=${q}&order=data.desc${extra}`, { headers: hdrs });
      return r.ok ? await r.json() : [];
    },
    async insert(table, row) {
      const r = await fetch(base(table), { method:"POST", headers: hdrs, body: JSON.stringify(row) });
      return r.ok ? await r.json() : null;
    },
    async update(table, row, id) {
      const r = await fetch(`${base(table)}?id=eq.${id}`, { method:"PATCH", headers: hdrs, body: JSON.stringify(row) });
      return r.ok;
    },
    async del(table, id) {
      const r = await fetch(`${base(table)}?id=eq.${id}`, { method:"DELETE", headers: hdrs });
      return r.ok;
    }
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const brl = (v) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(v||0);
const TODAY = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const IS = {
  width:"100%", background:"#0a0c10", border:"1px solid #1e2330",
  borderRadius:8, color:"#f1f5f9", padding:"10px 13px",
  fontSize:14, fontFamily:"'IBM Plex Sans',sans-serif", outline:"none", boxSizing:"border-box"
};

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────────────────────
const LS_KEY = "plantoes_data";
function loadLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } }
function saveLocal(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

// ─── BANK INFO STORAGE ────────────────────────────────────────────────────────
const BANK_KEY = "plantoes_bank";
function loadBank() { try { return JSON.parse(localStorage.getItem(BANK_KEY)) || { banco:"", agencia:"", conta:"", pix:"" }; } catch { return { banco:"", agencia:"", conta:"", pix:"" }; } }
function saveBank(d) { localStorage.setItem(BANK_KEY, JSON.stringify(d)); }

// ─── TIPOS ────────────────────────────────────────────────────────────────────
const TIPOS = [
  { id:"plantao",     label:"Plantão",     icon:"🏥", color: C.blue },
  { id:"ambulatorio", label:"Ambulatório", icon:"🩺", color: C.teal },
];

// ─── FORM ─────────────────────────────────────────────────────────────────────
const PlantaoForm = ({ initial, onSave, onClose }) => {
  const blank = { data: fmt(TODAY), tipo:"plantao", local:"", valor:"", obs:"" };
  const [form, setForm] = useState(initial ? { ...initial, valor: String(initial.valor) } : blank);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = () => {
    if (!form.data || !form.local.trim() || !form.valor) return;
    const valor = parseFloat(String(form.valor).replace(",","."));
    if (isNaN(valor)) return;
    onSave({ ...form, id: initial?.id || ("pl_"+Date.now()), valor });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:28, width:"100%", maxWidth:440 }}>
        <div style={{ fontSize:20, fontFamily:"'Playfair Display',serif", color:C.text, marginBottom:22 }}>
          {initial ? "Editar lançamento" : "Novo lançamento"}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Tipo */}
          <div style={{ display:"flex", gap:8 }}>
            {TIPOS.map(t => (
              <button key={t.id} onClick={()=>sf("tipo",t.id)} style={{
                flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13,
                fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:500,
                background: form.tipo===t.id ? t.color+"22" : "transparent",
                color: form.tipo===t.id ? t.color : C.muted,
                outline: form.tipo===t.id ? `1.5px solid ${t.color}` : `1px solid ${C.border}`,
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Data</div>
            <input type="date" style={IS} value={form.data} onChange={e=>sf("data",e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Local / Hospital</div>
            <input style={IS} placeholder="Ex: UPA Centro, Hospital São Lucas..." value={form.local} onChange={e=>sf("local",e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Valor (R$)</div>
            <input style={IS} placeholder="0,00" value={form.valor} onChange={e=>sf("valor",e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Observações</div>
            <input style={IS} placeholder="Opcional..." value={form.obs} onChange={e=>sf("obs",e.target.value)} />
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={handleSave} style={{ flex:1, background:C.blue, color:"#fff", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:600, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer" }}>
            Salvar
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 18px", fontSize:14, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── BANK SETTINGS ────────────────────────────────────────────────────────────
const BankSettings = ({ onClose }) => {
  const [bank, setBank] = useState(loadBank());
  const sb = (k,v) => setBank(b=>({...b,[k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:28, width:"100%", maxWidth:420 }}>
        <div style={{ fontSize:20, fontFamily:"'Playfair Display',serif", color:C.text, marginBottom:6 }}>Dados Bancários</div>
        <div style={{ fontSize:13, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif", marginBottom:22 }}>Aparecem no rodapé do PDF exportado</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[["banco","Banco"],["agencia","Agência"],["conta","Conta"],["pix","PIX"]].map(([k,l])=>(
            <div key={k}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>{l}</div>
              <input style={IS} value={bank[k]} onChange={e=>sb(k,e.target.value)} placeholder={l} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={()=>{ saveBank(bank); onClose(); }} style={{ flex:1, background:C.blue, color:"#fff", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:600, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer" }}>Salvar</button>
          <button onClick={onClose} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 18px", fontSize:14, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
function generatePDF(plantoes, month, year) {
  const bank = loadBank();
  const parseD = (s) => { try { const [y,m,d]=String(s).split("T")[0].split("-").map(Number); return new Date(y,m-1,d); } catch { return new Date(); } };
  const monthPlantoes = plantoes.filter(p => {
    try { const d=parseD(p.data); return d.getMonth()===month && d.getFullYear()===year; } catch { return false; }
  }).sort((a,b) => String(a.data).localeCompare(String(b.data)));

  const totalPlantao = monthPlantoes.filter(p=>p.tipo==="plantao").reduce((s,p)=>s+p.valor,0);
  const totalAmb = monthPlantoes.filter(p=>p.tipo==="ambulatorio").reduce((s,p)=>s+p.valor,0);
  const total = totalPlantao + totalAmb;

  const fmt_brl = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
  const fmt_date = (s) => { try { const [y,m,d]=String(s).split("T")[0].split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}); } catch { return String(s); } };

  const rows = monthPlantoes.map(p => `
    <tr>
      <td>${fmt_date(p.data)}</td>
      <td><span class="badge ${p.tipo}">${p.tipo === "plantao" ? "🏥 Plantão" : "🩺 Ambulatório"}</span></td>
      <td>${p.local}</td>
      <td class="valor">${fmt_brl(p.valor)}</td>
      <td>${p.obs||""}</td>
    </tr>`).join("");

  const bankInfo = bank.pix || bank.conta ? `
    <div class="bank-section">
      <div class="bank-title">Dados para Pagamento</div>
      <div class="bank-grid">
        ${bank.banco ? `<div><span class="bank-label">Banco:</span> ${bank.banco}</div>` : ""}
        ${bank.agencia ? `<div><span class="bank-label">Agência:</span> ${bank.agencia}</div>` : ""}
        ${bank.conta ? `<div><span class="bank-label">Conta:</span> ${bank.conta}</div>` : ""}
        ${bank.pix ? `<div class="pix"><span class="bank-label">PIX:</span> ${bank.pix}</div>` : ""}
      </div>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'IBM Plex Sans',sans-serif; color:#1a1a2e; background:#fff; padding:40px; max-width:800px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #1a1a2e; }
  .title { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#1a1a2e; line-height:1.2; }
  .subtitle { font-size:13px; color:#64748b; margin-top:4px; }
  .period { text-align:right; }
  .period-label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px; }
  .period-value { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:#1a1a2e; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { background:#1a1a2e; color:#fff; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:500; }
  td { padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; }
  tr:hover td { background:#f8fafc; }
  .badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:500; }
  .badge.plantao { background:#dbeafe; color:#1d4ed8; }
  .badge.ambulatorio { background:#ccfbf1; color:#0d9488; }
  .valor { font-weight:600; color:#1a1a2e; }
  .totals { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px; }
  .total-card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:center; }
  .total-card.main { background:#1a1a2e; color:#fff; }
  .total-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:6px; }
  .total-card.main .total-label { color:#94a3b8; }
  .total-value { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:#1a1a2e; }
  .total-card.main .total-value { color:#fff; }
  .total-card.plantao .total-value { color:#1d4ed8; }
  .total-card.amb .total-value { color:#0d9488; }
  .bank-section { border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-top:24px; }
  .bank-title { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:12px; }
  .bank-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px; }
  .bank-label { font-weight:600; color:#1a1a2e; }
  .pix { grid-column:1/-1; font-size:14px; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Plantões<br>Dr. Rodrigo Fontanezzi</div>
      <div class="subtitle">CRM 97684-9 · RQE 32466 · Ortopedia e Traumatologia</div>
    </div>
    <div class="period">
      <div class="period-label">Período</div>
      <div class="period-value">${MONTHS[month]} ${year}</div>
    </div>
  </div>

  <div class="totals">
    <div class="total-card plantao">
      <div class="total-label">🏥 Plantões</div>
      <div class="total-value">${fmt_brl(totalPlantao)}</div>
    </div>
    <div class="total-card amb">
      <div class="total-label">🩺 Ambulatório</div>
      <div class="total-value">${fmt_brl(totalAmb)}</div>
    </div>
    <div class="total-card main">
      <div class="total-label">Total do Mês</div>
      <div class="total-value">${fmt_brl(total)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Tipo</th>
        <th>Local / Hospital</th>
        <th>Valor</th>
        <th>Obs.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${bankInfo}

  <div class="footer">
    Documento gerado em ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})} · ${monthPlantoes.length} lançamento${monthPlantoes.length!==1?"s":""}
  </div>
</body>
</html>`;

  return html;
}

function shareViaWhatsApp(html, month, year) {
  // Open in new tab for printing/saving, then WhatsApp
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
  // WhatsApp share
  const text = `Plantões Dr. Rodrigo Fontanezzi — ${MONTHS[month]} ${year}`;
  setTimeout(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, 1000);
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
const Calendar = ({ plantoes, month, year, onDayClick }) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const getDay = (d) => {
    if (!d) return [];
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return plantoes.filter(p => String(p.data).split("T")[0] === ds);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      {/* Weekday headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:C.surface }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ padding:"10px 0", textAlign:"center", fontSize:11, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>{w}</div>
        ))}
      </div>
      {/* Days */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:C.border }}>
        {cells.map((d, i) => {
          const items = getDay(d);
          const hasPlantao = items.some(p=>p.tipo==="plantao");
          const hasAmb = items.some(p=>p.tipo==="ambulatorio");
          const isToday = d && new Date(year,month,d).toDateString()===TODAY.toDateString();
          return (
            <div key={i} onClick={()=>d&&onDayClick(d)} style={{
              background: C.card, minHeight:64, padding:"6px 8px", cursor:d?"pointer":"default",
              position:"relative", transition:"background .15s",
            }}
            onMouseEnter={e=>{ if(d) e.currentTarget.style.background="#1e2a3a"; }}
            onMouseLeave={e=>{ if(d) e.currentTarget.style.background=C.card; }}>
              {d && <>
                <div style={{
                  width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  background: isToday ? C.blue : "transparent",
                  fontSize:12, fontFamily:"'IBM Plex Sans',sans-serif",
                  color: isToday ? "#fff" : C.soft, fontWeight: isToday ? 600 : 400,
                }}>{d}</div>
                <div style={{ marginTop:2, display:"flex", flexDirection:"column", gap:2 }}>
                  {hasPlantao && <div style={{ fontSize:9, background:C.blue+"33", color:C.blue, borderRadius:3, padding:"1px 4px", fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:500 }}>🏥 Plantão</div>}
                  {hasAmb && <div style={{ fontSize:9, background:C.teal+"33", color:C.teal, borderRadius:3, padding:"1px 4px", fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:500 }}>🩺 Amb.</div>}
                </div>
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.blue, color:"#fff", borderRadius:10, padding:"12px 22px", fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif", zIndex:999, boxShadow:"0 4px 20px #0006", whiteSpace:"nowrap" }}>{msg}</div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [plantoes, setPlantoes]   = useState([]);
  const [month, setMonth]         = useState(TODAY.getMonth());
  const [year, setYear]           = useState(TODAY.getFullYear());
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [showBank, setShowBank]   = useState(false);
  const [prefillDate, setPrefill] = useState(null);
  const [toast, setToast]         = useState("");
  const [tab, setTab]             = useState("lista"); // lista | calendario

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  // Load from Supabase or localStorage
  useEffect(() => {
    const sb = getSB();
    if (sb) {
      sb.select("plantoes","*").then(data => {
        if (data?.length) setPlantoes(data);
        else setPlantoes(loadLocal());
      }).catch(() => setPlantoes(loadLocal()));
    } else {
      setPlantoes(loadLocal());
    }
  }, []);

  const save = async (item) => {
    const next = editItem
      ? plantoes.map(p => p.id===item.id ? item : p)
      : [item, ...plantoes];
    setPlantoes(next);
    saveLocal(next);
    const sb = getSB();
    if (sb) {
      if (editItem) await sb.update("plantoes", item, item.id);
      else await sb.insert("plantoes", item);
    }
    setShowForm(false); setEditItem(null); setPrefill(null);
    showToast("✅ Lançamento salvo!");
  };

  const del = async (id) => {
    if (!window.confirm("Excluir este lançamento?")) return;
    const next = plantoes.filter(p=>p.id!==id);
    setPlantoes(next); saveLocal(next);
    const sb = getSB(); if (sb) await sb.del("plantoes", id);
    showToast("Removido");
  };

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // Filter for current month
  const parseDate = (data) => {
    const s = String(data || "").split("T")[0];
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  };

  const filtered = plantoes.filter(p => {
    try {
      const d = parseDate(p.data);
      return d.getMonth()===month && d.getFullYear()===year;
    } catch { return false; }
  }).sort((a,b) => String(a.data).localeCompare(String(b.data)));

  const totalPlantao = filtered.filter(p=>p.tipo==="plantao").reduce((s,p)=>s+p.valor,0);
  const totalAmb     = filtered.filter(p=>p.tipo==="ambulatorio").reduce((s,p)=>s+p.valor,0);
  const total        = totalPlantao + totalAmb;

  const onDayClick = (d) => {
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    setPrefill(ds); setEditItem(null); setShowForm(true);
  };

  const handleExport = () => {
    const html = generatePDF(plantoes, month, year);
    shareViaWhatsApp(html, month, year);
  };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg}; font-family:'IBM Plex Sans',sans-serif;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5);}
        select option{background:${C.card};color:${C.text};}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${C.surface};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
      `}</style>

      {showForm && <PlantaoForm initial={editItem || (prefillDate ? { data:prefillDate } : null)} onSave={save} onClose={()=>{setShowForm(false);setEditItem(null);setPrefill(null);}} />}
      {showBank && <BankSettings onClose={()=>setShowBank(false)} />}
      {toast && <Toast msg={toast} />}

      <div style={{ minHeight:"100vh", background:C.bg, paddingBottom:32 }}>
        {/* Header */}
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ maxWidth:680, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif", letterSpacing:2, textTransform:"uppercase" }}>Dr. Rodrigo Fontanezzi</div>
              <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", color:C.text, fontWeight:700, lineHeight:1.1 }}>Controle de Plantões</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowBank(true)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, padding:"8px 12px", fontSize:12, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer" }}>
                🏦 Banco
              </button>
              <button onClick={handleExport} style={{ background:C.green, color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:600, fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                📤 PDF / WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px" }}>
          {/* Month navigator */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <button onClick={prevMonth} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.soft, borderRadius:8, padding:"8px 14px", fontSize:16, cursor:"pointer" }}>‹</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", color:C.text, fontWeight:600 }}>{MONTHS[month]}</div>
              <div style={{ fontSize:13, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif" }}>{year}</div>
            </div>
            <button onClick={nextMonth} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.soft, borderRadius:8, padding:"8px 14px", fontSize:16, cursor:"pointer" }}>›</button>
          </div>

          {/* Totais */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            {[
              ["🏥 Plantões", totalPlantao, C.blue],
              ["🩺 Ambulatório", totalAmb, C.teal],
              ["Total", total, C.gold],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:18, fontFamily:"'Playfair Display',serif", fontWeight:700, color }}>{brl(val)}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2, fontFamily:"'IBM Plex Sans',sans-serif" }}>
                  {label==="Total" ? `${filtered.length} lanç.` : `${filtered.filter(p=>p.tipo===(label.includes("Plantão")?"plantao":"ambulatorio")).length} lanç.`}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:16, background:C.card, borderRadius:10, padding:4, border:`1px solid ${C.border}` }}>
            {[["lista","📋 Lista"],["calendario","📅 Calendário"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer",
                background: tab===id ? C.blue : "transparent",
                color: tab===id ? "#fff" : C.muted,
                fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:tab===id?600:400,
              }}>{label}</button>
            ))}
          </div>

          {/* Lista */}
          {tab==="lista" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.length===0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"40px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🏥</div>
                  <div style={{ fontSize:15, color:C.soft, fontFamily:"'IBM Plex Sans',sans-serif", marginBottom:4 }}>Nenhum lançamento em {MONTHS[month]}</div>
                  <div style={{ fontSize:13, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif" }}>Toque em + para adicionar</div>
                </div>
              )}
              {filtered.map(p => {
                const tipo = TIPOS.find(t=>t.id===p.tipo);
                const d = (() => { try { const s=String(p.data).split("T")[0]; const [y,m,dd]=s.split("-").map(Number); return new Date(y,m-1,dd); } catch { return new Date(); } })();
                return (
                  <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:tipo.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                      {tipo.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, color:C.text, fontFamily:"'IBM Plex Sans',sans-serif", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.local}</div>
                      <div style={{ display:"flex", gap:8, marginTop:3, alignItems:"center" }}>
                        <span style={{ fontSize:11, background:tipo.color+"22", color:tipo.color, borderRadius:4, padding:"1px 7px", fontFamily:"'IBM Plex Sans',sans-serif" }}>{tipo.label}</span>
                        <span style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif" }}>{d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
                        {p.obs && <span style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Sans',sans-serif" }}>· {p.obs}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                      <div style={{ fontSize:16, fontFamily:"'Playfair Display',serif", fontWeight:600, color:tipo.color }}>{brl(p.valor)}</div>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={()=>{setEditItem(p);setShowForm(true);}} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:"2px 4px" }}>✏️</button>
                        <button onClick={()=>del(p.id)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:"2px 4px" }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendário */}
          {tab==="calendario" && (
            <Calendar plantoes={plantoes} month={month} year={year} onDayClick={onDayClick} />
          )}
        </div>

        {/* FAB */}
        <button onClick={()=>{setEditItem(null);setPrefill(null);setShowForm(true);}} style={{
          position:"fixed", bottom:24, right:20, width:56, height:56, borderRadius:"50%",
          background:C.blue, color:"#fff", border:"none", fontSize:26, cursor:"pointer",
          boxShadow:"0 4px 20px "+C.blue+"66", display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:100,
        }}>+</button>
      </div>
    </>
  );
}
