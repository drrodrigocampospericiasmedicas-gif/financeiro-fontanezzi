import { useState, useEffect, useRef } from "react";

// ─── PDF.JS LOADER ────────────────────────────────────────────────────────────
async function extractPDFText(base64) {
  // Load pdf.js from CDN if not already loaded
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  // Convert base64 to Uint8Array
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Load and extract text from all pages
  const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:        "#f4f6f9",
  surface:   "#ffffff",
  card:      "#ffffff",
  border:    "#e2e8f0",
  gold:      "#b08a2e",
  goldLight: "#d4a843",
  goldDim:   "#8a6d1e",
  green:     "#16a06b",
  red:       "#dc2626",
  blue:      "#2563eb",
  purple:    "#7c3aed",
  pink:      "#db2777",
  text:      "#1e2535",
  muted:     "#94a3b8",
  soft:      "#64748b",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');`;

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "alimentacao",   label: "Alimentação",   icon: "🍽️", color: "#e08c4c" },
  { id: "supermercado",  label: "Supermercado",  icon: "🛒",  color: "#f39c12" },
  { id: "restaurante",   label: "Restaurante",   icon: "🍴",  color: "#e67e22" },
  { id: "farmacia",      label: "Farmácia",      icon: "💊",  color: "#2ecc71" },
  { id: "transporte",    label: "Transporte",    icon: "🚗",  color: "#4c8ec9" },
  { id: "saude",         label: "Saúde",         icon: "🏥",  color: "#4caf82" },
  { id: "educacao",      label: "Educação",      icon: "📚",  color: "#9b59b6" },
  { id: "lazer",         label: "Lazer",         icon: "🎭",  color: "#e05c9b" },
  { id: "moradia",       label: "Moradia",       icon: "🏠",  color: "#c9a84c" },
  { id: "vestuario",     label: "Vestuário",     icon: "👔",  color: "#5cc9e0" },
  { id: "financeiro",    label: "Financeiro",    icon: "💳",  color: "#e05c5c" },
  { id: "empregada",     label: "Empregada",     icon: "🧹",  color: "#8e44ad" },
  { id: "bela",          label: "Bela",          icon: "💅",  color: "#fd79a8" },
  { id: "trabalho",      label: "Trabalho",      icon: "💼",  color: "#0984e3" },
  { id: "divida",        label: "Dívida",        icon: "📋",  color: "#e17055" },
  { id: "taxas",         label: "Taxas Bancárias",icon: "🏛️", color: "#636e72" },
  { id: "transferencia", label: "Transferência", icon: "🔄",  color: "#6b6f7d" },
  { id: "receita",       label: "Receita",       icon: "💰",  color: "#4caf82" },
  { id: "outros",        label: "Outros",        icon: "📦",  color: "#9a98a0" },
];

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
let _sbUrl = null, _sbKey = null;

const SB_URL_DEFAULT = "https://besombpjuvqrcxtnstvk.supabase.co";
const SB_KEY_DEFAULT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc29tYnBqdXZxcmN4dG5zdHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTYyMzYsImV4cCI6MjA5NTc3MjIzNn0.m2-frtJZEFkSBnHpPRSvv2gjCFYbIBYhVmFYY0WNpBQ";

function getSBCreds() {
  _sbUrl = localStorage.getItem("sb_url") || SB_URL_DEFAULT;
  _sbKey = localStorage.getItem("sb_key") || SB_KEY_DEFAULT;
  return { url: _sbUrl, key: _sbKey };
}

function authHeaders(token) {
  const { key } = getSBCreds();
  return {
    "apikey": key,
    "Authorization": `Bearer ${token || key}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
}

// Auth functions
async function sbSignUp(email, password) {
  const { url, key } = getSBCreds();
  if (!url) return { error: "Supabase não configurado" };
  const r = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { "apikey": key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const d = await r.json();
  return r.ok ? { data: d } : { error: d.error_description || d.msg || "Erro ao cadastrar" };
}

async function sbSignIn(email, password) {
  const { url, key } = getSBCreds();
  if (!url) return { error: "Supabase não configurado" };
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const d = await r.json();
  if (r.ok) {
    localStorage.setItem("sb_token", d.access_token);
    localStorage.setItem("sb_user", JSON.stringify({ email, id: d.user?.id }));
    return { data: d };
  }
  return { error: d.error_description || d.msg || "E-mail ou senha incorretos" };
}

async function sbSignInGoogle() {
  const { url } = getSBCreds();
  if (!url) return;
  const redirect = window.location.origin;
  window.location.href = `${url}/auth/v1/authorize?provider=google&redirect_to=${redirect}`;
}

async function sbSignOut() {
  const { url, key } = getSBCreds();
  const token = localStorage.getItem("sb_token");
  if (url && token) {
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": key, "Authorization": `Bearer ${token}` }
    }).catch(() => {});
  }
  localStorage.removeItem("sb_token");
  localStorage.removeItem("sb_user");
}

// Check Google OAuth callback token in URL hash
function checkOAuthCallback() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.replace("#", ""));
  const token = params.get("access_token");
  if (token) {
    localStorage.setItem("sb_token", token);
    const user = { email: params.get("email") || "usuário", id: null };
    localStorage.setItem("sb_user", JSON.stringify(user));
    window.history.replaceState(null, "", window.location.pathname);
    return token;
  }
  return null;
}

// DB helpers (uses auth token if available)
async function dbFrom(table) {
  const { url, key } = getSBCreds();
  if (!url || !key) return null;
  const base = `${url}/rest/v1/${table}`;

  const getHdrs = () => {
    const token = localStorage.getItem("sb_token");
    // Always use user JWT if available — required for RLS policies
    const authToken = token || key;
    return {
      "apikey": key,
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  };

  return {
    async select(q = "*", extra = "") {
      const r = await fetch(`${base}?select=${q}&order=date.desc${extra}`, { headers: getHdrs() });
      if (!r.ok) { const e = await r.text(); console.error(`select ${table}:`, r.status, e); return { data: [], error: e }; }
      return { data: await r.json() };
    },
    async insert(row) {
      const r = await fetch(base, { method: "POST", headers: getHdrs(), body: JSON.stringify(row) });
      if (!r.ok) { const e = await r.text(); console.error(`insert ${table}:`, r.status, e); return { error: e }; }
      const text = await r.text();
      return { data: text ? JSON.parse(text) : {} };
    },
    async update(row, match) {
      const params = Object.entries(match).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&");
      const r = await fetch(`${base}?${params}`, { method: "PATCH", headers: getHdrs(), body: JSON.stringify(row) });
      if (!r.ok) { const e = await r.text(); console.error(`update ${table}:`, r.status, e); return { error: e }; }
      return { data: {} };
    },
    async del(match) {
      const params = Object.entries(match).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&");
      const r = await fetch(`${base}?${params}`, { method: "DELETE", headers: getHdrs() });
      if (!r.ok) { const e = await r.text(); console.error(`delete ${table}:`, r.status, e); }
      return r.ok;
    }
  };
}


// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const TODAY = new Date();
const fmt   = (d) => d.toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return fmt(d); };

// Generate rich 6-month historical mock data for reports
function genHistoricalTxs() {
  const seed = [
    { desc:"Salário",           amt: 18500, cat:"receita",      acc:"a2", owner:"rodrigo", day:5  },
    { desc:"Salário Cláudia",   amt: 9800,  cat:"receita",      acc:"a3", owner:"claudia", day:5  },
    { desc:"Supermercado",      amt:-420,   cat:"alimentacao",  acc:"a4", owner:"casal",   day:8  },
    { desc:"Posto Ipiranga",    amt:-180,   cat:"transporte",   acc:"a2", owner:"rodrigo", day:10 },
    { desc:"Plano de Saúde",    amt:-890,   cat:"saude",        acc:"a2", owner:"rodrigo", day:12 },
    { desc:"Colégio Dom Bosco", amt:-1200,  cat:"educacao",     acc:"a2", owner:"rodrigo", day:12 },
    { desc:"iFood",             amt:-95,    cat:"alimentacao",  acc:"a1", owner:"rodrigo", day:14 },
    { desc:"Netflix",           amt:-56,    cat:"lazer",        acc:"a3", owner:"claudia", day:15 },
    { desc:"Conta de Luz",      amt:-310,   cat:"moradia",      acc:"a2", owner:"rodrigo", day:17 },
    { desc:"Internet Vivo",     amt:-150,   cat:"moradia",      acc:"a2", owner:"rodrigo", day:17 },
    { desc:"Farmácia",          amt:-85,    cat:"saude",        acc:"a3", owner:"claudia", day:20 },
    { desc:"Restaurante",       amt:-140,   cat:"alimentacao",  acc:"a4", owner:"casal",   day:22 },
    { desc:"Uber",              amt:-45,    cat:"transporte",   acc:"a3", owner:"claudia", day:24 },
    { desc:"Padaria",           amt:-32,    cat:"alimentacao",  acc:"a1", owner:"rodrigo", day:26 },
  ];
  const txs = [];
  for (let m = 5; m >= 0; m--) {
    const base = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
    seed.forEach((s, si) => {
      const jitter = (Math.sin((m+1)*(si+7)*13.7)*0.15);
      const amt = Math.round(s.amt * (1 + jitter) * 100) / 100;
      const d = new Date(base.getFullYear(), base.getMonth(), s.day);
      txs.push({
        id: `h_${m}_${si}`,
        accountId: s.acc,
        date: fmt(d),
        description: s.desc,
        amount: amt,
        category: s.cat,
        notes: "",
        internalTransfer: false,
      });
    });
  }
  return txs;
}

const MOCK_ACCOUNTS = [
  { id: "a1", name: "Nubank - Rodrigo",  type: "corrente",     owner: "rodrigo", balance: 8420.50,  color: C.purple },
  { id: "a2", name: "Itaú - Rodrigo",    type: "corrente",     owner: "rodrigo", balance: 15230.00, color: C.gold   },
  { id: "a3", name: "Nubank - Cláudia",  type: "corrente",     owner: "claudia", balance: 5870.30,  color: C.pink   },
  { id: "a4", name: "C6 Casal",          type: "corrente",     owner: "casal",   balance: 3200.00,  color: C.green  },
  { id: "a5", name: "XP Investimentos",  type: "investimento", owner: "rodrigo", balance: 42000.00, color: C.blue   },
];

const MOCK_TXS = [
  ...genHistoricalTxs(),
  { id:"t1",  accountId:"a1", date:daysAgo(0),  description:"Padaria São José",          amount:-28.50,   category:"alimentacao",  notes:"", internalTransfer:false },
  { id:"t2",  accountId:"a2", date:daysAgo(1),  description:"Posto Ipiranga",             amount:-180.00,  category:"transporte",   notes:"", internalTransfer:false },
  { id:"t3",  accountId:"a1", date:daysAgo(1),  description:"iFood",                     amount:-67.30,   category:"alimentacao",  notes:"", internalTransfer:false },
  { id:"t4",  accountId:"a3", date:daysAgo(2),  description:"Farmácia Drogasil",          amount:-95.00,   category:"saude",        notes:"", internalTransfer:false },
  { id:"t5",  accountId:"a2", date:daysAgo(2),  description:"Salário",                   amount:18500.00, category:"receita",      notes:"", internalTransfer:false },
  { id:"t6",  accountId:"a3", date:daysAgo(3),  description:"Salário Cláudia",           amount:9800.00,  category:"receita",      notes:"", internalTransfer:false },
  { id:"t7",  accountId:"a1", date:daysAgo(3),  description:"TRF → C6 Casal",            amount:-2000.00, category:"transferencia",notes:"", internalTransfer:true, linkedTx:"t8" },
  { id:"t8",  accountId:"a4", date:daysAgo(3),  description:"TRF ← Rodrigo",             amount:2000.00,  category:"transferencia",notes:"", internalTransfer:true, linkedTx:"t7" },
  { id:"t9",  accountId:"a4", date:daysAgo(4),  description:"Supermercado Pão de Açúcar",amount:-423.80,  category:"alimentacao",  notes:"", internalTransfer:false },
  { id:"t10", accountId:"a2", date:daysAgo(5),  description:"Plano de Saúde Amil",       amount:-890.00,  category:"saude",        notes:"", internalTransfer:false },
  { id:"t11", accountId:"a2", date:daysAgo(6),  description:"Colégio Dom Bosco",          amount:-1200.00, category:"educacao",     notes:"", internalTransfer:false },
  { id:"t12", accountId:"a1", date:daysAgo(7),  description:"Shopee",                    amount:-145.00,  category:"vestuario",    notes:"", internalTransfer:false },
  { id:"t13", accountId:"a3", date:daysAgo(8),  description:"Netflix",                   amount:-55.90,   category:"lazer",        notes:"", internalTransfer:false },
  { id:"t14", accountId:"a2", date:daysAgo(9),  description:"Conta de Luz CEMIG",        amount:-320.00,  category:"moradia",      notes:"", internalTransfer:false },
  { id:"t15", accountId:"a2", date:daysAgo(10), description:"Internet Vivo Fibra",       amount:-149.90,  category:"moradia",      notes:"", internalTransfer:false },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const brl   = (v) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(v);
const fdate = (s) => new Date(s+"T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"short" });
const catOf = (id) => DEFAULT_CATEGORIES.find(c => c.id === id) || DEFAULT_CATEGORIES.at(-1);
const ownerLabel = { rodrigo:"👨 Rodrigo", claudia:"👩 Cláudia", casal:"💑 Casal" };
const typeLabel  = { corrente:"Conta Corrente", poupanca:"Poupança", cartao:"Cartão de Crédito", investimento:"Investimento" };

// detect internal transfer between known accounts
function detectInternalTransfer(desc, accounts) {
  const d = desc.toLowerCase();
  const keywords = ["trf", "transferência", "transferencia", "pix", "ted"];
  const isTransfer = keywords.some(k => d.includes(k));
  if (!isTransfer) return false;
  // check if any account name / owner appears in description
  const names = accounts.flatMap(a => [a.name.toLowerCase(), a.owner.toLowerCase()]);
  return names.some(n => d.includes(n) || n.includes("claudia") && (d.includes("claudia") || d.includes("cláudia")) || n.includes("rodrigo") && d.includes("rodrigo"));
}

// ─── API ───────────────────────────────────────────────────────────────────────
async function callClaude(prompt, imageBase64 = null, imageMime = null) {
  const content = [];
  if (imageBase64) content.push({ type:"image", source:{ type:"base64", media_type: imageMime || "image/jpeg", data: imageBase64 } });
  content.push({ type:"text", text: prompt });
  const r = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:1000, messages:[{ role:"user", content }] })
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

async function classifyTx(description) {
  const text = await callClaude(
    `Classifique esta transação financeira brasileira em UMA das categorias. Responda APENAS o id, sem mais nada.\n\nTransação: "${description}"\n\nCategorias: alimentacao, supermercado, restaurante, farmacia, transporte, saude, educacao, lazer, moradia, vestuario, financeiro, empregada, bela, trabalho, divida, taxas, transferencia, receita, outros\n\nDicas: supermercado=mercado/carrefour/extra, restaurante=restaurante/pizzaria, farmacia=drogaria/farmácia, empregada=diarista/faxineira, bela=salão/cabelo/manicure, trabalho=salário/honorário, divida=parcela/financiamento/empréstimo/boleto de dívida, taxas=tarifa bancária/IOF/taxa/pacote banco\n\nResponda apenas o id:`
  );
  const id = text.trim().toLowerCase();
  return DEFAULT_CATEGORIES.find(c => c.id === id)?.id || "outros";
}

async function ocrComprovante(base64, mime) {
  const text = await callClaude(
    `Você recebeu uma imagem de um comprovante, nota fiscal, cupom fiscal ou recibo brasileiro.
Extraia as informações e responda APENAS em JSON válido, sem markdown, sem explicação, exatamente neste formato:
{"data":"YYYY-MM-DD","valor":0.00,"estabelecimento":"nome do local","categoria":"alimentacao|transporte|saude|educacao|lazer|moradia|vestuario|financeiro|outros","descricao":"descrição curta"}

Se não conseguir identificar algum campo, use null. Responda SOMENTE o JSON.`,
    base64, mime
  );
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return null; }
}

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
const Badge = ({ children, color }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:500, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
    {children}
  </span>
);

const Chip = ({ icon, label, color }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:color+"18", color, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>
    {icon} {label}
  </span>
);

const Divider = () => <div style={{ height:1, background:C.border }} />;

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 24px", display:"flex", flexDirection:"column", gap:6, position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:16, right:20, fontSize:22, opacity:.15 }}>{icon}</div>
    <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
    <div style={{ fontSize:26, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:color||C.text, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>}
  </div>
);

const Toast = ({ msg, type }) => (
  <div style={{ position:"fixed", bottom:28, right:28, background: type==="error" ? C.red : type==="warn" ? C.gold : C.green,
    color: type==="warn" ? C.bg : "#fff", borderRadius:10, padding:"12px 20px", fontSize:13,
    fontFamily:"'DM Sans',sans-serif", zIndex:999, boxShadow:"0 4px 24px #0008", maxWidth:360 }}>
    {msg}
  </div>
);

// ─── INPUT STYLE ──────────────────────────────────────────────────────────────
const IS = { background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"9px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", width:"100%" };

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SupabaseConfig = ({ onSave, onClose }) => {
  const [url, setUrl] = useState(localStorage.getItem("sb_url") || "");
  const [key, setKey] = useState(localStorage.getItem("sb_key") || "");
  const [testing, setTesting] = useState(false);
  const [status, setStatus]   = useState(null);

  const test = async () => {
    setTesting(true); setStatus(null);
    try {
      const r = await fetch(`${url}/rest/v1/transactions?select=id&limit=1`, { headers:{ apikey:key, Authorization:`Bearer ${key}` } });
      setStatus(r.ok ? "ok" : "fail_" + r.status);
    } catch { setStatus("fail_net"); }
    setTesting(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:40, width:480, maxWidth:"95vw" }}>
        <div style={{ fontSize:11, color:C.goldDim, letterSpacing:3, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Configuração</div>
        <div style={{ fontSize:26, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:6 }}>Conectar ao Supabase</div>
        <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:24 }}>
          Cole as credenciais do seu projeto. Sem isso o app usa dados de demonstração.<br/>
          <span style={{ color:C.goldDim }}>
            Schema necessário: tabelas <code style={{background:C.bg,padding:"1px 5px",borderRadius:4}}>accounts</code> e <code style={{background:C.bg,padding:"1px 5px",borderRadius:4}}>transactions</code>
          </span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>PROJECT URL</div>
            <input style={IS} placeholder="https://xxxx.supabase.co" value={url} onChange={e=>setUrl(e.target.value)} /></div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>ANON KEY</div>
            <input style={IS} placeholder="eyJ..." value={key} onChange={e=>setKey(e.target.value)} /></div>
        </div>
        {status && <div style={{ marginTop:12, fontSize:12, fontFamily:"'DM Sans',sans-serif", color: status==="ok" ? C.green : C.red }}>
          {status==="ok" ? "✅ Conexão bem-sucedida!" : status.startsWith("fail_net") ? "❌ Erro de rede. Verifique a URL." : `❌ Erro ${status.replace("fail_","")}. Verifique a chave.`}
        </div>}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={test} disabled={!url||!key||testing} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.soft, borderRadius:8, padding:"11px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            {testing ? "Testando..." : "Testar"}
          </button>
          <button onClick={() => { localStorage.setItem("sb_url",url); localStorage.setItem("sb_key",key); _sb=null; onSave(); }} style={{ flex:1, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"11px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Salvar e conectar
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"11px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TRANSACTION FORM ─────────────────────────────────────────────────────────
const TxForm = ({ accounts, onSave, onClose, initial }) => {
  const blank = { accountId:accounts[0]?.id||"", date:fmt(TODAY), description:"", amount:"", category:"outros", notes:"", type:"despesa", internalTransfer:false };
  const [form, setForm] = useState(initial ? { ...initial, type: initial.amount>0?"receita": initial.internalTransfer?"transferencia":"despesa", amount: Math.abs(initial.amount).toString() } : blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) return;
    const amt = parseFloat(form.amount.replace(",","."));
    if (isNaN(amt)) return;
    onSave({ ...form, id:initial?.id||("tx_"+Date.now()), amount: form.type==="receita" ? Math.abs(amt) : -Math.abs(amt), internalTransfer: form.type==="transferencia" });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:150 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:36, width:500, maxWidth:"95vw" }}>
        <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:24 }}>
          {initial ? "Editar lançamento" : "Novo lançamento"}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {/* Tipo */}
          <div style={{ gridColumn:"1/-1", display:"flex", gap:8 }}>
            {[["despesa","💸 Despesa",C.red],["receita","💰 Receita",C.green],["transferencia","🔄 Transferência",C.blue]].map(([t,l,col])=>(
              <button key={t} onClick={()=>set("type",t)} style={{ flex:1, padding:"9px 0", borderRadius:8, fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                background: form.type===t ? col+"22" : "transparent",
                border:`1px solid ${form.type===t ? col : C.border}`,
                color: form.type===t ? col : C.muted }}>{l}</button>
            ))}
          </div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CONTA</div>
            <select style={IS} value={form.accountId} onChange={e=>set("accountId",e.target.value)}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select></div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>DATA</div>
            <input type="date" style={IS} value={form.date} onChange={e=>set("date",e.target.value)} /></div>
          <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>DESCRIÇÃO</div>
            <input style={IS} placeholder="Ex: Supermercado" value={form.description} onChange={e=>set("description",e.target.value)} /></div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>VALOR (R$)</div>
            <input style={IS} placeholder="0,00" value={form.amount} onChange={e=>set("amount",e.target.value)} /></div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CATEGORIA</div>
            <select style={IS} value={form.category} onChange={e=>set("category",e.target.value)}>
              {DEFAULT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select></div>
          <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>NOTAS</div>
            <input style={IS} placeholder="Observações..." value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:24 }}>
          <button onClick={handleSave} style={{ flex:1, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"12px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Salvar</button>
          <button onClick={onClose} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 20px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── SVG CHARTS ───────────────────────────────────────────────────────────────
// Line/Area chart — pure SVG, no deps
const AreaChart = ({ series, labels, height=180, showLegend=true }) => {
  const W = 620, H = height, PL = 52, PR = 16, PT = 16, PB = 32;
  const iW = W - PL - PR, iH = H - PT - PB;
  const allVals = series.flatMap(s => s.data);
  const minV = Math.min(0, ...allVals), maxV = Math.max(...allVals, 1);
  const range = maxV - minV || 1;
  const xOf = (i) => PL + (i / (labels.length - 1)) * iW;
  const yOf = (v) => PT + iH - ((v - minV) / range) * iH;

  const pathD = (data) => data.map((v,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
  const areaD = (data) => `${pathD(data)} L${xOf(data.length-1).toFixed(1)},${(PT+iH).toFixed(1)} L${PL.toFixed(1)},${(PT+iH).toFixed(1)} Z`;

  const yTicks = 4;
  const gridLines = Array.from({length:yTicks+1},(_,i)=> minV + (range/yTicks)*i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",overflow:"visible"}}>
      <defs>
        {series.map((s,si) => (
          <linearGradient key={si} id={`ag${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={s.color} stopOpacity="0.02"/>
          </linearGradient>
        ))}
      </defs>
      {/* grid */}
      {gridLines.map((v,i) => (
        <g key={i}>
          <line x1={PL} x2={W-PR} y1={yOf(v)} y2={yOf(v)} stroke={C.border} strokeWidth="1"/>
          <text x={PL-6} y={yOf(v)+4} textAnchor="end" fontSize="9" fill={C.muted} fontFamily="DM Sans,sans-serif">
            {Math.abs(v)>=1000?`${(v/1000).toFixed(0)}k`:v.toFixed(0)}
          </text>
        </g>
      ))}
      {/* zero line */}
      {minV < 0 && <line x1={PL} x2={W-PR} y1={yOf(0)} y2={yOf(0)} stroke={C.soft} strokeWidth="1" strokeDasharray="4,3"/>}
      {/* areas */}
      {series.map((s,si) => <path key={`a${si}`} d={areaD(s.data)} fill={`url(#ag${si})`}/>)}
      {/* lines */}
      {series.map((s,si) => <path key={`l${si}`} d={pathD(s.data)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>)}
      {/* dots on hover via title */}
      {series.map((s,si) => s.data.map((v,i) => (
        <circle key={`d${si}_${i}`} cx={xOf(i)} cy={yOf(v)} r="3.5" fill={s.color} stroke={C.card} strokeWidth="1.5">
          <title>{labels[i]}: {brl(v)}</title>
        </circle>
      )))}
      {/* x labels */}
      {labels.map((l,i) => (
        <text key={i} x={xOf(i)} y={H-6} textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="DM Sans,sans-serif">{l}</text>
      ))}
      {/* legend */}
      {showLegend && series.map((s,si) => (
        <g key={`leg${si}`} transform={`translate(${PL + si*140}, ${H-4})`}>
          <rect x={0} y={-10} width={10} height={4} rx="2" fill={s.color}/>
          <text x={14} y={-7} fontSize="10" fill={C.soft} fontFamily="DM Sans,sans-serif">{s.label}</text>
        </g>
      ))}
    </svg>
  );
};

// Donut chart
const DonutChart = ({ slices, size=160 }) => {
  const cx = size/2, cy = size/2, R = size*0.38, r = size*0.22;
  const total = slices.reduce((s,x)=>s+x.value,0)||1;
  let angle = -Math.PI/2;
  const paths = slices.map(sl => {
    const a = (sl.value/total)*Math.PI*2;
    const x1 = cx+R*Math.cos(angle), y1 = cy+R*Math.sin(angle);
    angle += a;
    const x2 = cx+R*Math.cos(angle), y2 = cy+R*Math.sin(angle);
    const xi1 = cx+r*Math.cos(angle-a), yi1 = cy+r*Math.sin(angle-a);
    const xi2 = cx+r*Math.cos(angle),   yi2 = cy+r*Math.sin(angle);
    const lg = a > Math.PI ? 1 : 0;
    return { ...sl, d:`M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${lg},0 ${xi1},${yi1} Z` };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size,flexShrink:0}}>
      {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} opacity="0.9"><title>{p.label}: {brl(p.value)} ({(p.value/total*100).toFixed(0)}%)</title></path>)}
    </svg>
  );
};

// Bar chart (vertical)
const BarChart = ({ data, height=160 }) => {
  const W=560, H=height, PL=46, PR=10, PT=10, PB=28;
  const iW=W-PL-PR, iH=H-PT-PB;
  const maxV = Math.max(...data.map(d=>Math.abs(d.value)),1);
  const bw = Math.max(4, iW/data.length - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      {[0,.25,.5,.75,1].map(t=>{
        const y = PT + iH*(1-t);
        return <g key={t}>
          <line x1={PL} x2={W-PR} y1={y} y2={y} stroke={C.border} strokeWidth="1"/>
          <text x={PL-5} y={y+4} textAnchor="end" fontSize="9" fill={C.muted} fontFamily="DM Sans,sans-serif">
            {(maxV*t)>=1000?`${((maxV*t)/1000).toFixed(0)}k`:(maxV*t).toFixed(0)}
          </text>
        </g>;
      })}
      {data.map((d,i)=>{
        const bh = (Math.abs(d.value)/maxV)*iH;
        const x = PL + (iW/data.length)*i + (iW/data.length - bw)/2;
        const y = PT+iH-bh;
        return <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} rx="3" fill={d.color||C.gold} opacity="0.85">
            <title>{d.label}: {brl(d.value)}</title>
          </rect>
          <text x={x+bw/2} y={H-8} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily="DM Sans,sans-serif">{d.label}</text>
        </g>;
      })}
    </svg>
  );
};

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCSV(transactions, accounts, period) {
  const rows = transactions
    .filter(t => !period || t.date.startsWith(period))
    .sort((a,b)=>a.date.localeCompare(b.date));
  const acc = (id) => accounts.find(a=>a.id===id)?.name||id;
  const header = "Data;Descrição;Conta;Categoria;Valor;Transferência Interna;Notas";
  const lines = rows.map(t =>
    [t.date, `"${t.description}"`, `"${acc(t.accountId)}"`, t.category,
     t.amount.toFixed(2).replace(".",","), t.internalTransfer?"Sim":"Não", `"${t.notes||""}"`].join(";")
  );
  const csv = [header,...lines].join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`relatorio_fontanezzi_${period||"completo"}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── RELATORIOS ───────────────────────────────────────────────────────────────
const Relatorios = ({ transactions, accounts }) => {
  const [tab, setTab] = useState("tendencia"); // tendencia | categorias | pessoa | mensal
  const [year, setYear] = useState(String(TODAY.getFullYear()));

  // Build monthly summaries for selected year
  const months = Array.from({length:12},(_,i)=>{
    const m = String(i+1).padStart(2,"0");
    const key = `${year}-${m}`;
    const mTxs = transactions.filter(t=>t.date.startsWith(key)&&!t.internalTransfer);
    const rec  = mTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const des  = mTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const sal  = rec-des;
    return { key, label:new Date(parseInt(year),i,1).toLocaleDateString("pt-BR",{month:"short"}), rec, des, sal, txs:mTxs };
  });

  const availMonths = months.filter(m=>m.txs.length>0);
  const labels = months.map(m=>m.label);

  // Category breakdown — all year
  const yearTxs = transactions.filter(t=>t.date.startsWith(year)&&t.amount<0&&!t.internalTransfer);
  const byCat = {};
  yearTxs.forEach(t=>{ byCat[t.category]=(byCat[t.category]||0)+Math.abs(t.amount); });
  const catSlices = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([id,val])=>({ label:catOf(id).label, value:val, color:catOf(id).color, icon:catOf(id).icon, id }));
  const catTotal = catSlices.reduce((s,c)=>s+c.value,0)||1;

  // By person
  const byOwner = {};
  transactions.filter(t=>t.date.startsWith(year)&&t.amount<0&&!t.internalTransfer).forEach(t=>{
    const acc = accounts.find(a=>a.id===t.accountId);
    const o = acc?.owner||"outros";
    byOwner[o]=(byOwner[o]||0)+Math.abs(t.amount);
  });

  // Yearly totals
  const totRec = months.reduce((s,m)=>s+m.rec,0);
  const totDes = months.reduce((s,m)=>s+m.des,0);
  const avgSal = availMonths.length ? (totRec-totDes)/availMonths.length : 0;

  // Months with most/least spending
  const activeMths = months.filter(m=>m.des>0);
  const maxMth = activeMths.reduce((a,b)=>b.des>a.des?b:a, activeMths[0]||months[0]);
  const minMth = activeMths.reduce((a,b)=>b.des<a.des?b:a, activeMths[0]||months[0]);

  const tabBtn = (id, label) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:500,
      fontFamily:"'DM Sans',sans-serif", cursor:"pointer", border:"none",
      background: tab===id ? C.gold+"22" : "transparent",
      color: tab===id ? C.goldLight : C.muted,
      borderBottom: tab===id ? `2px solid ${C.gold}` : "2px solid transparent",
    }}>{label}</button>
  );

  const Card = ({children, style={}}) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, ...style }}>{children}</div>
  );
  const SectionTitle = ({children}) => (
    <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:16 }}>{children}</div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:2 }}>
          {tabBtn("tendencia","📈 Tendência")}
          {tabBtn("categorias","🍩 Categorias")}
          {tabBtn("pessoa","👥 Por Pessoa")}
          {tabBtn("mensal","📅 Mensal")}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <select style={{ ...IS, width:"auto", fontSize:12 }} value={year} onChange={e=>setYear(e.target.value)}>
            {[0,1,2].map(d=>{ const y=String(TODAY.getFullYear()-d); return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button onClick={()=>exportCSV(transactions,accounts,null)} style={{
            background:"transparent", border:`1px solid ${C.border}`, color:C.soft, borderRadius:8,
            padding:"8px 14px", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6
          }}>⬇ CSV</button>
        </div>
      </div>

      {/* KPIs do ano */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label={`Receitas ${year}`}  value={brl(totRec)}          icon="📈" color={C.green}     sub={`${availMonths.length} meses com dados`} />
        <StatCard label={`Despesas ${year}`}  value={brl(totDes)}          icon="📉" color={C.red}       sub="excl. transferências" />
        <StatCard label="Saldo acumulado"     value={brl(totRec-totDes)}   icon="💰" color={totRec-totDes>=0?C.goldLight:C.red} sub={year} />
        <StatCard label="Economia média/mês"  value={brl(avgSal)}          icon="🎯" color={avgSal>=0?C.green:C.red} sub="receitas − despesas" />
      </div>

      {/* ─── TENDÊNCIA ─── */}
      {tab==="tendencia" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <Card>
            <SectionTitle>Receitas × Despesas por mês — {year}</SectionTitle>
            <AreaChart
              series={[
                { label:"Receitas", data:months.map(m=>m.rec), color:C.green },
                { label:"Despesas", data:months.map(m=>m.des), color:C.red  },
              ]}
              labels={labels} height={200}
            />
          </Card>
          <Card>
            <SectionTitle>Saldo mensal (Receitas − Despesas)</SectionTitle>
            <BarChart
              data={months.map(m=>({ label:m.label, value:m.sal, color: m.sal>=0?C.green+"cc":C.red+"cc" }))}
              height={150}
            />
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <SectionTitle>Mês de maior gasto</SectionTitle>
              <div style={{ fontSize:28, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.red }}>{brl(maxMth?.des||0)}</div>
              <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>{maxMth?.label} {year}</div>
            </Card>
            <Card>
              <SectionTitle>Mês de menor gasto</SectionTitle>
              <div style={{ fontSize:28, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.green }}>{brl(minMth?.des||0)}</div>
              <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>{minMth?.label} {year}</div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── CATEGORIAS ─── */}
      {tab==="categorias" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <Card>
            <SectionTitle>Distribuição de gastos por categoria — {year}</SectionTitle>
            <div style={{ display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>
              <DonutChart slices={catSlices} size={180} />
              <div style={{ flex:1, minWidth:200 }}>
                {catSlices.map(c=>(
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", flex:1 }}>{c.icon} {c.label}</span>
                    <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.text }}>{brl(c.value)}</span>
                    <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", minWidth:36, textAlign:"right" }}>{(c.value/catTotal*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Evolução mensal por categoria (top 5)</SectionTitle>
            <AreaChart
              series={catSlices.slice(0,5).map(c=>({
                label: c.label,
                color: c.color,
                data: months.map(m=>{
                  return m.txs.filter(t=>t.category===c.id&&t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
                })
              }))}
              labels={labels} height={200}
            />
          </Card>
        </div>
      )}

      {/* ─── POR PESSOA ─── */}
      {tab==="pessoa" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {[["rodrigo",C.purple,"👨"],["claudia",C.pink,"👩"],["casal",C.green,"💑"]].map(([o,col,icon])=>(
              <Card key={o}>
                <SectionTitle>{icon} {o==="casal"?"Casal":o==="rodrigo"?"Rodrigo":"Cláudia"}</SectionTitle>
                <div style={{ fontSize:28, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:col }}>{brl(byOwner[o]||0)}</div>
                <div style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>
                  {((byOwner[o]||0)/totDes*100).toFixed(0)}% do total de gastos
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <SectionTitle>Gastos mensais por pessoa — {year}</SectionTitle>
            <AreaChart
              series={[
                { label:"Rodrigo", color:C.purple, data:months.map(m=>m.txs.filter(t=>t.amount<0&&accounts.find(a=>a.id===t.accountId)?.owner==="rodrigo").reduce((s,t)=>s+Math.abs(t.amount),0)) },
                { label:"Cláudia", color:C.pink,   data:months.map(m=>m.txs.filter(t=>t.amount<0&&accounts.find(a=>a.id===t.accountId)?.owner==="claudia").reduce((s,t)=>s+Math.abs(t.amount),0)) },
                { label:"Casal",   color:C.green,  data:months.map(m=>m.txs.filter(t=>t.amount<0&&accounts.find(a=>a.id===t.accountId)?.owner==="casal").reduce((s,t)=>s+Math.abs(t.amount),0)) },
              ]}
              labels={labels} height={200}
            />
          </Card>
          {/* per-person category breakdown */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {[["rodrigo","👨 Rodrigo",C.purple],["claudia","👩 Cláudia",C.pink]].map(([owner,label,col])=>{
              const oTxs = yearTxs.filter(t=>accounts.find(a=>a.id===t.accountId)?.owner===owner);
              const oByCat = {};
              oTxs.forEach(t=>{ oByCat[t.category]=(oByCat[t.category]||0)+Math.abs(t.amount); });
              const top = Object.entries(oByCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
              const mx = top[0]?.[1]||1;
              return (
                <Card key={owner}>
                  <SectionTitle>Top categorias — {label}</SectionTitle>
                  {top.map(([id,val])=>{
                    const cat = catOf(id);
                    return (
                      <div key={id} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{cat.icon} {cat.label}</span>
                          <span style={{ fontSize:12, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{brl(val)}</span>
                        </div>
                        <div style={{ height:4, background:C.border, borderRadius:4 }}>
                          <div style={{ height:"100%", width:`${val/mx*100}%`, background:col, borderRadius:4 }} />
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MENSAL ─── */}
      {tab==="mensal" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {months.filter(m=>m.txs.length>0).reverse().map(m=>{
            const byCatM = {};
            m.txs.filter(t=>t.amount<0).forEach(t=>{ byCatM[t.category]=(byCatM[t.category]||0)+Math.abs(t.amount); });
            const topCats = Object.entries(byCatM).sort((a,b)=>b[1]-a[1]).slice(0,4);
            return (
              <Card key={m.key} style={{ padding:0, overflow:"hidden" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:16, fontFamily:"'Cormorant Garamond',serif", color:C.text, fontWeight:600, textTransform:"capitalize" }}>
                    {new Date(m.key+"-15").toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
                  </div>
                  <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>RECEITAS</div>
                      <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.green }}>{brl(m.rec)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>DESPESAS</div>
                      <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.red }}>{brl(m.des)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>SALDO</div>
                      <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:m.sal>=0?C.goldLight:C.red }}>{brl(m.sal)}</div>
                    </div>
                    <button onClick={()=>exportCSV(transactions,accounts,m.key)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"6px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>⬇ CSV</button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:0, padding:"14px 24px", flexWrap:"wrap" }}>
                  {topCats.map(([id,val])=>{
                    const cat = catOf(id);
                    return (
                      <div key={id} style={{ display:"flex", alignItems:"center", gap:8, marginRight:24 }}>
                        <span style={{ fontSize:14 }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{cat.label}</div>
                          <div style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:cat.color }}>{brl(val)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginLeft:"auto", fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", alignSelf:"center" }}>
                    {m.txs.length} lançamentos
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── METAS STORAGE ────────────────────────────────────────────────────────────
const GOALS_KEY = "fontanezzi_goals";
function loadGoals() { try { return JSON.parse(localStorage.getItem(GOALS_KEY)) || {}; } catch { return {}; } }
function saveGoals(g) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ transactions, accounts, onNavigate }) => {
  const month    = fmt(TODAY).slice(0,7);
  const thisM    = transactions.filter(t => t.date.startsWith(month));
  const receitas = thisM.filter(t=>t.amount>0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);
  const despesas = thisM.filter(t=>t.amount<0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);
  const total    = accounts.reduce((s,a)=>s+a.balance,0);
  const invest   = accounts.filter(a=>a.type==="investimento").reduce((s,a)=>s+a.balance,0);
  const cashBal  = (() => { try { return (JSON.parse(localStorage.getItem(CASH_STORAGE_KEY))||[]).reduce((s,t)=>s+t.amount,0); } catch { return 0; } })();

  const byCat = {};
  thisM.filter(t=>t.amount<0&&!t.internalTransfer).forEach(t=>{ byCat[t.category]=(byCat[t.category]||0)+Math.abs(t.amount); });
  const catR = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxC = catR[0]?.[1]||1;

  const goals   = loadGoals();
  const recent  = [...transactions].filter(t=>!t.internalTransfer).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  const byOwner = { rodrigo:0, claudia:0, casal:0 };
  thisM.filter(t=>t.amount<0&&!t.internalTransfer).forEach(t=>{ const acc=accounts.find(a=>a.id===t.accountId); if(acc) byOwner[acc.owner]=(byOwner[acc.owner]||0)+Math.abs(t.amount); });

  // Goals alerts
  const alerts = catR.filter(([id,val])=>goals[id]&&val>goals[id]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Alertas de metas */}
      {alerts.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {alerts.map(([id,val])=>{
            const cat=catOf(id), lim=goals[id];
            return (
              <div key={id} style={{ background:C.red+"18", border:`1px solid ${C.red}44`, borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:18 }}>{cat.icon}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>
                    <strong style={{color:C.red}}>{cat.label}</strong> ultrapassou a meta mensal —{" "}
                    <span style={{color:C.red}}>{brl(val)}</span> de <span style={{color:C.muted}}>{brl(lim)}</span> ({Math.round(val/lim*100)}%)
                  </span>
                </div>
                <button onClick={()=>onNavigate("metas")} style={{ background:"transparent", border:`1px solid ${C.red}55`, color:C.red, borderRadius:7, padding:"5px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                  Ver metas
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 }}>
        <div onClick={()=>onNavigate("carteira")} style={{ cursor:"pointer" }}>
          <StatCard label="Patrimônio total" value={brl(total+cashBal)} sub="contas + dinheiro" icon="🏦" color={C.goldLight} />
        </div>
        <StatCard label="Receitas do mês"   value={brl(receitas)}           sub={new Date().toLocaleString("pt-BR",{month:"long"})} icon="📈" color={C.green} />
        <StatCard label="Despesas do mês"   value={brl(Math.abs(despesas))} sub="excl. transferências internas" icon="📉" color={C.red} />
        <div onClick={()=>onNavigate("carteira")} style={{ cursor:"pointer" }}>
          <StatCard label="Dinheiro em caixa" value={brl(cashBal)} sub="espécie · clique para detalhar" icon="💵" color={cashBal>=0?C.green:C.red} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:18 }}>
        {/* Categorias + metas */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Gastos por categoria</div>
            <button onClick={()=>onNavigate("metas")} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"4px 10px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              🎯 Metas
            </button>
          </div>
          {catR.length===0
            ? <div style={{ color:C.muted, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Sem despesas no mês.</div>
            : catR.map(([id,val])=>{
              const cat=catOf(id); const goal=goals[id]; const pct=goal?Math.min(val/goal*100,100):null;
              const over=goal&&val>goal;
              return (
                <div key={id} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
                      <span style={{ color: over?C.red:C.text }}>{brl(val)}</span>
                      {goal && <span style={{ color:C.muted }}> / {brl(goal)}</span>}
                    </span>
                  </div>
                  <div style={{ height:4, background:C.border, borderRadius:4 }}>
                    {goal
                      ? <div style={{ height:"100%", width:`${pct}%`, background: over?C.red:val/goal>0.8?C.gold:C.green, borderRadius:4, transition:"width .5s" }} />
                      : <div style={{ height:"100%", width:`${val/maxC*100}%`, background:cat.color, borderRadius:4, transition:"width .5s" }} />
                    }
                  </div>
                </div>
              );
            })}
        </div>

        {/* Contas + por pessoa */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22, flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Contas</div>
              <button onClick={()=>onNavigate("carteira")} style={{ background:"transparent", border:"none", color:C.goldDim, fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>ver carteira →</button>
            </div>
            {accounts.map(a=>(
              <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:a.color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:12, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{a.name}</div>
                    <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{ownerLabel[a.owner]||a.owner}</div>
                  </div>
                </div>
                <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:a.balance>=0?C.text:C.red }}>{brl(a.balance)}</div>
              </div>
            ))}
            {/* Dinheiro linha */}
            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, flexShrink:0 }} />
                <div style={{ fontSize:12, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>💵 Dinheiro</div>
              </div>
              <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:cashBal>=0?C.green:C.red }}>{brl(cashBal)}</div>
            </div>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>Gastos por pessoa</div>
            {[["rodrigo",C.purple],["claudia",C.pink],["casal",C.green]].map(([o,col])=>(
              <div key={o} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{ownerLabel[o]}</span>
                <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:col }}>{brl(byOwner[o]||0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas movimentações */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Últimas movimentações</div>
          <button onClick={()=>onNavigate("extrato")} style={{ background:"transparent", border:"none", color:C.goldDim, fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>ver todas →</button>
        </div>
        {recent.map((t,i)=>{
          const cat=catOf(t.category); const acc=accounts.find(a=>a.id===t.accountId);
          return (
            <div key={t.id}>
              {i>0&&<Divider/>}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 0" }}>
                <div style={{ fontSize:20, width:34, textAlign:"center" }}>{cat.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{fdate(t.date)} · {acc?.name}</div>
                </div>
                <Chip icon={cat.icon} label={cat.label} color={cat.color} />
                <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:t.amount>0?C.green:C.text, minWidth:100, textAlign:"right" }}>
                  {t.amount>0?"+":""}{brl(t.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ─── EXTRATO ──────────────────────────────────────────────────────────────────
const Extrato = ({ transactions, accounts, onEdit, onDelete, onAdd }) => {
  const [filter, setFilter] = useState({ search:"", category:"", account:"", month:fmt(TODAY).slice(0,7) });
  const sf = (k,v) => setFilter(f=>({...f,[k]:v}));

  const filtered = transactions.filter(t=>{
    if (filter.month    && !t.date.startsWith(filter.month)) return false;
    if (filter.category && t.category !== filter.category)  return false;
    if (filter.account  && t.accountId !== filter.account)  return false;
    if (filter.search   && !t.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const totRec = filtered.filter(t=>t.amount>0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);
  const totDes = filtered.filter(t=>t.amount<0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Filtros */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input style={{ ...IS, flex:"1 1 150px" }} placeholder="🔍 Buscar..." value={filter.search} onChange={e=>sf("search",e.target.value)} />
        <input type="month" style={{ ...IS, width:150 }} value={filter.month} onChange={e=>sf("month",e.target.value)} />
        <select style={{ ...IS, width:"auto" }} value={filter.category} onChange={e=>sf("category",e.target.value)}>
          <option value="">Todas categorias</option>
          {DEFAULT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={{ ...IS, flex:"1 1 140px" }} value={filter.account} onChange={e=>sf("account",e.target.value)}>
          <option value="">🏦 Todas as contas</option>
          {accounts.map(a=>(
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button onClick={onAdd} style={{ marginLeft:"auto", background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"9px 18px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
          + Lançamento
        </button>
      </div>

      {/* Totais */}
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ background:C.green+"15", border:`1px solid ${C.green}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.green, fontFamily:"'DM Sans',sans-serif" }}>
          Entradas: <strong>{brl(totRec)}</strong>
        </div>
        <div style={{ background:C.red+"15", border:`1px solid ${C.red}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.red, fontFamily:"'DM Sans',sans-serif" }}>
          Saídas: <strong>{brl(Math.abs(totDes))}</strong>
        </div>
        <div style={{ background:C.border, borderRadius:10, padding:"10px 20px", fontSize:13, color: (totRec+totDes)>=0?C.green:C.red, fontFamily:"'DM Sans',sans-serif" }}>
          Saldo: <strong>{brl(totRec+totDes)}</strong>
        </div>
      </div>

      {/* Lista de transações — cards no mobile, tabela no desktop */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
        {/* Header desktop */}
        <div className="desktop-only" style={{ display:"grid", gridTemplateColumns:"75px 1fr 130px 120px 105px 70px", background:C.surface, borderBottom:`1px solid ${C.border}` }}>
          {["Data","Descrição","Conta","Categoria","Valor",""].map((h,i)=>(
            <div key={i} style={{ padding:"11px 14px", fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", letterSpacing:1, textTransform:"uppercase" }}>{h}</div>
          ))}
        </div>
        {filtered.length===0 && (
          <div style={{ padding:"40px", textAlign:"center", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Nenhuma movimentação encontrada</div>
        )}
        {filtered.map((t,i)=>{
          const cat = catOf(t.category);
          const acc = accounts.find(a=>a.id===t.accountId);
          return (
            <div key={t.id}>
              {i>0 && <div style={{ height:1, background:C.border }} />}
              {/* Mobile card */}
              <div className="mobile-only" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{cat.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {t.internalTransfer && <span style={{ fontSize:10, background:C.blue+"22", color:C.blue, borderRadius:4, padding:"1px 5px", marginRight:5 }}>INT</span>}
                    {t.description}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>
                    {fdate(t.date)} · {acc?.name||"—"} · <span style={{color:cat.color}}>{cat.label}</span>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                  <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:t.amount>0?C.green:C.text }}>
                    {t.amount>0?"+":""}{brl(t.amount)}
                  </div>
                  <div style={{ display:"flex", gap:2 }}>
                    <button onClick={()=>onEdit(t)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:12, padding:"2px 4px" }}>✏️</button>
                    <button onClick={()=>onDelete(t.id)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:12, padding:"2px 4px" }}>🗑️</button>
                  </div>
                </div>
              </div>
              {/* Desktop row */}
              <div className="desktop-only" style={{ display:"grid", gridTemplateColumns:"75px 1fr 130px 120px 105px 70px", alignItems:"center" }}>
                <div style={{ padding:"11px 14px", fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{fdate(t.date)}</div>
                <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:7 }}>
                  {t.internalTransfer && <span style={{ fontSize:10, background:C.blue+"22", color:C.blue, border:`1px solid ${C.blue}44`, borderRadius:4, padding:"1px 5px" }}>INT</span>}
                  <span style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</span>
                </div>
                <div style={{ padding:"11px 14px", fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{acc?.name||"—"}</div>
                <div style={{ padding:"11px 14px" }}><Chip icon={cat.icon} label={cat.label} color={cat.color} /></div>
                <div style={{ padding:"11px 14px", fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:t.amount>0?C.green:C.text }}>
                  {t.amount>0?"+":""}{brl(t.amount)}
                </div>
                <div style={{ padding:"11px 6px", display:"flex", alignItems:"center", gap:2 }}>
                  <button onClick={()=>onEdit(t)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"4px 5px" }}>✏️</button>
                  <button onClick={()=>onDelete(t.id)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"4px 5px" }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── IMPORTAR EXTRATO ─────────────────────────────────────────────────────────
const ImportarExtrato = ({ accounts, onImport, allTxs }) => {
  const [step, setStep]       = useState("idle");
  const [rows, setRows]       = useState([]);
  const [classifying, setCls] = useState(false);
  const [selAcc, setSelAcc]   = useState(accounts[0]?.id||"");
  const [dupWarnings, setDups] = useState([]);
  const [pdfStatus, setPdfStatus] = useState("");
  const [saldoExtratoFinal, setSaldoExtratoFinal] = useState(null);
  const pdfStatusRef = useRef("");

  const setStatus = (msg) => {
    pdfStatusRef.current = msg;
    setPdfStatus(msg);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(l=>l.trim());
    return lines.slice(1).map(line=>{
      const cols = line.split(/[;,]/).map(c=>c.replace(/"/g,"").trim());
      if (cols.length < 3) return null;
      const amount = parseFloat(cols[2].replace(/\./g,"").replace(",","."));
      if (isNaN(amount)) return null;
      return { id:"imp_"+Math.random().toString(36).slice(2), date:cols[0], description:cols[1], amount, accountId:selAcc, category:"outros", keep:true, internalTransfer:false };
    }).filter(Boolean);
  };

  // Parse PDF via AI — extract text with pdf.js then send to AI
  const parsePDFwithAI = async (base64) => {
    let lastMsg = "";
    const status = (msg) => { lastMsg = msg; setStatus(msg); };
    try {
      status("📄 Carregando leitor de PDF...");
      await new Promise((resolve, reject) => {
        if (window.pdfjsLib) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve();
        };
        s.onerror = () => reject(new Error("Falha ao carregar pdf.js do CDN"));
        document.head.appendChild(s);
      });

      status("📄 Lendo páginas do PDF...");
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(i => i.str).join(" ") + "\n";
      }

      if (!fullText.trim()) {
        status("❌ PDF sem texto — pode ser imagem escaneada");
        return [];
      }

      status(`🤖 Texto extraído (${fullText.length} chars). Enviando para IA...`);

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4000,
          messages: [{ role: "user", content:
`Extrato bancário brasileiro. Retorne SOMENTE um objeto JSON sem markdown.

Formato:
{
  "saldo_final": numero_ou_null,
  "transacoes": [{"date":"YYYY-MM-DD","description":"texto","amount":numero}]
}

Regras:
- saldo_final = saldo mais recente do extrato (ex: "Saldo final do período", "Saldo ao final do dia" mais recente, "Saldo em conta"). Número puro, sem R$.
- Débitos/saídas = amount negativo. Créditos/entradas = positivo.
- Ignore linhas de saldo nas transações, cabeçalho, rodapé.
- Converta datas DD/MM/AAAA para YYYY-MM-DD.

TEXTO DO EXTRATO:
${fullText.slice(0, 8000)}

Responda APENAS o objeto JSON:`
          }]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        status("❌ API HTTP " + res.status + ": " + (err.error?.message || res.statusText));
        return { txs: [], saldoFinal: null };
      }

      const data = await res.json();
      const aiText = data.content?.[0]?.text || "";

      // Try to parse as object with saldo_final + transacoes
      let parsed = null;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch(e) {}

      // Fallback: try plain array
      if (!parsed?.transacoes) {
        try {
          const arrMatch = aiText.match(/\[[\s\S]*\]/);
          if (arrMatch) parsed = { transacoes: JSON.parse(arrMatch[0]), saldo_final: null };
        } catch(e) {}
      }

      if (!parsed?.transacoes) {
        status("❌ IA não retornou JSON. Preview: " + aiText.slice(0,60));
        return { txs: [], saldoFinal: null };
      }

      const valid = parsed.transacoes.map(t => ({
        id: "imp_" + Math.random().toString(36).slice(2),
        date: String(t.date||"").replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1") || fmt(TODAY),
        description: String(t.description||"").trim(),
        amount: parseFloat(String(t.amount||0).replace(",",".")) || 0,
        accountId: selAcc, category: "outros", keep: true, internalTransfer: false,
      })).filter(t => t.description && t.amount !== 0);

      const saldoFinal = parsed.saldo_final != null ? parseFloat(String(parsed.saldo_final).replace(",",".")) : null;

      status(`✅ ${valid.length} transações encontradas!${saldoFinal != null ? ` Saldo: R$ ${saldoFinal.toFixed(2)}` : ""}`);
      return { txs: valid, saldoFinal };

    } catch (e) {
      status("❌ " + (e.message || String(e)));
      return { txs: [], saldoFinal: null };
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep("parsing");
    setPdfStatus("");
    let parsed = [];
    let saldoFinal = null;

    if (file.name.match(/\.(csv|txt)$/i)) {
      const text = await file.text();
      parsed = parseCSV(text);
      if (!parsed.length) { alert("Não foi possível interpretar o CSV. Verifique o formato."); setStep("idle"); return; }
    } else if (file.name.match(/\.pdf$/i)) {
      const b64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const result = await parsePDFwithAI(b64);
      parsed = result.txs || [];
      saldoFinal = result.saldoFinal;
      if (!parsed.length) {
        alert("Erro ao processar PDF:\n\n" + pdfStatusRef.current);
        setStep("idle"); return;
      }
    } else if (file.name.match(/\.ofx$/i)) {
      const text = await file.text();
      const txMatches = [...text.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];
      parsed = txMatches.map(m => {
        const block = m[1];
        const get = (tag) => { const match = block.match(new RegExp(`<${tag}>([^<\\n]+)`, 'i')); return match?.[1]?.trim()||""; };
        const dateRaw = get("DTPOSTED").slice(0,8);
        const date = dateRaw ? `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}` : fmt(TODAY);
        const amount = parseFloat(get("TRNAMT").replace(",",".")) || 0;
        const desc = get("MEMO") || get("NAME") || "Transação";
        if (!amount) return null;
        return { id:"imp_"+Math.random().toString(36).slice(2), date, description:desc, amount, accountId:selAcc, category:"outros", keep:true, internalTransfer:false };
      }).filter(Boolean);
      if (!parsed.length) { alert("Não foi possível interpretar o OFX."); setStep("idle"); return; }
    } else {
      alert("Formato não suportado.\nFormatos aceitos: PDF, CSV, OFX");
      setStep("idle"); return;
    }

    // detect internal transfers
    const withInternal = parsed.map(r => ({
      ...r,
      internalTransfer: detectInternalTransfer(r.description, accounts),
      category: detectInternalTransfer(r.description, accounts) ? "transferencia" : "outros"
    }));

    // detect duplicates
    const dups = withInternal.filter(r =>
      allTxs.some(t => t.accountId===r.accountId && t.date===r.date && Math.abs(t.amount)===Math.abs(r.amount) && t.description.toLowerCase()===r.description.toLowerCase())
    );
    setDups(dups.map(d=>d.id));
    const deduped = withInternal.map(r => ({ ...r, keep: !dups.find(d=>d.id===r.id) }));

    setRows(deduped);
    setSaldoExtratoFinal(saldoFinal);
    setStep("review");

    // Classify with AI
    setCls(true);
    const updated = await Promise.all(deduped.map(async r => {
      if (r.internalTransfer) return r;
      return { ...r, category: await classifyTx(r.description) };
    }));
    setRows(updated);
    setCls(false);
  };

  const toggle  = (id) => setRows(rs=>rs.map(r=>r.id===id?{...r,keep:!r.keep}:r));
  const setCat  = (id,cat) => setRows(rs=>rs.map(r=>r.id===id?{...r,category:cat}:r));

  const confirmImport = () => {
    const toImport = rows.filter(r=>r.keep);
    onImport(toImport, selAcc, saldoExtratoFinal);
    setStep("done");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
        <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:6 }}>Importar Extrato Bancário</div>
        <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>
          Upload do extrato. A IA classifica automaticamente cada linha.
        </div>
        <div style={{ fontSize:12, color:C.goldDim, fontFamily:"'DM Sans',sans-serif", marginBottom:22 }}>
          ✓ PDF (Itaú, Nubank, PicPay) · ✓ CSV · ✓ OFX · ✓ Transferências internas detectadas · ✓ Duplicatas marcadas
        </div>

        {step==="idle" && (
          <div style={{ display:"flex", gap:14, alignItems:"flex-end", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CONTA DESTINO</div>
              <select style={{ ...IS, width:"auto" }} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <label style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.gold, color:C.bg, borderRadius:8, padding:"10px 22px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              📁 Selecionar arquivo
              <input type="file" accept=".csv,.txt,.ofx,.pdf" style={{ display:"none" }} onChange={handleFile} />
            </label>
          </div>
        )}

        {step==="parsing" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, color:C.blue, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${C.blue}`, borderTopColor:"transparent", animation:"spin 1s linear infinite", flexShrink:0 }} />
              {pdfStatus || "Processando arquivo..."}
            </div>
          </div>
        )}

        {step==="done" && (
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ color:C.green, fontFamily:"'DM Sans',sans-serif" }}>✅ Importação concluída!</div>
            <button onClick={()=>setStep("idle")} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, padding:"8px 16px", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Nova importação</button>
          </div>
        )}
      </div>

      {step==="review" && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ fontSize:15, color:C.text, fontFamily:"'Cormorant Garamond',serif" }}>{rows.length} movimentações</span>
              {dupWarnings.length>0 && <span style={{ fontSize:12, color:C.gold, fontFamily:"'DM Sans',sans-serif" }}>⚠️ {dupWarnings.length} possível(is) duplicata(s) desmarcada(s)</span>}
              {classifying && <span style={{ fontSize:12, color:C.blue, fontFamily:"'DM Sans',sans-serif" }}>🤖 IA classificando...</span>}
            </div>
            <button onClick={confirmImport} disabled={classifying} style={{
              background: classifying?C.border:C.gold, color:C.bg, border:"none", borderRadius:8,
              padding:"9px 22px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor: classifying?"not-allowed":"pointer"
            }}>Importar {rows.filter(r=>r.keep).length} lançamentos</button>
          </div>
          <div style={{ maxHeight:460, overflowY:"auto" }}>
            {rows.map((r,i)=>{
              const cat = catOf(r.category);
              const isDup = dupWarnings.includes(r.id);
              return (
                <div key={r.id}>
                  {i>0&&<Divider/>}
                  <div style={{ display:"grid", gridTemplateColumns:"40px 75px 1fr 140px 105px", alignItems:"center", padding:"10px 16px", opacity:r.keep?1:.4, background: isDup?"#e0a02008":"transparent" }}>
                    <input type="checkbox" checked={r.keep} onChange={()=>toggle(r.id)} style={{ accentColor:C.gold, width:16, height:16 }} />
                    <div style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{fdate(r.date)}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {r.internalTransfer && <span style={{ fontSize:10, background:C.blue+"22", color:C.blue, border:`1px solid ${C.blue}44`, borderRadius:4, padding:"1px 5px" }}>INT</span>}
                      {isDup && <span style={{ fontSize:10, background:C.gold+"22", color:C.gold, border:`1px solid ${C.gold}44`, borderRadius:4, padding:"1px 5px" }}>DUP?</span>}
                      <span style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{r.description}</span>
                    </div>
                    <select value={r.category} onChange={e=>setCat(r.id,e.target.value)} style={{ ...IS, fontSize:11, padding:"4px 8px", width:"auto" }}>
                      {DEFAULT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                    <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:r.amount>0?C.green:C.text, textAlign:"right" }}>
                      {r.amount>0?"+":""}{brl(r.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── COMPROVANTES (OCR) ───────────────────────────────────────────────────────
const Comprovantes = ({ accounts, onAddTx }) => {
  const [step, setStep]     = useState("idle"); // idle | processing | review | done
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [form, setForm]       = useState(null);
  const [selAcc, setSelAcc]   = useState(accounts[0]?.id||"");
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep("processing"); setResult(null);

    // preview
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // base64 for API
    const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
    const mime = file.type || "image/jpeg";

    const parsed = await ocrComprovante(b64, mime);
    if (!parsed) { alert("Não foi possível extrair dados do comprovante. Tente outra imagem."); setStep("idle"); return; }

    const tx = {
      id: "tx_"+Date.now(),
      accountId: selAcc,
      date: parsed.data || fmt(TODAY),
      description: parsed.estabelecimento || parsed.descricao || "Comprovante",
      amount: -(Math.abs(parsed.valor||0)),
      category: parsed.categoria || "outros",
      notes: parsed.descricao || "",
      internalTransfer: false,
      type: "despesa"
    };
    setForm(tx);
    setResult(parsed);
    setStep("review");
  };

  const confirm = () => {
    onAddTx({ ...form, amount: form.type==="receita" ? Math.abs(form.amount) : -Math.abs(form.amount) });
    setStep("done");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
        <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:6 }}>Comprovantes & Notas Fiscais</div>
        <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>
          Foto ou PDF de cupom fiscal, nota, recibo ou comprovante de cartão.
        </div>
        <div style={{ fontSize:12, color:C.goldDim, fontFamily:"'DM Sans',sans-serif", marginBottom:22 }}>
          🤖 A IA extrai data, valor, estabelecimento e categoria automaticamente
        </div>

        {(step==="idle"||step==="done") && (
          <div style={{ display:"flex", gap:14, alignItems:"flex-end", flexWrap:"wrap" }}>
            {step==="done" && <div style={{ color:C.green, fontFamily:"'DM Sans',sans-serif", fontSize:14, marginRight:10 }}>✅ Lançamento criado!</div>}
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CONTA</div>
              <select style={{ ...IS, width:"auto" }} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <label style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.gold, color:C.bg, borderRadius:8, padding:"10px 22px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
              📷 Enviar comprovante
              <input type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={handleFile} />
            </label>
          </div>
        )}

        {step==="processing" && (
          <div style={{ display:"flex", alignItems:"center", gap:12, color:C.blue, fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${C.blue}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }} />
            IA analisando o comprovante...
          </div>
        )}
      </div>

      {step==="review" && form && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          {/* Preview */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Comprovante</div>
            {preview && <img src={preview} alt="comprovante" style={{ maxHeight:380, objectFit:"contain", borderRadius:10, border:`1px solid ${C.border}` }} />}
            {result && (
              <div style={{ background:C.bg, borderRadius:10, padding:14, display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:11, color:C.goldDim, letterSpacing:2, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>Dados extraídos pela IA</div>
                {[["Estabelecimento", result.estabelecimento],["Data",result.data],["Valor",result.valor?brl(result.valor):null],["Categoria",result.categoria],["Descrição",result.descricao]].map(([k,v])=>v&&(
                  <div key={k} style={{ display:"flex", gap:8, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
                    <span style={{ color:C.muted, minWidth:110 }}>{k}:</span>
                    <span style={{ color:C.soft }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de revisão */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:16, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:20 }}>Revisar e confirmar</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", gap:8 }}>
                {[["despesa","💸 Despesa",C.red],["receita","💰 Receita",C.green]].map(([t,l,col])=>(
                  <button key={t} onClick={()=>sf("type",t)} style={{ flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                    background:form.type===t?col+"22":"transparent", border:`1px solid ${form.type===t?col:C.border}`, color:form.type===t?col:C.muted }}>{l}</button>
                ))}
              </div>
              {[
                ["DESCRIÇÃO","description","text","Estabelecimento"],
                ["DATA","date","date",""],
              ].map(([label,key,type,ph])=>(
                <div key={key}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
                  <input type={type} style={IS} placeholder={ph} value={form[key]||""} onChange={e=>sf(key,e.target.value)} />
                </div>
              ))}
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>VALOR (R$)</div>
                <input style={IS} placeholder="0,00" value={Math.abs(form.amount)||""} onChange={e=>sf("amount",e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CONTA</div>
                <select style={IS} value={form.accountId} onChange={e=>sf("accountId",e.target.value)}>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CATEGORIA</div>
                <select style={IS} value={form.category} onChange={e=>sf("category",e.target.value)}>
                  {DEFAULT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>NOTAS</div>
                <input style={IS} placeholder="Observações..." value={form.notes||""} onChange={e=>sf("notes",e.target.value)} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={confirm} style={{ flex:1, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"12px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                ✓ Confirmar lançamento
              </button>
              <button onClick={()=>setStep("idle")} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── METAS ────────────────────────────────────────────────────────────────────
const Metas = ({ transactions }) => {
  const [goals, setGoals] = useState(() => loadGoals());
  const [editing, setEditing] = useState(null); // catId being edited
  const [draft, setDraft]     = useState("");

  const month  = fmt(TODAY).slice(0,7);
  const thisM  = transactions.filter(t=>t.date.startsWith(month)&&t.amount<0&&!t.internalTransfer);
  const byCat  = {};
  thisM.forEach(t=>{ byCat[t.category]=(byCat[t.category]||0)+Math.abs(t.amount); });

  const spendable = DEFAULT_CATEGORIES.filter(c=>!["receita","transferencia"].includes(c.id));

  const saveGoal = (id) => {
    const val = parseFloat(draft.replace(",","."));
    const next = { ...goals };
    if (!isNaN(val) && val > 0) next[id] = val; else delete next[id];
    setGoals(next); saveGoals(next); setEditing(null); setDraft("");
  };

  const removeGoal = (id) => {
    const next = { ...goals }; delete next[id];
    setGoals(next); saveGoals(next);
  };

  const totalGoals = Object.values(goals).reduce((s,v)=>s+v,0);
  const totalSpent = Object.entries(byCat).filter(([id])=>goals[id]).reduce((s,[,v])=>s+v,0);
  const overCount  = Object.entries(goals).filter(([id,lim])=>(byCat[id]||0)>lim).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Resumo */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label="Orçamento total/mês" value={brl(totalGoals)}  icon="🎯" color={C.goldLight} sub={`${Object.keys(goals).length} categorias`} />
        <StatCard label="Gasto c/ meta"       value={brl(totalSpent)}  icon="📊" color={totalSpent>totalGoals?C.red:C.green} sub="nas categorias com limite" />
        <StatCard label="Categorias no limite" value={`${overCount}`}  icon="🚨" color={overCount>0?C.red:C.green} sub={overCount>0?"atenção necessária":"tudo ok"} />
      </div>

      {/* Aviso geral */}
      {overCount>0 && (
        <div style={{ background:C.red+"15", border:`1px solid ${C.red}40`, borderRadius:12, padding:"14px 20px", fontSize:13, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>
          🚨 <strong style={{color:C.red}}>{overCount} categoria{overCount>1?"s":""}</strong> ultrapassou{overCount>1?"m":""} a meta este mês.
        </div>
      )}

      {/* Grade de categorias */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 110px 180px 80px", padding:"10px 20px", background:C.surface, borderBottom:`1px solid ${C.border}` }}>
          {["Categoria","Gasto","Meta","Progresso",""].map((h,i)=>(
            <div key={i} style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>{h}</div>
          ))}
        </div>

        {spendable.map((cat, i) => {
          const spent = byCat[cat.id] || 0;
          const goal  = goals[cat.id];
          const pct   = goal ? Math.min(spent/goal*100, 100) : 0;
          const over  = goal && spent > goal;
          const warn  = goal && spent/goal > 0.8 && !over;
          const barColor = over ? C.red : warn ? C.gold : C.green;
          const isEditing = editing === cat.id;

          return (
            <div key={cat.id}>
              {i>0 && <div style={{ height:1, background:C.border }} />}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 110px 180px 80px", padding:"13px 20px", alignItems:"center" }}>
                {/* Cat name */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>{cat.icon}</span>
                  <span style={{ fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{cat.label}</span>
                  {over  && <span style={{ fontSize:10, background:C.red+"22", color:C.red,  border:`1px solid ${C.red}44`,  borderRadius:4, padding:"1px 6px" }}>ACIMA</span>}
                  {warn  && <span style={{ fontSize:10, background:C.gold+"22",color:C.gold, border:`1px solid ${C.gold}44`, borderRadius:4, padding:"1px 6px" }}>ATENÇÃO</span>}
                </div>
                {/* Gasto */}
                <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color: over?C.red:spent>0?C.text:C.muted }}>
                  {spent>0 ? brl(spent) : "—"}
                </div>
                {/* Meta */}
                <div>
                  {isEditing ? (
                    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                      <input autoFocus style={{ ...IS, width:72, padding:"5px 8px", fontSize:12 }}
                        placeholder="0,00" value={draft} onChange={e=>setDraft(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter") saveGoal(cat.id); if(e.key==="Escape"){setEditing(null);setDraft("");} }} />
                      <button onClick={()=>saveGoal(cat.id)} style={{ background:C.gold, border:"none", color:C.bg, borderRadius:6, padding:"5px 8px", fontSize:11, cursor:"pointer" }}>✓</button>
                    </div>
                  ) : (
                    <span style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", color:goal?C.soft:C.muted, cursor:"pointer" }}
                      onClick={()=>{ setEditing(cat.id); setDraft(goal?String(goal):""); }}>
                      {goal ? brl(goal) : <span style={{fontSize:12,color:C.border}}>+ definir</span>}
                    </span>
                  )}
                </div>
                {/* Barra */}
                <div>
                  {goal ? (
                    <div>
                      <div style={{ height:6, background:C.border, borderRadius:6, marginBottom:3 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:barColor, borderRadius:6, transition:"width .4s" }} />
                      </div>
                      <div style={{ fontSize:10, color: over?C.red:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
                        {pct.toFixed(0)}% {over?`(+${brl(spent-goal)})`:goal?`(faltam ${brl(goal-spent)})`:""}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:C.border, fontFamily:"'DM Sans',sans-serif" }}>sem meta definida</div>
                  )}
                </div>
                {/* Ações */}
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={()=>{ setEditing(cat.id); setDraft(goal?String(goal):""); }}
                    style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:"3px 5px" }} title="Editar">✏️</button>
                  {goal && <button onClick={()=>removeGoal(cat.id)}
                    style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:"3px 5px" }} title="Remover">🗑️</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
        💡 Clique em <strong style={{color:C.soft}}>+ definir</strong> ou no ✏️ para definir uma meta mensal por categoria. As metas ficam salvas localmente e aparecem como alerta no Dashboard quando ultrapassadas.
      </div>
    </div>
  );
};

// ─── CONTAS (com CRUD) ────────────────────────────────────────────────────────
const ACCOUNTS_KEY = "fontanezzi_accounts";

const ACCOUNT_COLORS = ["#9b59b6","#c9a84c","#e05c9b","#4caf82","#4c8ec9","#e05c5c","#5cc9e0","#e08c4c","#6b6f7d"];

const ContasView = ({ accounts, setAccounts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editAcc, setEditAcc]   = useState(null);
  const [form, setForm] = useState({ name:"", type:"corrente", owner:"rodrigo", balance:"", color:ACCOUNT_COLORS[0] });
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const openNew  = () => { setForm({ name:"", type:"corrente", owner:"rodrigo", balance:"", color:ACCOUNT_COLORS[0] }); setEditAcc(null); setShowForm(true); };
  const openEdit = (a) => { setForm({ ...a, balance:String(a.balance) }); setEditAcc(a); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const bal = parseFloat(String(form.balance).replace(",",".")) || 0;
    const acc = { ...form, id: editAcc?.id || ("acc_"+Date.now()), balance: bal };
    const next = editAcc ? accounts.map(a=>a.id===acc.id?acc:a) : [...accounts, acc];
    setAccounts(next);
    // Save to Supabase
    const tbl = await dbFrom("accounts");
    if (tbl) {
      if (editAcc) await tbl.update(acc, { id: acc.id });
      else await tbl.insert(acc);
    }
    setShowForm(false); setEditAcc(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir esta conta?")) return;
    const next = accounts.filter(a=>a.id!==id);
    setAccounts(next);
    const tbl = await dbFrom("accounts");
    if (tbl) await tbl.del({ id });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={openNew} style={{ background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
          + Nova conta
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
        {accounts.map(a=>(
          <div key={a.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, width:4, height:"100%", background:a.color }} />
            <div style={{ paddingLeft:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:16, color:C.text, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{a.name}</div>
                  <div style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{typeLabel[a.type]||a.type}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge color={a.color}>{ownerLabel[a.owner]||a.owner}</Badge>
                </div>
              </div>
              <div style={{ fontSize:28, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:a.balance>=0?C.text:C.red, marginBottom:14 }}>
                {brl(a.balance)}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>openEdit(a)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"5px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>✏️ Editar</button>
                <button onClick={()=>handleDelete(a.id)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"5px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>🗑️ Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
        <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
          💡 <strong style={{color:C.soft}}>Transferências internas</strong> entre contas desta lista são detectadas automaticamente na importação de extrato — evitando duplicidade nos relatórios.
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"center", justifyContent:"center", zIndex:150 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:36, width:460, maxWidth:"95vw" }}>
            <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:24 }}>
              {editAcc ? "Editar conta" : "Nova conta"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>NOME DA CONTA</div>
                <input style={IS} placeholder="Ex: Nubank - Rodrigo" value={form.name} onChange={e=>sf("name",e.target.value)} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>TIPO</div>
                  <select style={IS} value={form.type} onChange={e=>sf("type",e.target.value)}>
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Poupança</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>TITULAR</div>
                  <select style={IS} value={form.owner} onChange={e=>sf("owner",e.target.value)}>
                    <option value="rodrigo">👨 Rodrigo</option>
                    <option value="claudia">👩 Cláudia</option>
                    <option value="casal">💑 Casal</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>SALDO ATUAL (R$)</div>
                <input style={IS} placeholder="0,00" value={form.balance} onChange={e=>sf("balance",e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}>COR</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {ACCOUNT_COLORS.map(col=>(
                    <button key={col} onClick={()=>sf("color",col)} style={{
                      width:28, height:28, borderRadius:"50%", background:col, border: form.color===col?`3px solid ${C.text}`:`2px solid transparent`,
                      cursor:"pointer", flexShrink:0
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              <button onClick={handleSave} style={{ flex:1, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"12px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                Salvar
              </button>
              <button onClick={()=>{setShowForm(false);setEditAcc(null);}} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 20px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CARTEIRA ─────────────────────────────────────────────────────────────────
const CASH_STORAGE_KEY = "fontanezzi_cash_txs";

function loadCashTxs() {
  try { return JSON.parse(localStorage.getItem(CASH_STORAGE_KEY)) || []; } catch { return []; }
}
function saveCashTxs(txs) {
  localStorage.setItem(CASH_STORAGE_KEY, JSON.stringify(txs));
}

const Carteira = ({ accounts }) => {
  const [cashTxs, setCashTxs] = useState(() => loadCashTxs());
  const [showForm, setShowForm] = useState(false);
  const [editCash, setEditCash] = useState(null);
  const [form, setForm] = useState({ date: fmt(TODAY), description: "", amount: "", type: "saida", category: "outros", notes: "" });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cashBalance = cashTxs.reduce((s, t) => s + t.amount, 0);
  const accountsTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const grandTotal = accountsTotal + cashBalance;

  const openNew = () => { setForm({ date: fmt(TODAY), description: "", amount: "", type: "saida", category: "outros", notes: "" }); setEditCash(null); setShowForm(true); };
  const openEdit = (tx) => { setEditCash(tx); setForm({ ...tx, type: tx.amount >= 0 ? "entrada" : "saida", amount: Math.abs(tx.amount).toString() }); setShowForm(true); };

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) return;
    const amt = parseFloat(form.amount.replace(",", "."));
    if (isNaN(amt)) return;
    const tx = { ...form, id: editCash?.id || ("cash_" + Date.now()), amount: form.type === "entrada" ? Math.abs(amt) : -Math.abs(amt) };
    const next = editCash
      ? cashTxs.map(t => t.id === tx.id ? tx : t)
      : [tx, ...cashTxs];
    setCashTxs(next);
    saveCashTxs(next);
    setShowForm(false); setEditCash(null);
  };

  const handleDelete = (id) => {
    const next = cashTxs.filter(t => t.id !== id);
    setCashTxs(next); saveCashTxs(next);
  };

  // group accounts by owner for display
  const grouped = {
    rodrigo: accounts.filter(a => a.owner === "rodrigo"),
    claudia:  accounts.filter(a => a.owner === "claudia"),
    casal:    accounts.filter(a => a.owner === "casal"),
    investimento: accounts.filter(a => a.type === "investimento"),
  };

  const SectionHeader = ({ label }) => (
    <div style={{ fontSize: 10, color: C.goldDim, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: 10, marginTop: 4 }}>{label}</div>
  );

  const AccountRow = ({ a }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans',sans-serif" }}>{a.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{typeLabel[a.type] || a.type}</div>
        </div>
      </div>
      <div style={{ fontSize: 16, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: a.balance >= 0 ? C.text : C.red }}>
        {brl(a.balance)}
      </div>
    </div>
  );

  // Subtotals
  const subOf = (arr) => arr.reduce((s, a) => s + a.balance, 0);
  const correntes = accounts.filter(a => a.type !== "investimento");
  const investimentos = accounts.filter(a => a.type === "investimento");

  const recentCash = [...cashTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PATRIMÔNIO TOTAL ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, #1e2535 0%, #2d3550 100%)`,
        borderRadius: 20, padding: "28px 28px",
      }}>
        <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>Patrimônio disponível total</div>
        <div style={{ fontSize: 44, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: grandTotal >= 0 ? "#f0c060" : "#ef4444", lineHeight: 1, marginBottom: 6 }}>{brl(grandTotal)}</div>
        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans',sans-serif", marginBottom: 20 }}>Contas bancárias + dinheiro em espécie</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["🏦 Contas", brl(accountsTotal), "#60a5fa"],
            ["💵 Dinheiro", brl(cashBalance), cashBalance >= 0 ? "#34d399" : "#f87171"],
          ].map(([label, val, col]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 16px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: col }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>

        {/* ── CONTAS BANCÁRIAS ─────────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}>Contas bancárias</div>

          {/* Rodrigo */}
          {grouped.rodrigo.filter(a=>a.type!=="investimento").length > 0 && <>
            <SectionHeader label="👨 Rodrigo" />
            {grouped.rodrigo.filter(a=>a.type!=="investimento").map(a => <AccountRow key={a.id} a={a} />)}
          </>}

          {/* Cláudia */}
          {grouped.claudia.filter(a=>a.type!=="investimento").length > 0 && <>
            <SectionHeader label="👩 Cláudia" />
            {grouped.claudia.filter(a=>a.type!=="investimento").map(a => <AccountRow key={a.id} a={a} />)}
          </>}

          {/* Casal */}
          {grouped.casal.filter(a=>a.type!=="investimento").length > 0 && <>
            <SectionHeader label="💑 Casal" />
            {grouped.casal.filter(a=>a.type!=="investimento").map(a => <AccountRow key={a.id} a={a} />)}
          </>}

          {/* Investimentos */}
          {investimentos.length > 0 && <>
            <SectionHeader label="📈 Investimentos" />
            {investimentos.map(a => <AccountRow key={a.id} a={a} />)}
          </>}

          {/* Subtotais */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
            {correntes.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Subtotal contas correntes</span>
                <span style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.soft }}>{brl(subOf(correntes))}</span>
              </div>
            )}
            {investimentos.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Subtotal investimentos</span>
                <span style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.blue }}>{brl(subOf(investimentos))}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Total contas</span>
              <span style={{ fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.goldLight }}>{brl(accountsTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── DINHEIRO ─────────────────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Header dinheiro */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>💵 Dinheiro em espécie</div>
              <div style={{ fontSize: 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: cashBalance >= 0 ? C.green : C.red, lineHeight: 1 }}>
                {brl(cashBalance)}
              </div>
            </div>
            <button onClick={openNew} style={{
              background: C.gold, color: C.bg, border: "none", borderRadius: 8,
              padding: "9px 16px", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer"
            }}>+ Lançar</button>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
            {[
              ["Entradas", cashTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0), C.green],
              ["Saídas",   cashTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0), C.red],
            ].map(([label, val, col]) => (
              <div key={label} style={{ padding: "12px 20px", borderRight: label==="Entradas"?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: col }}>{brl(val)}</div>
              </div>
            ))}
          </div>

          {/* Lançamentos cash */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 380 }}>
            {recentCash.length === 0 && (
              <div style={{ padding: "32px 24px", textAlign: "center", color: C.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                Nenhum lançamento em dinheiro.<br/>
                <span style={{ color: C.goldDim }}>Clique em "+ Lançar" para começar.</span>
              </div>
            )}
            {recentCash.map((t, i) => {
              const cat = catOf(t.category);
              return (
                <div key={t.id}>
                  {i > 0 && <div style={{ height: 1, background: C.border }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px" }}>
                    <div style={{ fontSize: 18 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{fdate(t.date)} · {cat.label}</div>
                    </div>
                    <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: t.amount > 0 ? C.green : C.text, minWidth: 80, textAlign: "right" }}>
                      {t.amount > 0 ? "+" : ""}{brl(t.amount)}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={() => openEdit(t)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>✏️</button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "3px 5px" }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FORM DINHEIRO ────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, width: 440, maxWidth: "95vw" }}>
            <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond',serif", color: C.text, marginBottom: 24 }}>
              {editCash ? "Editar lançamento em dinheiro" : "Novo lançamento em dinheiro"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Tipo */}
              <div style={{ display: "flex", gap: 8 }}>
                {[["saida","💸 Saída",C.red],["entrada","💵 Entrada",C.green]].map(([t,l,col])=>(
                  <button key={t} onClick={()=>sf("type",t)} style={{
                    flex:1, padding:"10px", borderRadius:8, fontSize:13, fontWeight:500,
                    fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                    background: form.type===t ? col+"22" : "transparent",
                    border: `1px solid ${form.type===t ? col : C.border}`,
                    color: form.type===t ? col : C.muted
                  }}>{l}</button>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>DESCRIÇÃO</div>
                <input style={IS} placeholder="Ex: Feira, estacionamento..." value={form.description} onChange={e=>sf("description",e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>VALOR (R$)</div>
                  <input style={IS} placeholder="0,00" value={form.amount} onChange={e=>sf("amount",e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>DATA</div>
                  <input type="date" style={IS} value={form.date} onChange={e=>sf("date",e.target.value)} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>CATEGORIA</div>
                <select style={IS} value={form.category} onChange={e=>sf("category",e.target.value)}>
                  {DEFAULT_CATEGORIES.filter(c=>c.id!=="receita"&&c.id!=="transferencia").map(c=>(
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>NOTAS</div>
                <input style={IS} placeholder="Observações..." value={form.notes} onChange={e=>sf("notes",e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={handleSave} style={{ flex: 1, background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                Salvar
              </button>
              <button onClick={() => { setShowForm(false); setEditCash(null); }} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 20px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [mode, setMode]       = useState("login"); // login | signup
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [pass2, setPass2]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  const hasCreds = !!localStorage.getItem("sb_url");

  const handle = async () => {
    if (!hasCreds) { setError("Configure o Supabase primeiro nas ⚙ Configurações abaixo."); return; }
    if (!email || !pass) { setError("Preencha e-mail e senha."); return; }
    if (mode === "signup" && pass !== pass2) { setError("As senhas não coincidem."); return; }
    setLoading(true); setError(""); setInfo("");
    if (mode === "signup") {
      const { error: e } = await sbSignUp(email, pass);
      if (e) { setError(e); }
      else { setInfo("Conta criada! Verifique seu e-mail para confirmar, depois faça login."); setMode("login"); }
    } else {
      const { error: e } = await sbSignIn(email, pass);
      if (e) setError(e);
      else onLogin();
    }
    setLoading(false);
  };

  const [showConfig, setShowConfig] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} body{background:${C.bg};}`}</style>

      {showConfig && <SupabaseConfig onSave={()=>setShowConfig(false)} onClose={()=>setShowConfig(false)} />}

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:11, color:C.goldDim, letterSpacing:4, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Família</div>
        <div style={{ fontSize:42, fontFamily:"'Cormorant Garamond',serif", color:C.goldLight, fontWeight:600, lineHeight:1 }}>Fontanezzi</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:8, fontFamily:"'DM Sans',sans-serif" }}>Controle Financeiro</div>
      </div>

      {/* Card */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:400 }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:0, marginBottom:28, background:C.bg, borderRadius:10, padding:4 }}>
          {[["login","Entrar"],["signup","Criar conta"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setInfo("");}} style={{
              flex:1, padding:"9px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13,
              fontFamily:"'DM Sans',sans-serif", fontWeight:500,
              background: mode===m ? C.surface : "transparent",
              color: mode===m ? C.text : C.muted,
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>E-MAIL</div>
            <input style={IS} type="email" placeholder="seu@email.com" value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>SENHA</div>
            <input style={IS} type="password" placeholder="••••••••" value={pass}
              onChange={e=>setPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
          {mode==="signup" && (
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CONFIRMAR SENHA</div>
              <input style={IS} type="password" placeholder="••••••••" value={pass2}
                onChange={e=>setPass2(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handle()} />
            </div>
          )}

          {error && <div style={{ fontSize:12, color:C.red, fontFamily:"'DM Sans',sans-serif", background:C.red+"15", borderRadius:8, padding:"10px 14px" }}>{error}</div>}
          {info  && <div style={{ fontSize:12, color:C.green, fontFamily:"'DM Sans',sans-serif", background:C.green+"15", borderRadius:8, padding:"10px 14px" }}>{info}</div>}

          <button onClick={handle} disabled={loading} style={{
            background: loading ? C.border : C.gold, color: C.bg, border:"none", borderRadius:10,
            padding:"14px", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
            cursor: loading?"not-allowed":"pointer", marginTop:4,
          }}>
            {loading ? "Aguarde..." : mode==="login" ? "Entrar" : "Criar conta"}
          </button>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>ou</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* Google */}
          <button onClick={sbSignInGoogle} disabled={!hasCreds} style={{
            background:"transparent", border:`1px solid ${C.border}`, borderRadius:10,
            padding:"13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
            color:C.soft, display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.7-4.3-13.6-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>

      {/* Config link */}
      <button onClick={()=>setShowConfig(true)} style={{
        marginTop:24, background:"transparent", border:"none", color:C.muted,
        fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
      }}>
        {hasCreds ? "✅ Supabase configurado" : "⚙ Configurar Supabase"} →
      </button>
    </div>
  );
};

// ─── DÍVIDAS ──────────────────────────────────────────────────────────────────
const DIVIDAS_KEY = "fontanezzi_dividas";
function loadDividas() { try { return JSON.parse(localStorage.getItem(DIVIDAS_KEY)) || []; } catch { return []; } }
function saveDividas(d) { localStorage.setItem(DIVIDAS_KEY, JSON.stringify(d)); }

const DIVIDA_TIPOS = [
  { id:"financiamento", label:"Financiamento",  icon:"🏠" },
  { id:"veiculo",       label:"Veículo",         icon:"🚗" },
  { id:"cartao",        label:"Cartão Crédito",  icon:"💳" },
  { id:"emprestimo",    label:"Empréstimo",      icon:"🏦" },
  { id:"parcelamento",  label:"Parcelamento",    icon:"🛍️" },
  { id:"consignado",    label:"Consignado",      icon:"📋" },
  { id:"outro",         label:"Outro",           icon:"📦" },
];

const Dividas = () => {
  const [dividas, setDividas]   = useState(() => loadDividas());
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const blank = { nome:"", tipo:"financiamento", valorTotal:"", valorParcela:"", parcelasPagas:"", totalParcelas:"", vencimentoDia:"", jurosAnual:"", credor:"", obs:"" };
  const [form, setForm] = useState(blank);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const openNew  = () => { setForm(blank); setEditItem(null); setShowForm(true); };
  const openEdit = (d) => { setEditItem(d); setForm({...d}); setShowForm(true); };

  const handleSave = () => {
    if (!form.nome.trim()) return;
    const item = { ...form, id: editItem?.id || ("div_"+Date.now()),
      valorTotal:   parseFloat(String(form.valorTotal).replace(",","."))||0,
      valorParcela: parseFloat(String(form.valorParcela).replace(",","."))||0,
      parcelasPagas:  parseInt(form.parcelasPagas)||0,
      totalParcelas:  parseInt(form.totalParcelas)||0,
      jurosAnual:   parseFloat(String(form.jurosAnual).replace(",","."))||0,
    };
    const next = editItem ? dividas.map(d=>d.id===item.id?item:d) : [...dividas, item];
    setDividas(next); saveDividas(next);
    setShowForm(false); setEditItem(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Excluir esta dívida?")) return;
    const next = dividas.filter(d=>d.id!==id);
    setDividas(next); saveDividas(next);
  };

  // Totals
  const totalDevido    = dividas.reduce((s,d) => s + (d.valorParcela*(d.totalParcelas-d.parcelasPagas)||0), 0);
  const totalMensal    = dividas.reduce((s,d) => s + (d.valorParcela||0), 0);
  const totalOriginal  = dividas.reduce((s,d) => s + (d.valorTotal||0), 0);

  const tipoOf = (id) => DIVIDA_TIPOS.find(t=>t.id===id) || DIVIDA_TIPOS.at(-1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label="Total em dívidas"   value={brl(totalDevido)}   icon="📉" color={C.red}      sub="saldo restante" />
        <StatCard label="Parcelas/mês"        value={brl(totalMensal)}   icon="📅" color={C.gold}     sub={`${dividas.length} dívida${dividas.length!==1?"s":""} ativas`} />
        <StatCard label="Valor original total" value={brl(totalOriginal)} icon="🏦" color={C.muted}   sub="soma dos contratos" />
      </div>

      {/* Lista */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={openNew} style={{ background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
          + Nova dívida
        </button>
      </div>

      {dividas.length === 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"40px 24px", textAlign:"center", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          Nenhuma dívida cadastrada. Toque em <strong style={{color:C.soft}}>+ Nova dívida</strong> para começar.
        </div>
      )}

      {dividas.map(d => {
        const tipo = tipoOf(d.tipo);
        const restante = d.totalParcelas > 0 ? d.totalParcelas - d.parcelasPagas : 0;
        const saldoRestante = (d.valorParcela||0) * restante;
        const pct = d.totalParcelas > 0 ? Math.round(d.parcelasPagas/d.totalParcelas*100) : 0;
        const mesesRestantes = restante;
        const anosMeses = mesesRestantes >= 12
          ? `${Math.floor(mesesRestantes/12)}a ${mesesRestantes%12}m`
          : `${mesesRestantes}m`;

        return (
          <div key={d.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:24 }}>{tipo.icon}</span>
                <div>
                  <div style={{ fontSize:16, color:C.text, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{d.nome}</div>
                  <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, background:C.border, color:C.muted, borderRadius:4, padding:"2px 8px", fontFamily:"'DM Sans',sans-serif" }}>{tipo.label}</span>
                    {d.credor && <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{d.credor}</span>}
                    {d.jurosAnual>0 && <span style={{ fontSize:11, color:C.gold, fontFamily:"'DM Sans',sans-serif" }}>{d.jurosAnual}% a.a.</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>openEdit(d)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>✏️</button>
                <button onClick={()=>handleDelete(d.id)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:7, padding:"5px 10px", fontSize:12, cursor:"pointer" }}>🗑️</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:"16px 20px" }}>
              {/* Valores */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:14, marginBottom:16 }}>
                {[
                  ["Parcela mensal", brl(d.valorParcela||0), C.text],
                  ["Saldo restante", brl(saldoRestante), C.red],
                  ["Vencimento", d.vencimentoDia ? `Dia ${d.vencimentoDia}` : "—", C.gold],
                  ["Tempo restante", d.totalParcelas>0 ? anosMeses : "—", C.blue],
                ].map(([label,val,col])=>(
                  <div key={label}>
                    <div style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:3, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
                    <div style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:col }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Progresso */}
              {d.totalParcelas > 0 && (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
                      {d.parcelasPagas} de {d.totalParcelas} parcelas pagas
                    </span>
                    <span style={{ fontSize:12, color: pct>=100?C.green:C.soft, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{pct}%</span>
                  </div>
                  <div style={{ height:8, background:C.border, borderRadius:8 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background: pct>=100?C.green:pct>=50?C.gold:C.blue, borderRadius:8, transition:"width .5s" }} />
                  </div>
                  {d.obs && <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:8 }}>📝 {d.obs}</div>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Form modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:150, overflowY:"auto", padding:"20px 16px" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:28, width:"100%", maxWidth:480, marginTop:"auto", marginBottom:"auto" }}>
            <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.text, marginBottom:22 }}>
              {editItem ? "Editar dívida" : "Nova dívida"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>NOME</div>
                <input style={IS} placeholder="Ex: Financiamento casa, Carro, etc." value={form.nome} onChange={e=>sf("nome",e.target.value)} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>TIPO</div>
                  <select style={IS} value={form.tipo} onChange={e=>sf("tipo",e.target.value)}>
                    {DIVIDA_TIPOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CREDOR</div>
                  <input style={IS} placeholder="Ex: Itaú, Bradesco..." value={form.credor} onChange={e=>sf("credor",e.target.value)} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>VALOR ORIGINAL (R$)</div>
                  <input style={IS} placeholder="0,00" value={form.valorTotal} onChange={e=>sf("valorTotal",e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>PARCELA (R$)</div>
                  <input style={IS} placeholder="0,00" value={form.valorParcela} onChange={e=>sf("valorParcela",e.target.value)} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>PARCELAS PAGAS</div>
                  <input style={IS} placeholder="0" type="number" value={form.parcelasPagas} onChange={e=>sf("parcelasPagas",e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>TOTAL PARCELAS</div>
                  <input style={IS} placeholder="0" type="number" value={form.totalParcelas} onChange={e=>sf("totalParcelas",e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>VENC. DIA</div>
                  <input style={IS} placeholder="10" type="number" min="1" max="31" value={form.vencimentoDia} onChange={e=>sf("vencimentoDia",e.target.value)} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>JUROS (% a.a.)</div>
                  <input style={IS} placeholder="0,00" value={form.jurosAnual} onChange={e=>sf("jurosAnual",e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>OBSERVAÇÕES</div>
                  <input style={IS} placeholder="Notas..." value={form.obs} onChange={e=>sf("obs",e.target.value)} />
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button onClick={handleSave} style={{ flex:1, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"13px", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                Salvar
              </button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"13px 18px", fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(() => { try { return JSON.parse(localStorage.getItem("sb_user")); } catch { return null; } });
  const [nav, setNav]           = useState("dashboard");
  const [showConfig, setConfig] = useState(false);
  const [transactions, setTxs]  = useState([]);
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS); // will be overwritten by Supabase
  const [editTx, setEditTx]     = useState(null);
  const [showForm, setForm]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading]   = useState(false);
  const sbConnected = true; // credentials hardcoded

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  // Check OAuth callback on mount
  useEffect(() => {
    const token = checkOAuthCallback();
    if (token) {
      const u = JSON.parse(localStorage.getItem("sb_user") || "{}");
      setUser(u);
    }
  }, []);

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setTxs(sbConnected ? [] : MOCK_TXS);
      return;
    }
    setLoading(true);
    Promise.all([
      dbFrom("transactions").then(t => t?.select("*")),
      dbFrom("accounts").then(t => t?.select("*")),
    ]).then(([txRes, accRes]) => {
      const txs = (txRes?.data || []).map(t => ({
        id: t.id,
        accountId: t.account_id || t.accountId,
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount),
        category: t.category || "outros",
        notes: t.notes || "",
        internalTransfer: t.internal_transfer || t.internalTransfer || false,
      }));
      setTxs(txs);
      if (!txs.length) showToast(`Nenhuma transação encontrada no Supabase. Importe um extrato.`, "warn");
      if (accRes?.data?.length) {
        const accs = accRes.data.map(a => ({ ...a, balance: parseFloat(a.balance) || 0 }));
        setAccounts(accs);
      } else {
        setAccounts([]); // no accounts yet — start fresh
      }
      setLoading(false);
    }).catch(err => {
      showToast(`Erro ao carregar dados: ${err.message}`, "warn");
      setTxs([]);
      setLoading(false);
    });
  }, [user]);

  const handleLogin = () => {
    try { setUser(JSON.parse(localStorage.getItem("sb_user"))); } catch {}
  };

  const handleLogout = async () => {
    await sbSignOut();
    setUser(null);
    setTxs(MOCK_TXS);
    setMenuOpen(false);
  };

  const saveTx = async (tx) => {
    setTxs(ts => { const i = ts.findIndex(t=>t.id===tx.id); return i>=0 ? ts.map((t,idx)=>idx===i?tx:t) : [tx,...ts]; });
    const tbl = await dbFrom("transactions");
    if (tbl) {
      const dbTx = {
        id: tx.id,
        account_id: tx.accountId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        notes: tx.notes || "",
        internal_transfer: tx.internalTransfer || false,
      };
      const exists = transactions.find(t=>t.id===tx.id);
      if (exists) await tbl.update(dbTx, {id:tx.id});
      else await tbl.insert(dbTx);
    }
    setForm(false); setEditTx(null);
    showToast("Lançamento salvo!");
  };

  const deleteTx = async (id) => {
    setTxs(ts=>ts.filter(t=>t.id!==id));
    const tbl = await dbFrom("transactions");
    if (tbl) await tbl.del({id});
    showToast("Removido","warn");
  };

  const importTxs = async (rows, accountId, saldoFinal) => {
    const deduped = rows.filter(r => !transactions.some(t =>
      t.accountId === r.accountId && t.date === r.date &&
      Math.abs(parseFloat(t.amount)) === Math.abs(parseFloat(r.amount)) &&
      t.description.toLowerCase().trim() === r.description.toLowerCase().trim()
    ));
    const skipped = rows.length - deduped.length;
    if (deduped.length === 0) { showToast(`Todas as ${rows.length} transações já existem.`); return; }

    setTxs(ts => [...deduped, ...ts]);
    showToast(`Salvando ${deduped.length} lançamentos...`);

    const tbl = await dbFrom("transactions");
    if (tbl) {
      let saved = 0, failed = 0;
      for (let i = 0; i < deduped.length; i += 20) {
        const results = await Promise.all(deduped.slice(i, i+20).map(tx => tbl.insert({
          id: tx.id, account_id: tx.accountId, date: tx.date,
          description: tx.description, amount: tx.amount,
          category: tx.category, notes: tx.notes || "",
          internal_transfer: tx.internalTransfer || false,
        })));
        results.forEach(r => r.error ? failed++ : saved++);
      }
      if (failed > 0) showToast(`⚠️ ${saved} salvos, ${failed} falharam.`);
      else showToast(`✅ ${deduped.length} salvos!${skipped > 0 ? ` (${skipped} duplicados ignorados)` : ""}`);
    } else {
      showToast("⚠️ Supabase não conectado");
    }

    // Atualizar saldo da conta com o saldo final do extrato
    if (accountId && saldoFinal != null) {
      setAccounts(accs => accs.map(a => a.id !== accountId ? a : { ...a, balance: saldoFinal }));
      dbFrom("accounts").then(t => t?.update({ balance: saldoFinal }, { id: accountId }));
      showToast(`💰 Saldo atualizado: ${brl(saldoFinal)}`);
    }
  };

  // Show login screen if not authenticated
  if (!user) return <Login onLogin={handleLogin} />;

  const navItems = [
    { id:"dashboard",   label:"Dashboard",    icon:"◈" },
    { id:"extrato",     label:"Extrato",      icon:"≡" },
    { id:"relatorios",  label:"Relatórios",   icon:"📊" },
    { id:"carteira",    label:"Carteira",     icon:"👜" },
    { id:"dividas",     label:"Dívidas",      icon:"📉" },
    { id:"metas",       label:"Metas",        icon:"🎯" },
    { id:"importar",    label:"Importar",     icon:"↑"  },
    { id:"comprovantes",label:"Comprovantes", icon:"📷" },
    { id:"contas",      label:"Contas",       icon:"⬡"  },
  ];

  const pageTitle = {
    dashboard:"Visão Geral", extrato:"Movimentações", relatorios:"Relatórios",
    carteira:"Carteira", dividas:"Dívidas & Financiamentos", metas:"Metas",
    importar:"Importar Extrato", comprovantes:"Comprovantes", contas:"Contas"
  };

  const bottomNav = [
    { id:"dashboard",  label:"Início",    icon:"◈" },
    { id:"extrato",    label:"Extrato",   icon:"≡" },
    { id:"carteira",   label:"Carteira",  icon:"👜" },
    { id:"dividas",    label:"Dívidas",   icon:"📉" },
    { id:"mais",       label:"Mais",      icon:"☰"  },
  ];

  const handleNav = (id) => { if(id==="mais"){setMenuOpen(true);return;} setNav(id); setMenuOpen(false); };

  const SidebarContent = ({ mobile=false }) => (
    <>
      <div style={{ padding: mobile?"24px 20px 18px":"28px 24px 22px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:10, color:C.goldDim, letterSpacing:3, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>Família</div>
        <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", color:C.goldLight, fontWeight:600 }}>Fontanezzi</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:3, fontFamily:"'DM Sans',sans-serif" }}>Controle Financeiro</div>
        <div style={{ marginTop:8, display:"flex", gap:6, alignItems:"center" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:sbConnected?C.green:C.muted }} />
          <span style={{ fontSize:10, color:sbConnected?C.green:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            {sbConnected ? "Supabase conectado" : "Modo demo"}
          </span>
        </div>
        {user && <div style={{ marginTop:6, fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>👤 {user.email}</div>}
      </div>
      <nav style={{ padding:"12px", flex:1, overflowY:"auto" }}>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>handleNav(item.id)} style={{
            display:"flex", alignItems:"center", gap:12, width:"100%",
            padding: mobile?"13px 16px":"10px 14px",
            borderRadius:10, border:"none", cursor:"pointer", marginBottom:2, textAlign:"left",
            background: nav===item.id ? C.gold+"18" : "transparent",
            color: nav===item.id ? C.goldLight : C.soft,
            fontFamily:"'DM Sans',sans-serif", fontSize: mobile?15:13, fontWeight:nav===item.id?500:400,
            borderLeft: nav===item.id ? `2px solid ${C.gold}` : "2px solid transparent",
          }}>
            <span style={{ width:20, textAlign:"center", fontSize:14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding:"0 12px 28px", display:"flex", flexDirection:"column", gap:4 }}>
        <button onClick={()=>{setConfig(true);setMenuOpen(false);}} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 14px", borderRadius:10, border:"none", cursor:"pointer", background:"transparent", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          ⚙ Configurações
        </button>
        <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 14px", borderRadius:10, border:"none", cursor:"pointer", background:C.red+"12", color:C.red, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          ⇠ Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:${C.surface};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=month]::-webkit-calendar-picker-indicator{filter:invert(.5);}
        select option{background:${C.card};color:${C.text};}
        .ds{display:flex!important;}
        .dn{display:none!important;}
        @media(max-width:767px){
          .desktop-only{display:none!important;}
          .mobile-only{display:flex!important;}
          .page-content{padding:14px!important;padding-bottom:80px!important;}
          .topbar-inner{padding:12px 14px!important;}
        }
        @media(min-width:768px){
          .mobile-only{display:none!important;}
          .page-content{padding:24px 32px!important;}
          .topbar-inner{padding:18px 32px!important;}
        }
      `}</style>

      {showConfig && <SupabaseConfig onSave={()=>{setConfig(false);showToast("Supabase configurado!");}} onClose={()=>setConfig(false)} />}
      {(showForm||editTx) && <TxForm accounts={accounts} initial={editTx} onSave={saveTx} onClose={()=>{setForm(false);setEditTx(null);}} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-only" style={{ position:"fixed", inset:0, zIndex:300 }}>
          <div onClick={()=>setMenuOpen(false)} style={{ position:"absolute", inset:0, background:"#000a" }} />
          <div style={{ position:"relative", width:280, background:C.surface, borderRight:`1px solid ${C.border}`, height:"100%", display:"flex", flexDirection:"column", zIndex:1 }}>
            <SidebarContent mobile={true} />
          </div>
        </div>
      )}

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
        {/* Desktop sidebar */}
        <div className="desktop-only" style={{ width:220, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
          <SidebarContent />
        </div>

        {/* Main */}
        <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column", minWidth:0 }}>
          {/* Topbar */}
          <div className="topbar-inner" style={{ borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button className="mobile-only" onClick={()=>setMenuOpen(true)} style={{ background:"transparent", border:"none", color:C.soft, fontSize:22, cursor:"pointer", padding:0, lineHeight:1 }}>☰</button>
              <div>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{navItems.find(n=>n.id===nav)?.label||nav}</div>
                <div style={{ fontSize:20, fontFamily:"'Cormorant Garamond',serif", color:C.text, fontWeight:500, lineHeight:1.1 }}>{pageTitle[nav]}</div>
              </div>
            </div>
            <div className="desktop-only" style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif", display:"flex", gap:10 }}>
              <span>👨 Rodrigo</span><span style={{color:C.border}}>|</span><span>👩 Cláudia</span>
            </div>
          </div>

          {/* Content */}
          <div className="page-content" style={{ flex:1 }}>
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, color:C.muted, fontFamily:"'DM Sans',sans-serif", gap:12 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${C.gold}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }} />
                Carregando dados...
              </div>
            ) : <>
              {nav==="dashboard"    && <Dashboard    transactions={transactions} accounts={accounts} onNavigate={setNav} />}
              {nav==="extrato"      && <Extrato      transactions={transactions} accounts={accounts} onEdit={t=>{setEditTx(t);}} onDelete={deleteTx} onAdd={()=>setForm(true)} />}
              {nav==="relatorios"   && <Relatorios   transactions={transactions} accounts={accounts} />}
              {nav==="carteira"     && <Carteira     accounts={accounts} />}
              {nav==="dividas"      && <Dividas />}
              {nav==="metas"        && <Metas        transactions={transactions} />}
              {nav==="importar"     && <ImportarExtrato accounts={accounts} onImport={importTxs} allTxs={transactions} />}
              {nav==="comprovantes" && <Comprovantes accounts={accounts} onAddTx={saveTx} />}
              {nav==="contas"       && <ContasView   accounts={accounts} setAccounts={setAccounts} />}
            </>}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-only" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200,
        background:C.surface, borderTop:`1px solid ${C.border}`,
        alignItems:"center", justifyContent:"space-around",
        paddingBottom:"env(safe-area-inset-bottom,8px)", paddingTop:6,
      }}>
        {bottomNav.map(item=>{
          const active = item.id!=="mais" && nav===item.id;
          return (
            <button key={item.id} onClick={()=>handleNav(item.id)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              background:"transparent", border:"none", cursor:"pointer", flex:1, padding:"4px 0 6px",
              color: active ? C.goldLight : C.muted,
            }}>
              <span style={{ fontSize:19, lineHeight:1 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontFamily:"'DM Sans',sans-serif", fontWeight:active?600:400 }}>{item.label}</span>
              {active && <div style={{ width:14, height:2, background:C.gold, borderRadius:2 }} />}
            </button>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </>
  );
}
