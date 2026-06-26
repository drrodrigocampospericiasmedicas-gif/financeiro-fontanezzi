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
  { id: "padaria",       label: "Padaria",       icon: "🥖",  color: "#d4a843" },
  { id: "supermercado",  label: "Supermercado",  icon: "🛒",  color: "#f39c12" },
  { id: "feira",         label: "Feira Livre",   icon: "🥬",  color: "#7cb342" },
  { id: "restaurante",   label: "Restaurante",   icon: "🍴",  color: "#e67e22" },
  { id: "farmacia",      label: "Farmácia",      icon: "💊",  color: "#2ecc71" },
  { id: "transporte",    label: "Transporte",    icon: "🚗",  color: "#4c8ec9" },
  { id: "gasolina",      label: "Gasolina",      icon: "⛽",  color: "#e67e22" },
  { id: "aluguel_carro", label: "Aluguel Carro", icon: "🚙",  color: "#2980b9" },
  { id: "saude",         label: "Saúde",         icon: "🏥",  color: "#4caf82" },
  { id: "educacao",      label: "Educação",      icon: "📚",  color: "#9b59b6" },
  { id: "lazer",         label: "Lazer",         icon: "🎭",  color: "#e05c9b" },
  { id: "moradia",       label: "Moradia",       icon: "🏠",  color: "#c9a84c" },
  { id: "aluguel",       label: "Aluguel",       icon: "🔑",  color: "#8e6b3e" },
  { id: "condominio",    label: "Condomínio",    icon: "🏢",  color: "#7f8c8d" },
  { id: "agua",          label: "Água",          icon: "💧",  color: "#3498db" },
  { id: "luz",           label: "Luz",           icon: "💡",  color: "#f1c40f" },
  { id: "internet",      label: "Internet",      icon: "🌐",  color: "#2980b9" },
  { id: "tv_assinatura", label: "TV por Assinatura", icon: "📺", color: "#8e44ad" },
  { id: "celular",       label: "Celular (Casal)",icon: "📱", color: "#1abc9c" },
  { id: "celular_daniel",label: "Celular Daniel", icon: "📲", color: "#16a085" },
  { id: "vestuario",     label: "Vestuário",     icon: "👔",  color: "#5cc9e0" },
  { id: "financeiro",    label: "Financeiro",    icon: "💳",  color: "#e05c5c" },
  { id: "pagamento_cartao", label: "Pagamento de Cartão", icon: "🔁", color: "#95a5a6" },
  { id: "empregada",     label: "Empregada",     icon: "🧹",  color: "#8e44ad" },
  { id: "bela",          label: "Bela",          icon: "🐶",  color: "#fd79a8" },
  { id: "beleza",        label: "Beleza",        icon: "💇",  color: "#e91e8c" },
  { id: "trabalho",      label: "Trabalho",      icon: "💼",  color: "#0984e3" },
  { id: "divida",        label: "Dívida",        icon: "📋",  color: "#e17055" },
  { id: "taxas",         label: "Taxas Bancárias",icon: "🏛️", color: "#636e72" },
  { id: "transferencia", label: "Transferência", icon: "🔄",  color: "#6b6f7d" },
  { id: "receita",       label: "Receita",       icon: "💰",  color: "#4caf82" },
  { id: "salario_claudia", label: "Salário Cláudia", icon: "👩‍💼", color: "#c96da0" },
  { id: "consulta_particular", label: "Consulta Particular", icon: "🩺", color: "#27ae60" },
  { id: "planos_ortasso",      label: "Planos/Ort. Asso",    icon: "📋", color: "#16a085" },
  { id: "fat_olade",            label: "Fat. Olade",          icon: "🧾", color: "#1abc9c" },
  { id: "laudos",                label: "Laudos",              icon: "📄", color: "#2980b9" },
  { id: "trf",                    label: "TRF",                 icon: "⚖️", color: "#8e44ad" },
  { id: "trt",                    label: "TRT",                 icon: "⚖️", color: "#9b59b6" },
  { id: "pag_sjc",               label: "Pag. SJC",            icon: "💵", color: "#27ae60" },
  { id: "outras_receitas",       label: "Outras Receitas",     icon: "➕", color: "#58d68d" },
  { id: "outros",        label: "Outros",        icon: "📦",  color: "#9a98a0" },
];


// ─── SUBCATEGORIAS por categoria principal ────────────────────────────────────
const SUBCATEGORIES = {
  // Trabalho: carro, gasolina, café, almoço, jantar, pedágio, IA, outros
  trabalho:      ["Gasolina","Pedágio","Almoço","Café","Jantar","Estacionamento","IA/Assinaturas","Hospedagem","Material","Carro","Aluguel de Carro","Outros"],

  // Casa: TV por assinatura, Internet, água, luz, condomínio, manutenção, outros
  moradia:       ["TV por Assinatura","Internet","Água","Luz","Condomínio","Manutenção","Reforma","Decoração","Limpeza","Outros"],
  condominio:    ["Taxa Condominial","Fundo de Reserva","Multa","Outros"],
  agua:          ["Conta Mensal","Multa","Outros"],
  luz:           ["Conta Mensal","Multa","Outros"],
  internet:      ["Mensalidade","Instalação","Outros"],
  tv_assinatura: ["Mensalidade","Pay-per-view","Outros"],
  celular:       ["Plano Mensal","Recarga","Outros"],
  celular_daniel:["Plano Mensal","Recarga","Outros"],

  // Alimentação
  alimentacao:   ["Delivery","Lanche","Mercadinho","Outros"],
  restaurante:   ["Almoço","Jantar","Café","Happy Hour","Outros"],
  supermercado:  ["Compras Semanais","Compras Mensais","Higiene","Limpeza","Outros"],
  padaria:       ["Pão","Lanche","Doce","Café","Outros"],
  feira:         ["Frutas","Verduras","Legumes","Outros"],

  // Saúde
  saude:         ["Consulta Médica","Exame","Cirurgia","Fisioterapia","Vacina","Plano de Saúde","Outros"],
  farmacia:      ["Medicamento","Suplemento","Higiene","Outros"],

  // Educação
  educacao:      ["Mensalidade Escola","Curso","Material Escolar","Livros","Uniforme","Outros"],

  // Lazer
  lazer:         ["Cinema/Teatro","Viagem","Esporte","Streaming","Passeio","Restaurante","Outros"],

  // Transporte
  transporte:    ["Gasolina","Pedágio","Uber/99","Manutenção carro","IPVA","Seguro carro","Aluguel de Carro","Outros"],
  gasolina:      ["Trabalho","Passeio","Viagem","Outros"],

  // Vestuário
  vestuario:     ["Roupas","Calçados","Acessórios","Moda Íntima","Outros"],

  // Financeiro/Dívidas
  financeiro:    ["Financiamento","Seguro","Tarifa","Investimento","Outros"],
  divida:        ["Financiamento","Cartão","Empréstimo","Consignado","Outros"],
  taxas:         ["IOF","Tarifa TED","Tarifa DOC","Manutenção conta","Outros"],

  // Casa e pessoas
  empregada:     ["Salário","FGTS","Vale Transporte","Vale Alimentação","Outros"],
  bela:          ["Ração","Veterinário","Banho/Tosa","Petiscos","Remédio","Outros"],
  beleza:        ["Rodrigo","Cláudia","Daniel","Outros"],
};

const subOf = (catId) => SUBCATEGORIES[catId] || [];


// ── Parse robusto de JSON da IA — tenta corrigir JSON malformado ─────────────
function safeParseAI(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (_) {}
  try {
    let s = match[0]
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\n\r\t]/g, ' ');
    return JSON.parse(s);
  } catch (_) {}
  return null;
}
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
    localStorage.setItem("sb_refresh_token", d.refresh_token || "");
    localStorage.setItem("sb_user", JSON.stringify({ email, id: d.user?.id }));
    return { data: d };
  }
  return { error: d.error_description || d.msg || "E-mail ou senha incorretos" };
}

// Verifica se o JWT está expirado ou vai expirar em breve (< 60s)
function isTokenExpired() {
  try {
    const token = localStorage.getItem("sb_token");
    if (!token) return true;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // converter para ms
    return Date.now() > exp - 60000; // expirado ou expira em menos de 60s
  } catch { return true; }
}

// Garante token válido antes de qualquer operação
async function ensureValidToken() {
  if (isTokenExpired()) {
    return await sbRefreshToken();
  }
  return true;
}

async function sbRefreshToken() {
  const { url, key } = getSBCreds();
  const refresh_token = localStorage.getItem("sb_refresh_token");
  if (!url || !refresh_token) return false;
  try {
    const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "apikey": key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token })
    });
    const d = await r.json();
    if (r.ok && d.access_token) {
      localStorage.setItem("sb_token", d.access_token);
      localStorage.setItem("sb_refresh_token", d.refresh_token || refresh_token);
      return true;
    }
    // Refresh falhou — limpar tokens inválidos
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_refresh_token");
    return false;
  } catch(e) {
    return false;
  }
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

  // Garantir token válido antes de qualquer operação
  if (localStorage.getItem("sb_token")) {
    await ensureValidToken();
  }

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
      let r = await fetch(`${base}?select=${q}${extra}`, { headers: getHdrs() });
      if (r.status === 401) {
        const ok = await sbRefreshToken();
        if (ok) {
          r = await fetch(`${base}?select=${q}${extra}`, { headers: getHdrs() });
        } else {
          // Refresh falhou — sinalizar necessidade de novo login
          window._sbSessionExpired = true;
          return { data: [], error: "session_expired" };
        }
      }
      if (!r.ok) { const e = await r.text(); console.error(`select ${table}:`, r.status, e); return { data: [], error: e }; }
      return { data: await r.json() };
    },
    async insert(row) {
      let r = await fetch(base, { method: "POST", headers: getHdrs(), body: JSON.stringify(row) });
      if (r.status === 401) {
        const ok = await sbRefreshToken();
        if (ok) r = await fetch(base, { method: "POST", headers: getHdrs(), body: JSON.stringify(row) });
        else { window._sbSessionExpired = true; return { error: "session_expired" }; }
      }
      if (!r.ok) { const e = await r.text(); console.error(`insert ${table}:`, r.status, e); return { error: e }; }
      const text = await r.text();
      return { data: text ? JSON.parse(text) : {} };
    },
    async update(row, match) {
      const params = Object.entries(match).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&");
      let r = await fetch(`${base}?${params}`, { method: "PATCH", headers: getHdrs(), body: JSON.stringify(row) });
      if (r.status === 401) {
        const ok = await sbRefreshToken();
        if (ok) r = await fetch(`${base}?${params}`, { method: "PATCH", headers: getHdrs(), body: JSON.stringify(row) });
        else { window._sbSessionExpired = true; return { error: "session_expired" }; }
      }
      if (!r.ok) { const e = await r.text(); console.error(`update ${table}:`, r.status, e); return { error: e }; }
      return { data: {} };
    },
    async del(match) {
      const params = Object.entries(match).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&");
      let r = await fetch(`${base}?${params}`, { method: "DELETE", headers: getHdrs() });
      if (r.status === 401) {
        const ok = await sbRefreshToken();
        if (ok) r = await fetch(`${base}?${params}`, { method: "DELETE", headers: getHdrs() });
        else { window._sbSessionExpired = true; return false; }
      }
      if (!r.ok) { const e = await r.text(); console.error(`delete ${table}:`, r.status, e); }
      return r.ok;
    }
  };
}


// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const TODAY = new Date();
const fmt   = (d) => d.toISOString().split("T")[0];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
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
    `Classifique esta transação financeira brasileira em UMA das categorias. Responda APENAS o id, sem mais nada.\n\nTransação: "${description}"\n\nCategorias: alimentacao, padaria, feira, supermercado, restaurante, farmacia, transporte, gasolina, aluguel_carro, saude, educacao, lazer, moradia, aluguel, condominio, agua, luz, celular, celular_daniel, vestuario, financeiro, pagamento_cartao, empregada, bela, trabalho, divida, taxas, transferencia, receita, salario_claudia, consulta_particular, planos_ortasso, fat_olade, laudos, trf, trt, pag_sjc, outras_receitas, outros\n\nDicas: salario_claudia=salário/pagamento de Cláudia, consulta_particular=consulta médica particular/honorário paciente, planos_ortasso=plano de saúde/convênio ortopédico/associação, fat_olade=Olade/faturamento Olade, laudos=laudo médico/perícia/RM/RX, trf=TRF/Tribunal Regional Federal/perícia federal, trt=TRT/Tribunal Regional do Trabalho/perícia trabalhista, pag_sjc=pagamento SJC, outras_receitas=outras receitas/depósitos diversos, pagamento_cartao=pagamento de fatura de cartão de crédito (Nubank/PicPay/Next/Itaú/Mastercard), feira=feira livre/hortifruti/sacolão, padaria=padaria/pão/bakery, gasolina=posto/combustível, aluguel_carro=locadora/hertz/localiza, aluguel=aluguel imóvel, condominio=condomínio, agua=saneamento/cedae/sabesp, luz=energia/enel/cemig/light, celular=tim/claro/vivo/oi celular casal, celular_daniel=celular daniel/filho, supermercado=mercado/carrefour, restaurante=restaurante/pizzaria, farmacia=drogaria/farmácia, empregada=diarista/faxineira, bela=salão/cabelo/manicure, trabalho=salário/honorário\n\nResponda apenas o id:`
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

const Card = ({children, style={}}) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, ...style }}>{children}</div>
);
const SectionTitle = ({children}) => (
  <div style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", marginBottom:16 }}>{children}</div>
);
const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

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
  const blank = { accountId:accounts[0]?.id||"", date:fmt(TODAY), description:"", amount:"", category:"outros", subcategory:"", notes:"", type:"despesa", internalTransfer:false, spender:"" };
  const [form, setForm] = useState(initial ? { ...initial, type: initial.amount>0?"receita": initial.internalTransfer?"transferencia":"despesa", amount: Math.abs(initial.amount).toString(), spender: initial.spender||"" } : blank);
  const [errors, setErrors] = useState({});
  const set = (k,v) => { setForm(f=>({...f,[k]:v, ...(k==="category"?{subcategory:""}:{})})); setErrors(e=>({...e,[k]:false})); };

  // Mostrar campo "quem gastou" somente: conta casal + não é taxas + é despesa
  const selectedAcc = accounts.find(a => a.id === form.accountId);
  const showSpender = selectedAcc?.owner === "casal" && form.category !== "taxas" && form.type === "despesa";

  const handleSave = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = true;
    if (!form.amount) errs.amount = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const amt = parseFloat(form.amount.replace(",","."));
    if (isNaN(amt)) { setErrors({amount:true}); return; }
    const spender = showSpender ? (form.spender || "casal") : "";
    onSave({ ...form, id:initial?.id||("tx_"+Date.now()), amount: form.type==="receita" ? Math.abs(amt) : -Math.abs(amt), internalTransfer: form.type==="transferencia", spender });
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
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ fontSize:11, color:errors.description?C.red:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>
              DESCRIÇÃO{errors.description && " — obrigatório"}
            </div>
            <input style={{...IS, border:`1px solid ${errors.description?C.red:C.border}`}} placeholder="Ex: Supermercado" value={form.description} onChange={e=>set("description",e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize:11, color:errors.amount?C.red:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>
              VALOR (R$){errors.amount && " — obrigatório"}
            </div>
            <input style={{...IS, border:`1px solid ${errors.amount?C.red:C.border}`}} placeholder="0,00" value={form.amount} onChange={e=>set("amount",e.target.value)} />
          </div>
          <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>CATEGORIA</div>
            <select style={IS} value={form.category} onChange={e=>set("category",e.target.value)}>
              {DEFAULT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select></div>
          {subOf(form.category).length > 0 && (
            <div><div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>SUBCATEGORIA</div>
              <select style={IS} value={form.subcategory||""} onChange={e=>set("subcategory",e.target.value)}>
                <option value="">— Selecionar —</option>
                {subOf(form.category).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {showSpender && (
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}>QUEM GASTOU?</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["rodrigo","👨 Rodrigo","#7c6dc9"],["claudia","👩 Cláudia","#c96da0"],["casal","💑 Casal","#4caf82"]].map(([key,label,color])=>(
                  <button key={key} onClick={()=>set("spender",key)} style={{
                    flex:1, padding:"9px 0", borderRadius:8, fontSize:12, fontWeight:500,
                    fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                    background: (form.spender||"casal")===key ? color+"22" : "transparent",
                    border:`1px solid ${(form.spender||"casal")===key ? color : C.border}`,
                    color: (form.spender||"casal")===key ? color : C.muted
                  }}>{label}</button>
                ))}
              </div>
            </div>
          )}
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
function exportPDF(transactions, accounts, period, year, cashBal, cartaoTxs=[], cashTxs=[]) {
  const acc  = (id) => accounts.find(a => a.id === id) || { name: id, owner: "" };
  const brlF = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const MONTH_NAMES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  // ── Dados de contas ─────────────────────────────────────────────────────────
  const accountsTotal = accounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
  const cashTotal     = parseFloat(cashBal) || 0;
  const grandTotal    = accountsTotal + cashTotal;

  // ── Filtrar por período — suporta array de meses, string de mês, ou ano ────
  let periodLabel, txs;
  if (Array.isArray(period) && period.length > 0) {
    // Array de chaves de mês: ["2026-01","2026-02",...]
    const sorted = [...period].sort();
    periodLabel = sorted.map(k => MONTH_NAMES_PT[parseInt(k.split("-")[1])-1] + "/" + k.split("-")[0].slice(2)).join(" + ");
    txs = transactions.filter(t => period.some(k => t.date.startsWith(k)) && !t.internalTransfer)
      .sort((a, b) => b.date.localeCompare(a.date));
  } else if (period && !Array.isArray(period)) {
    periodLabel = new Date(period + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    txs = transactions.filter(t => t.date.startsWith(period) && !t.internalTransfer)
      .sort((a, b) => b.date.localeCompare(a.date));
  } else {
    const y = year || String(new Date().getFullYear());
    periodLabel = `Ano ${y}`;
    txs = transactions.filter(t => t.date.startsWith(y) && !t.internalTransfer)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // Função auxiliar para checar se uma data está no período (mesma lógica do filtro de txs)
  const inPeriod = (date) => {
    if (Array.isArray(period) && period.length > 0) return period.some(k => date.startsWith(k));
    if (period && !Array.isArray(period)) return date.startsWith(period);
    const y = year || String(new Date().getFullYear());
    return date.startsWith(y);
  };

  const cartaoTxsB = cartaoTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount) < 0);
  const cashTxsB   = cashTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount) < 0);

  const despesas = txs.filter(t => t.amount < 0);
  const receitas = txs.filter(t => t.amount > 0);
  const totalDes = despesas.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalRec = receitas.reduce((s, t) => s + t.amount, 0);

  // ── Gastos por categoria ─────────────────────────────────────────────────────
  const byCat = {};
  despesas.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount); });
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = catList[0]?.[1] || 1;

  // ── Receitas por categoria ───────────────────────────────────────────────────
  const byCatRec = {};
  receitas.forEach(t => { byCatRec[t.category] = (byCatRec[t.category] || 0) + t.amount; });
  const catListRec = Object.entries(byCatRec).sort((a, b) => b[1] - a[1]);
  const maxCatRec = catListRec[0]?.[1] || 1;

  // Cores/ícones/labels reais das categorias do app (inclui Feira, receitas médicas, etc.)
  const catMeta = (id) => catOf(id);

  // ── Balanço Geral Consolidado: conta corrente + dinheiro + cartão de crédito ──
  // Exclui pagamento_cartao da conta corrente para não duplicar com os lançamentos
  // individuais do cartão (que já estão categorizados).
  const contaTxsBalanco = despesas.filter(t => t.category !== "pagamento_cartao");
  const byCatBalanco = {};
  const addBalanco = (cat, val) => { byCatBalanco[cat] = (byCatBalanco[cat] || 0) + val; };
  contaTxsBalanco.forEach(t => addBalanco(t.category || "outros", Math.abs(t.amount)));
  cashTxsB.forEach(t => addBalanco(t.category || "outros", Math.abs(parseFloat(t.amount))));
  cartaoTxsB.forEach(t => addBalanco(t.category || "outros", Math.abs(parseFloat(t.amount))));
  const balancoList = Object.entries(byCatBalanco).sort((a,b)=>b[1]-a[1]);
  const balancoTotal = balancoList.reduce((s,[,v])=>s+v,0) || 1;
  const maxBalanco = balancoList[0]?.[1] || 1;

  const balancoTotConta    = contaTxsBalanco.reduce((s,t)=>s+Math.abs(t.amount),0);
  const balancoTotDinheiro = cashTxsB.reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);
  const balancoTotCartao   = cartaoTxsB.reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);

  // ── Donut SVG (genérico, recebe total para porcentagens) ─────────────────────
  const makeDonut = (slices, total, size=160) => {
    const r = 55; const cx = size/2; const cy = size/2;
    let cumAngle = -Math.PI / 2;
    const paths = slices.map(([id, val]) => {
      const angle = (val / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(cumAngle);
      const y1 = cy + r * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + r * Math.cos(cumAngle);
      const y2 = cy + r * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      const color = catMeta(id).color || "#95a5a6";
      return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${color}" opacity="0.85"/>`;
    });
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${paths.join("")}
      <circle cx="${cx}" cy="${cy}" r="30" fill="white"/>
    </svg>`;
  };

  // ── Linhas do extrato ────────────────────────────────────────────────────────
  const extratoRows = txs.map(t => {
    const a = acc(t.accountId);
    const isRec = t.amount > 0;
    return `<tr>
      <td>${t.date.split("-").reverse().join("/")}</td>
      <td>${t.description || "-"}</td>
      <td>${a.name}</td>
      <td>${t.category || "outros"}</td>
      <td style="text-align:right;color:${isRec ? "#2e7d32" : "#c62828"};font-weight:600">${brlF(t.amount)}</td>
    </tr>`;
  }).join("");

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório Fontanezzi — ${periodLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:wght@600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;color:#1a1a2e;background:#fff;padding:32px;max-width:900px;margin:0 auto}
  h1{font-family:'Cormorant Garamond',serif;font-size:32px;color:#1a1a2e;margin-bottom:4px}
  h2{font-family:'Cormorant Garamond',serif;font-size:20px;color:#1a1a2e;margin:28px 0 12px}
  .subtitle{font-size:13px;color:#888;margin-bottom:32px}
  .label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:4px}
  /* KPIs */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .kpi{background:#f8f8fc;border-radius:12px;padding:16px}
  .kpi .val{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700}
  /* Contas */
  .contas{width:100%;border-collapse:collapse;margin-bottom:28px}
  .contas th{text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#888;padding:6px 10px;border-bottom:2px solid #e8e8f0}
  .contas td{padding:10px 10px;border-bottom:1px solid #f0f0f8;font-size:13px}
  .contas tr:last-child td{border-bottom:none;font-weight:700;font-size:14px;color:#b8960c}
  /* Gráfico categorias */
  .cat-section{display:flex;gap:32px;align-items:flex-start;margin-bottom:28px}
  .cat-bars{flex:1}
  .cat-row{margin-bottom:10px}
  .cat-row-header{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}
  .bar-bg{height:6px;background:#ebebf5;border-radius:3px}
  .bar-fill{height:100%;border-radius:3px}
  /* Extrato */
  .extrato{width:100%;border-collapse:collapse;font-size:12px}
  .extrato th{text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#888;padding:6px 8px;border-bottom:2px solid #e8e8f0}
  .extrato td{padding:8px 8px;border-bottom:1px solid #f5f5fa}
  .extrato tr:hover td{background:#fafafa}
  .footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #e8e8f0;padding-top:16px}
  .totals-row td{font-weight:700;background:#f8f8fc;color:#1a1a2e}
  @media print{
    body{padding:16px}
    @page{margin:15mm;size:A4}
  }
</style>
</head>
<body>
<h1>Família Fontanezzi</h1>
<div class="subtitle">Relatório Financeiro — ${periodLabel} &nbsp;·&nbsp; Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>

<!-- KPIs -->
<div class="kpis">
  <div class="kpi">
    <div class="label">Patrimônio Total</div>
    <div class="val" style="color:#b8960c">${brlF(grandTotal)}</div>
    <div style="font-size:11px;color:#888;margin-top:2px">contas + dinheiro em espécie</div>
  </div>
  <div class="kpi">
    <div class="label">Receitas do período</div>
    <div class="val" style="color:#2e7d32">${brlF(totalRec)}</div>
  </div>
  <div class="kpi">
    <div class="label">Despesas do período</div>
    <div class="val" style="color:#c62828">${brlF(totalDes)}</div>
  </div>
  <div class="kpi">
    <div class="label">Saldo do período</div>
    <div class="val" style="color:${totalRec - totalDes >= 0 ? "#2e7d32" : "#c62828"}">${brlF(totalRec - totalDes)}</div>
  </div>
</div>

<!-- Contas -->
<h2>Saldo das Contas</h2>
<table class="contas">
  <thead><tr><th>Conta</th><th>Tipo</th><th>Titular</th><th style="text-align:right">Saldo</th></tr></thead>
  <tbody>
    ${accounts.map(a => `<tr>
      <td>${a.name}</td>
      <td>${a.type || "corrente"}</td>
      <td>${a.owner === "rodrigo" ? "Rodrigo" : a.owner === "claudia" ? "Cláudia" : "Casal"}</td>
      <td style="text-align:right;color:${parseFloat(a.balance) >= 0 ? "#2e7d32" : "#c62828"}">${brlF(parseFloat(a.balance) || 0)}</td>
    </tr>`).join("")}
    ${cashTotal !== 0 ? `<tr>
      <td>💵 Dinheiro em espécie</td>
      <td>—</td>
      <td>Rodrigo + Cláudia</td>
      <td style="text-align:right;color:#2e7d32">${brlF(cashTotal)}</td>
    </tr>` : ""}
    <tr class="totals-row">
      <td colspan="3">TOTAL GERAL</td>
      <td style="text-align:right;color:#b8960c">${brlF(grandTotal)}</td>
    </tr>
  </tbody>
</table>

<!-- Gastos por categoria -->
<h2>Despesas por Categoria</h2>
<div class="cat-section">
  ${makeDonut(catList, totalDes)}
  <div class="cat-bars">
    ${catList.map(([id, val]) => `
      <div class="cat-row">
        <div class="cat-row-header">
          <span>${catMeta(id).icon} ${catMeta(id).label}</span>
          <span style="font-weight:600">${brlF(val)} <span style="font-weight:400;color:#888">(${(val/totalDes*100).toFixed(0)}%)</span></span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${(val/maxCat*100).toFixed(0)}%;background:${catMeta(id).color}"></div></div>
      </div>`).join("")}
  </div>
</div>

<!-- Receitas por categoria -->
<h2>Receitas por Categoria</h2>
${catListRec.length === 0 ? `<div style="font-size:13px;color:#888">Sem receitas registradas no período.</div>` : `
<div class="cat-section">
  ${makeDonut(catListRec, totalRec)}
  <div class="cat-bars">
    ${catListRec.map(([id, val]) => `
      <div class="cat-row">
        <div class="cat-row-header">
          <span>${catMeta(id).icon} ${catMeta(id).label}</span>
          <span style="font-weight:600;color:#2e7d32">${brlF(val)} <span style="font-weight:400;color:#888">(${(val/totalRec*100).toFixed(0)}%)</span></span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${(val/maxCatRec*100).toFixed(0)}%;background:${catMeta(id).color}"></div></div>
      </div>`).join("")}
  </div>
</div>`}

<!-- Balanço Geral Consolidado -->
<h2>Balanço Geral — Conta + Dinheiro + Cartão</h2>
<div style="font-size:12px;color:#888;margin-bottom:14px">
  Soma conta corrente, dinheiro em espécie e lançamentos do cartão de crédito, por categoria.
  Pagamentos de fatura não são contados aqui (evita duplicidade — cada gasto do cartão já está categorizado individualmente).
</div>
<div class="kpis" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi">
    <div class="label">🏦 Conta Corrente</div>
    <div class="val" style="color:#3498db">${brlF(balancoTotConta)}</div>
  </div>
  <div class="kpi">
    <div class="label">💵 Dinheiro</div>
    <div class="val" style="color:#2e7d32">${brlF(balancoTotDinheiro)}</div>
  </div>
  <div class="kpi">
    <div class="label">💳 Cartão de Crédito</div>
    <div class="val" style="color:#b8960c">${brlF(balancoTotCartao)}</div>
  </div>
  <div class="kpi">
    <div class="label">⚖️ Total Geral</div>
    <div class="val" style="color:#1a1a2e">${brlF(balancoTotal)}</div>
  </div>
</div>
${balancoList.length === 0 ? `<div style="font-size:13px;color:#888;margin-bottom:28px">Sem dados no período.</div>` : `
<div class="cat-section">
  ${makeDonut(balancoList, balancoTotal)}
  <div class="cat-bars">
    ${balancoList.map(([id, val]) => `
      <div class="cat-row">
        <div class="cat-row-header">
          <span>${catMeta(id).icon} ${catMeta(id).label}</span>
          <span style="font-weight:600">${brlF(val)} <span style="font-weight:400;color:#888">(${(val/balancoTotal*100).toFixed(0)}%)</span></span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${(val/maxBalanco*100).toFixed(0)}%;background:${catMeta(id).color}"></div></div>
      </div>`).join("")}
  </div>
</div>`}

<!-- Extrato -->
<h2>Extrato — ${periodLabel}</h2>
<table class="extrato">
  <thead><tr><th>Data</th><th>Descrição</th><th>Conta</th><th>Categoria</th><th style="text-align:right">Valor</th></tr></thead>
  <tbody>
    ${extratoRows}
    <tr class="totals-row">
      <td colspan="4">Saldo do período</td>
      <td style="text-align:right;color:${totalRec-totalDes>=0?"#2e7d32":"#c62828"}">${brlF(totalRec - totalDes)}</td>
    </tr>
  </tbody>
</table>

<div class="footer">Financeiro Fontanezzi &nbsp;·&nbsp; ${new Date().toLocaleDateString("pt-BR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
</body>
</html>`;

  // Download como .html para compartilhar
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_fontanezzi_${period || year || new Date().getFullYear()}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

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


// ─── CONSULTA POR IA (comando de voz ou texto) ───────────────────────────────
const ConsultaIA = ({ transactions=[], accounts=[], cashBal=0, cartaoTxs=[], cashTxs=[] }) => {
  const [query, setQuery]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef            = useRef(null);

  // ── Web Speech API (microfone) ───────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Microfone não suportado neste navegador. Use o campo de texto."); return; }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = (e) => { setListening(false); setError("Erro no microfone: " + e.error); };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      setListening(false);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  // ── Montar contexto financeiro completo para passar à IA ────────────────────
  const buildContext = () => {
    // Sanitizar texto removendo caracteres que quebram JSON
    const san = (s) => String(s||"").replace(/"/g,"").replace(/[\n\r\t]/g," ").replace(/\s+/g," ").trim();

    const allTxs = [
      ...transactions.filter(t=>!t.internalTransfer).map(t=>({...t, amount:parseFloat(t.amount), origem:"Conta corrente"})),
      ...cashTxs.map(t=>({...t, amount:parseFloat(t.amount), origem:"Dinheiro"})),
      ...cartaoTxs.map(t=>({...t, amount:parseFloat(t.amount), origem:"Cartão"})),
    ];

    // Agrupar por categoria + subcategoria com lançamentos individuais
    const byCatSub = {};
    allTxs.filter(t=>t.amount<0).forEach(t=>{
      const cat    = t.category    || "outros";
      const sub    = t.subcategory || "";
      const catLbl = catOf(cat).label;
      const key    = sub ? `${catLbl} > ${sub}` : catLbl;
      if (!byCatSub[key]) byCatSub[key] = { total:0, txs:[] };
      byCatSub[key].total += Math.abs(t.amount);
      byCatSub[key].txs.push({ date:t.date, desc:san(t.description), val:Math.abs(t.amount), origem:t.origem });
    });

    const catLines = Object.entries(byCatSub)
      .sort((a,b)=>b[1].total-a[1].total)
      .slice(0,20)
      .map(([key,v])=>{
        const txList = v.txs.sort((a,b)=>b.val-a.val).slice(0,3)
          .map(t=>`  - ${t.date} | ${t.desc} | R$${t.val.toFixed(2)}`).join("\n");
        return `[${key}] TOTAL: R$${v.total.toFixed(2)}\n${txList}`;
      }).join("\n\n");

    const recByCat = {};
    allTxs.filter(t=>t.amount>0).forEach(t=>{
      const lbl = catOf(t.category||"receita").label;
      recByCat[lbl] = (recByCat[lbl]||0) + t.amount;
    });
    const recLines = Object.entries(recByCat).sort((a,b)=>b[1]-a[1])
      .map(([lbl,v])=>`[${lbl}] R$${v.toFixed(2)}`).join(" | ");

    const totalRec = allTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const totalDes = allTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const patrimonio = accounts.reduce((s,a)=>s+(a.balance||0),0) + (parseFloat(cashBal)||0);
    return { catLines, recLines, totalRec, totalDes, patrimonio };
  };

  // ── Executar consulta ────────────────────────────────────────────────────────
  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);

    try {
      const ctx = buildContext();

      const prompt = `Você é o assistente financeiro pessoal de uma família brasileira (médico ortopedista e esposa). Responda ao COMANDO DO USUÁRIO usando EXCLUSIVAMENTE os dados abaixo.

REGRAS OBRIGATÓRIAS:
1. Use APENAS valores que existem nos dados. Nunca invente ou estime.
2. Quando pedir análise de uma categoria (ex: "trabalho"), use SOMENTE os lançamentos dela.
3. Quando pedir separação por subcategoria ("distinguindo cada item"), liste CADA subcategoria separadamente com valor exato.
4. Não misture categorias diferentes a menos que pedido explicitamente.
5. Cite descrições e valores reais dos lançamentos nos insights.
6. Se uma categoria não tiver dados, diga claramente "sem lançamentos".

DADOS FINANCEIROS REAIS:
Patrimônio total: R$${ctx.patrimonio.toFixed(2)}
Receitas: R$${ctx.totalRec.toFixed(2)} — ${ctx.recLines}
Despesas: R$${ctx.totalDes.toFixed(2)}

DESPESAS DETALHADAS (Categoria › Subcategoria | lançamentos individuais):
${ctx.catLines}

COMANDO: "${query}"

Responda SOMENTE com JSON válido sem markdown:
{
  "titulo": "título objetivo (máx 6 palavras)",
  "periodo": "período dos dados",
  "resumo": "2-3 frases com valores exatos dos dados",
  "insights": ["frase com valor exato (ex: Gasolina: R$X = Y% do total Trabalho)", "insight 2", "insight 3"],
  "categorias_analisadas": [{"label": "Categoria › Subcategoria ou só Categoria", "valor": numero_exato, "cor": "#hex", "percentual": numero}],
  "recomendacoes": ["recomendação com valor real citado", "recomendação 2"]
}`;

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`HTTP ${res.status}: ${errText.slice(0,200)}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const parsed = safeParseAI(text);
      if (!parsed) {
        console.error("[ConsultaIA] texto bruto:", text.slice(0,500));
        throw new Error("Resposta da IA não pôde ser interpretada (texto: " + text.slice(0,120) + "...)");
      }
      setResult(parsed);
    } catch(e) {
      setError("Erro: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // ── Exportar HTML ────────────────────────────────────────────────────────────
  const exportHTML = () => {
    if (!result) return;
    const total = result.categorias_analisadas.reduce((s,c)=>s+c.valor,0)||1;
    const bars = result.categorias_analisadas.map(c=>`
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;color:#333">${c.label}</span>
          <span style="font-size:13px;font-weight:600">R$ ${c.valor.toLocaleString("pt-BR",{minimumFractionDigits:2})} (${c.percentual?.toFixed(1)}%)</span>
        </div>
        <div style="height:10px;background:#eee;border-radius:6px">
          <div style="height:100%;width:${(c.valor/total*100).toFixed(1)}%;background:${c.cor};border-radius:6px"></div>
        </div>
      </div>`).join("");

    // Donut SVG
    let cumAngle = -Math.PI/2;
    const r=70; const cx=90; const cy=90;
    const paths = result.categorias_analisadas.map(c=>{
      const angle = (c.valor/total)*2*Math.PI;
      const x1=cx+r*Math.cos(cumAngle); const y1=cy+r*Math.sin(cumAngle);
      cumAngle+=angle;
      const x2=cx+r*Math.cos(cumAngle); const y2=cy+r*Math.sin(cumAngle);
      const large=angle>Math.PI?1:0;
      return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${c.cor}" opacity="0.85"/>`;
    }).join("");
    const donut = `<svg width="180" height="180" viewBox="0 0 180 180">${paths}<circle cx="${cx}" cy="${cy}" r="35" fill="white"/></svg>`;

    const legend = result.categorias_analisadas.map(c=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:12px;height:12px;border-radius:3px;background:${c.cor};flex-shrink:0"></div>
        <span style="font-size:12px;color:#555">${c.label} — R$ ${c.valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>${result.titulo}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:32px;background:#f8f9fa;color:#1a1a2e}
  h1{font-family:Georgia,serif;font-size:28px;color:#1a1a2e;margin-bottom:4px}
  .periodo{font-size:12px;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px}
  .resumo{font-size:15px;line-height:1.7;color:#333}
  .insights li,.recomendacoes li{font-size:14px;line-height:1.8;color:#444}
  .chart-row{display:flex;gap:28px;align-items:center;flex-wrap:wrap}
  @media print{body{padding:16px}}
</style>
</head>
<body>
  <h1>${result.titulo}</h1>
  <div class="periodo">Consulta: "${query}" · ${result.periodo} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>

  <div class="card">
    <h2>Resumo</h2>
    <p class="resumo">${result.resumo}</p>
  </div>

  <div class="card">
    <h2>Distribuição por Categoria</h2>
    <div class="chart-row">
      <div>${donut}</div>
      <div style="flex:1">${legend}</div>
    </div>
    <div style="margin-top:20px">${bars}</div>
  </div>

  <div class="card">
    <h2>Insights</h2>
    <ul class="insights">${result.insights.map(i=>`<li>${i}</li>`).join("")}</ul>
  </div>

  <div class="card">
    <h2>Recomendações</h2>
    <ul class="recomendacoes">${result.recomendacoes.map(r=>`<li>${r}</li>`).join("")}</ul>
  </div>

  <div style="text-align:center;margin-top:32px;font-size:11px;color:#bbb">
    Financeiro Fontanezzi · Análise gerada por IA · Dados reais do app
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consulta-${result.titulo.replace(/\s+/g,"-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const examples = [
    "Analise meus gastos com moradia, internet, celular e TV",
    "Compare receitas e despesas dos últimos meses",
    "Onde posso economizar mais este mês?",
    "Mostre os maiores gastos por categoria",
    "Analise os gastos com alimentação e restaurantes",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <Card>
        <SectionTitle>Consulta Financeira por IA</SectionTitle>
        <div style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:18, lineHeight:1.6 }}>
          Faça uma pergunta ou peça uma análise em linguagem natural. Use o microfone ou digite. A IA consulta seus dados reais e gera um relatório exportável.
        </div>

        {/* Campo de texto + microfone */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <textarea
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder='Ex: "Analise meus gastos com moradia, internet e TV por assinatura"'
            rows={3}
            style={{ ...IS, flex:1, resize:"vertical", lineHeight:1.5 }}
          />
          <button
            onClick={listening ? stopListening : startListening}
            style={{
              width:50, height:50, borderRadius:"50%", border:"none", cursor:"pointer", flexShrink:0,
              alignSelf:"flex-start",
              background: listening ? "#e74c3c" : C.gold,
              color: listening ? "#fff" : "#1a1a2e",
              fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: listening ? "0 0 0 4px rgba(231,76,60,0.3)" : "none",
              transition:"all 0.2s",
            }}
            title={listening ? "Parar gravação" : "Falar comando"}
          >
            {listening ? "⏹" : "🎙️"}
          </button>
        </div>

        {listening && (
          <div style={{ fontSize:12, color:"#e74c3c", fontFamily:"'DM Sans',sans-serif", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#e74c3c", animation:"pulse 1s infinite" }}/>
            Ouvindo... fale seu comando
          </div>
        )}

        {/* Exemplos */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {examples.map((ex,i)=>(
            <button key={i} onClick={()=>setQuery(ex)} style={{
              background:"transparent", border:`1px solid ${C.border}`, borderRadius:20,
              padding:"5px 12px", fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif",
              cursor:"pointer"
            }}>{ex}</button>
          ))}
        </div>

        <button
          onClick={runQuery}
          disabled={loading || !query.trim()}
          style={{
            background: C.gold, border:"none", color:"#1a1a2e", borderRadius:8,
            padding:"11px 22px", fontSize:13, fontWeight:600,
            fontFamily:"'DM Sans',sans-serif",
            cursor: (loading||!query.trim()) ? "default":"pointer",
            opacity: (loading||!query.trim()) ? 0.6:1
          }}
        >{loading ? "🤖 Analisando..." : "🤖 Executar consulta"}</button>

        {error && (
          <div style={{ marginTop:12, fontSize:12, color:C.red, fontFamily:"'DM Sans',sans-serif", background:C.surface, borderRadius:8, padding:"10px 14px" }}>
            {error}
          </div>
        )}
      </Card>

      {/* Resultado */}
      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:20, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.text }}>{result.titulo}</div>
            <button onClick={exportHTML} style={{
              background:C.green, border:"none", color:"#fff", borderRadius:8,
              padding:"9px 16px", fontSize:12, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
            }}>📄 Exportar HTML</button>
          </div>

          <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            {result.periodo} · Consulta: "{query}"
          </div>

          {/* Resumo */}
          <Card>
            <SectionTitle>Resumo</SectionTitle>
            <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>{result.resumo}</div>
          </Card>

          {/* Gráfico donut + barras */}
          {result.categorias_analisadas?.length > 0 && (() => {
            const total = result.categorias_analisadas.reduce((s,c)=>s+c.valor,0)||1;
            return (
              <Card>
                <SectionTitle>Distribuição por Categoria</SectionTitle>
                <DonutChart
                  slices={result.categorias_analisadas.map(c=>({ label:c.label, value:c.valor, color:c.cor, icon:"" }))}
                  size={180}
                />
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
                  {result.categorias_analisadas.map((c,i)=>(
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif" }}>{c.label}</span>
                        <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>
                          {brl(c.valor)} <span style={{ fontSize:11, color:C.muted, fontWeight:400 }}>({c.percentual?.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div style={{ height:8, background:C.border, borderRadius:6 }}>
                        <div style={{ height:"100%", width:`${(c.valor/total*100).toFixed(1)}%`, background:c.cor, borderRadius:6, transition:"width .5s" }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* Insights */}
          {result.insights?.length > 0 && (
            <Card>
              <SectionTitle>Insights</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.insights.map((ins,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", background:C.surface, borderRadius:10, padding:"10px 14px" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                    <span style={{ fontSize:13, color:C.soft, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{ins}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recomendações */}
          {result.recomendacoes?.length > 0 && (
            <Card>
              <SectionTitle>Recomendações</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.recomendacoes.map((rec,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", background:C.surface, borderRadius:10, padding:"10px 14px" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>✅</span>
                    <span style={{ fontSize:13, color:C.soft, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};


// ─── ANÁLISE IA & INVESTIMENTOS ─────────────────────────────────────────────────
const AnaliseIA = ({ transactions, accounts, cashBal, cartaoTxs=[], cashTxs=[] }) => {
  const [tab, setTab] = useState("gastos"); // gastos | investimentos
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [summary, setSummary]   = useState(null);
  const [error, setError] = useState("");
  const [selPeriods, setSelPeriods] = useState(() => {
    const y = TODAY.getFullYear();
    const m = String(TODAY.getMonth()+1).padStart(2,"0");
    return [`${y}-${m}`];
  });
  const [periodYear, setPeriodYear] = useState(TODAY.getFullYear());
  const togglePeriod = (key) => setSelPeriods(s => s.includes(key) ? s.filter(k=>k!==key) : [...s,key]);

  // Investimentos
  const [investAmount, setInvestAmount] = useState("");
  const [investRisk, setInvestRisk] = useState("moderado");
  const [investAnalysis, setInvestAnalysis] = useState(null);
  const [investLoading, setInvestLoading] = useState(false);
  const [investError, setInvestError] = useState("");

  const accountsTotal = accounts.reduce((s,a)=>s+(parseFloat(a.balance)||0),0);
  const grandTotal = accountsTotal + (parseFloat(cashBal)||0);

  // ── Montar resumo financeiro do período para a IA ────────────────────────────
  const buildFinancialSummary = (periodKeys) => {
    const san = (s) => String(s||"").replace(/"/g,"").replace(/[\n\r\t]/g," ").replace(/\s+/g," ").trim();

    const keys = Array.isArray(periodKeys) ? periodKeys : [periodKeys];
    const inPeriod = (date) => keys.some(k => date.startsWith(k));

    const contaTxs = transactions.filter(t => inPeriod(t.date) && t.amount<0 && !t.internalTransfer && t.category!=="pagamento_cartao");
    const recTxs   = transactions.filter(t => inPeriod(t.date) && t.amount>0 && !t.internalTransfer);
    const cashDes  = cashTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount)<0);
    const cashRec  = cashTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount)>0);
    const cardTxs  = cartaoTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount)<0);

    // Agrupar por categoria + subcategoria com lançamentos individuais
    const byCatSub = {};
    const addSub = (t, val) => {
      const cat = t.category || "outros";
      const sub = t.subcategory || "";
      const catLbl = catOf(cat).label;
      if (!byCatSub[cat]) byCatSub[cat] = { label:catLbl, color:catOf(cat).color, total:0, subs:{}, txs:[] };
      byCatSub[cat].total += val;
      byCatSub[cat].txs.push({ date:t.date, desc:san(t.description||""), val, sub, origem:t.origem||"" });
      if (sub) {
        if (!byCatSub[cat].subs[sub]) byCatSub[cat].subs[sub] = 0;
        byCatSub[cat].subs[sub] += val;
      }
    };
    contaTxs.forEach(t => addSub({...t, origem:"Conta"}, Math.abs(t.amount)));
    cashDes.forEach(t => addSub({...t, amount:parseFloat(t.amount), origem:"Dinheiro"}, Math.abs(parseFloat(t.amount))));
    cardTxs.forEach(t => addSub({...t, amount:parseFloat(t.amount), origem:"Cartão"}, Math.abs(parseFloat(t.amount))));

    const totalDespesas = Object.values(byCatSub).reduce((s,v)=>s+v.total,0);
    const totalReceitas = recTxs.reduce((s,t)=>s+t.amount,0) + cashRec.reduce((s,t)=>s+parseFloat(t.amount),0);

    // Breakdown detalhado por categoria com subcategorias e top lançamentos
    const catBreakdown = Object.entries(byCatSub)
      .sort((a,b)=>b[1].total-a[1].total)
      .map(([id,v]) => {
        const pct = (v.total/totalDespesas*100).toFixed(1);
        let line = `${v.label}: R$${v.total.toFixed(2)} (${pct}%)`;
        // Subcategorias
        const subs = Object.entries(v.subs).sort((a,b)=>b[1]-a[1]);
        if (subs.length) line += "\n  Subcategorias: " + subs.map(([s,vl])=>`${s}=R$${vl.toFixed(2)}`).join(", ");
        // Top 5 lançamentos individuais
        const top = v.txs.sort((a,b)=>b.val-a.val).slice(0,5);
        line += "\n  Lançamentos: " + top.map(t=>`[${t.date}] ${t.desc}${t.sub?" ("+t.sub+")":""} R$${t.val.toFixed(2)} ${t.origem}`).join(" | ");
        return line;
      }).join("\n\n");

    // Receitas detalhadas
    const recByCat = {};
    recTxs.forEach(t => { const l=catOf(t.category||"receita").label; recByCat[l]=(recByCat[l]||0)+t.amount; });
    cashRec.forEach(t => { const l=catOf(t.category||"receita").label; recByCat[l]=(recByCat[l]||0)+parseFloat(t.amount); });
    const recBreakdown = Object.entries(recByCat).sort((a,b)=>b[1]-a[1])
      .map(([l,v])=>`${l}: R$${v.toFixed(2)}`).join(" | ");

    // Top 15 maiores lançamentos
    const allTxsList = [
      ...contaTxs.map(t=>({...t, origem:"Conta corrente"})),
      ...cashDes.map(t=>({...t, amount:parseFloat(t.amount), origem:"Dinheiro"})),
      ...cardTxs.map(t=>({...t, amount:parseFloat(t.amount), origem:"Cartão"})),
    ].sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)).slice(0,15);
    const topTxs = allTxsList.map(t=>`${t.date} | ${san(t.description)}${t.subcategory?" ("+t.subcategory+")":""} | R$${Math.abs(t.amount).toFixed(2)} | ${catOf(t.category).label} | ${t.origem}`).join("\n");

    // Dados para gráfico (retornamos também o byCatSub para exportação)
    return {
      totalDespesas, totalReceitas,
      saldo: totalReceitas - totalDespesas,
      catBreakdown, recBreakdown, topTxs,
      byCatSub,
      numTxs: contaTxs.length + cashDes.length + cardTxs.length,
    };
  };

  // ── Análise de Gastos via IA ──────────────────────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true); setError(""); setAnalysis(null);
    try {
      if (selPeriods.length === 0) {
        setError("Selecione ao menos um mês para analisar.");
        setLoading(false);
        return;
      }

      const summary = buildFinancialSummary(selPeriods);
      setSummary(summary);
      const sorted = [...selPeriods].sort();
      const periodLabel = sorted.map(k => {
        const [y,m] = k.split("-");
        return MONTH_NAMES[parseInt(m)-1] + "/" + y;
      }).join(" + ");
      const periodLabelDesc = sorted.length > 1 ? `o período somado (${periodLabel})` : periodLabel;

      if (summary.numTxs === 0) {
        setError(`Não há lançamentos registrados em ${periodLabel}. Escolha outro período.`);
        setLoading(false);
        return;
      }

      const prompt = `Você é um consultor financeiro pessoal sênior de uma família brasileira (médico ortopedista e esposa). Faça uma análise DETALHADA, PROFUNDA e ESPECÍFICA usando EXCLUSIVAMENTE os dados reais abaixo. Não use frases genéricas.

DADOS DO PERÍODO: ${periodLabelDesc}
- Receitas: R$${summary.totalReceitas.toFixed(2)} (${summary.recBreakdown})
- Despesas: R$${summary.totalDespesas.toFixed(2)}
- Saldo: R$${summary.saldo.toFixed(2)} (${summary.totalReceitas>0?(summary.saldo/summary.totalReceitas*100).toFixed(1):0}% de poupança)
- Patrimônio total: R$${grandTotal.toFixed(2)}

DESPESAS DETALHADAS POR CATEGORIA E SUBCATEGORIA:
${summary.catBreakdown}

15 MAIORES LANÇAMENTOS:
${summary.topTxs}

TAREFAS OBRIGATÓRIAS:
1. PANORAMA: avalie a saúde financeira real com base nos números (taxa de poupança ideal: 20%+; preocupante: <10%). Cite os valores exatos.
2. PARA ONDE VAI: analise as TOP 5 categorias de gasto. Para cada uma, cite o valor, percentual do total, e se está acima do esperado para a renda. Mencione subcategorias relevantes.
3. OPORTUNIDADES: 4-6 sugestões ESPECÍFICAS com valor de economia estimado. Baseie em lançamentos reais (ex: "foram 3 lançamentos de pedágio totalizando R$X — usar rota alternativa pode economizar R$Y").
4. PADRÕES: identifique padrões (gastos repetidos, dia da semana, concentração em determinados estabelecimentos).
5. TAXA DE POUPANÇA: calcule e avalie com contexto (família de médico tem potencial de poupança maior).

Retorne SOMENTE JSON válido sem markdown:
{
  "resumo": "2-3 frases com valores exatos descrevendo a situação real",
  "para_onde_vai": "análise detalhada das top 5 categorias com valores e percentuais reais",
  "taxa_poupanca_pct": numero,
  "avaliacao_poupanca": "avaliação contextualizada com sugestão de meta realista",
  "padroes": "1-2 frases sobre padrões identificados nos lançamentos",
  "top_categorias": [
    {"categoria": "nome", "valor": numero_exato, "percentual": numero, "avaliacao": "normal/alto/muito_alto", "detalhe": "frase com subcategorias e lançamentos relevantes"}
  ],
  "oportunidades": [
    {"categoria": "categoria específica", "sugestao": "sugestão detalhada citando lançamentos reais", "economia_estimada": numero}
  ]
}`;

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`HTTP ${res.status} ${errText.slice(0,150)}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const parsed = safeParseAI(text);
      if (!parsed) throw new Error("Resposta da IA não pôde ser interpretada. Tente novamente.");
      setAnalysis(parsed);
    } catch (e) {
      console.error(e);
      setError(`Não foi possível gerar a análise agora: ${e.message || e}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  // ── Sugestão de Carteira de Dividendos via IA ────────────────────────────────
  const runInvestAnalysis = async () => {
    const amt = parseFloat(investAmount.replace(",","."));
    if (isNaN(amt) || amt <= 0) { setInvestError("Informe um valor válido para investir."); return; }

    setInvestLoading(true); setInvestError(""); setInvestAnalysis(null);
    try {
      const riskLabel = { conservador:"conservador (prioriza segurança, baixa volatilidade)", moderado:"moderado (equilíbrio entre renda e crescimento)", arrojado:"arrojado (aceita mais volatilidade por maior potencial de renda)" }[investRisk];

      const prompt = `Você é um consultor de investimentos especializado em renda passiva e dividendos no mercado brasileiro. Um médico ortopedista quer investir R$ ${amt.toFixed(2)} com foco em geração de dividendos/renda passiva mensal.

Perfil de risco declarado: ${riskLabel}.
Patrimônio total atual em contas: R$ ${grandTotal.toFixed(2)} (apenas para contexto, não para alocação).

Monte uma carteira de dividendos diversificada com ativos do mercado brasileiro (FIIs — Fundos Imobiliários, ações pagadoras de dividendos como bancos, elétricas, seguradoras, telecom, e opcionalmente Tesouro Selic/IPCA para reserva), distribuindo os R$ ${amt.toFixed(2)} entre 5 a 8 ativos.

Para cada ativo, informe: ticker, nome/setor, percentual alocado, valor em R$, e o motivo da escolha (foco em dividend yield, estabilidade, diversificação setorial).

Seja realista quanto a yields esperados (DY médio histórico, sem garantir rentabilidade futura) e inclua um aviso de que não é recomendação de investimento formal, apenas uma sugestão educacional.

Retorne SOMENTE um objeto JSON, sem markdown, no formato:
{
  "estrategia": "2-3 frases explicando a lógica geral da carteira montada",
  "yield_estimado_pct": numero (DY médio anual estimado da carteira),
  "renda_mensal_estimada": numero (estimativa de renda passiva mensal em R$),
  "ativos": [
    {"ticker": "XXXX11", "nome": "Nome/Setor", "tipo": "FII|Ação|Tesouro", "percentual": numero, "valor": numero, "motivo": "justificativa breve"}
  ],
  "aviso": "texto do aviso legal/educacional"
}`;

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`HTTP ${res.status} ${errText.slice(0,150)}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const parsed = safeParseAI(text);
      if (!parsed) throw new Error("Resposta da IA não pôde ser interpretada. Tente novamente.");
      setInvestAnalysis(parsed);
    } catch (e) {
      console.error(e);
      setInvestError(`Não foi possível gerar a sugestão agora: ${e.message || e}. Tente novamente.`);
    } finally {
      setInvestLoading(false);
    }
  };

  const tabBtn = (id, label) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:tab===id?600:400,
      fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
      background: tab===id ? C.gold+"22" : "transparent",
      border: `1px solid ${tab===id ? C.gold : C.border}`,
      color: tab===id ? C.goldLight : C.muted
    }}>{label}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", gap:8 }}>
        {tabBtn("gastos","🔍 Análise de Gastos")}
        {tabBtn("investimentos","💹 Carteira de Dividendos")}
      </div>

      {/* ─── ANÁLISE DE GASTOS ─── */}
      {tab==="gastos" && (
        <Card>
          <SectionTitle>Para onde está indo o dinheiro — análise por IA</SectionTitle>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:18, lineHeight:1.6 }}>
            A IA analisa conta corrente, dinheiro e cartão de crédito do(s) mês(es) escolhido(s), identifica padrões de gasto e sugere oportunidades realistas de economia. Selecione um ou mais meses para somar.
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={()=>setPeriodYear(y=>y-1)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>‹</button>
              <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.text }}>{periodYear}</span>
              <button onClick={()=>setPeriodYear(y=>y+1)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>›</button>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>setSelPeriods([])} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Limpar</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6, marginBottom:16 }}>
            {Array.from({length:12},(_,i)=>{
              const key = `${periodYear}-${String(i+1).padStart(2,"0")}`;
              const sel = selPeriods.includes(key);
              const hasData = transactions.some(t=>t.date.startsWith(key)) || cashTxs.some(t=>t.date.startsWith(key)) || cartaoTxs.some(t=>t.date.startsWith(key));
              return (
                <button key={key} onClick={()=>{ if(hasData){ togglePeriod(key); setAnalysis(null); setError(""); } }} style={{
                  padding:"8px 4px", borderRadius:8, fontSize:11, fontWeight:sel?700:400,
                  fontFamily:"'DM Sans',sans-serif", cursor:hasData?"pointer":"default",
                  background: sel ? C.gold+"22" : "transparent",
                  border:`1px solid ${sel ? C.gold : C.border}`,
                  color: sel ? C.goldLight : hasData ? C.soft : C.border,
                  opacity: hasData ? 1 : 0.35
                }}>{MONTH_NAMES[i]}</button>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20 }}>
            <button onClick={runAnalysis} disabled={loading || selPeriods.length===0} style={{
              background: C.gold, border:"none", color:"#1a1a2e", borderRadius:8,
              padding:"9px 18px", fontSize:12, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", cursor: (loading||selPeriods.length===0)?"default":"pointer", opacity: (loading||selPeriods.length===0)?0.6:1
            }}>{loading ? "🤖 Analisando..." : `🤖 Gerar análise${selPeriods.length>1 ? ` (${selPeriods.length} meses)` : ""}`}</button>

          </div>

          {error && (
            <div style={{ fontSize:12, color:C.red, fontFamily:"'DM Sans',sans-serif", background:C.surface, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:"30px 0" }}>
              Analisando seus dados financeiros...
            </div>
          )}

          {analysis && (() => {
            // Exportação HTML com gráficos e tabelas
            const exportAnalise = () => {
              const sumByCat = analysis.top_categorias || [];
              const totalDes = sumByCat.reduce((s,c)=>s+c.valor,0)||1;
              const avalColor = {"normal":"#2e7d32","alto":"#f39c12","muito_alto":"#e74c3c"};

              // Barras de categoria
              const bars = sumByCat.map(c=>`
                <tr>
                  <td style="padding:8px 12px;font-size:13px">${c.categoria}</td>
                  <td style="padding:8px 12px;font-size:13px;font-weight:600">R$ ${c.valor?.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                  <td style="padding:8px 12px;font-size:12px">${c.percentual?.toFixed(1)}%</td>
                  <td style="padding:8px 12px">
                    <span style="background:${avalColor[c.avaliacao]||"#888"};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px">${c.avaliacao||""}</span>
                  </td>
                  <td style="padding:8px 12px;font-size:11px;color:#555;max-width:200px">${c.detalhe||""}</td>
                </tr>`).join("");

              // Donut SVG
              let cumAngle = -Math.PI/2; const r=70,cx=90,cy=90;
              const colors = ["#c9a84c","#3498db","#e74c3c","#2ecc71","#9b59b6","#e67e22","#1abc9c","#f1c40f"];
              const paths = sumByCat.map((c,i)=>{
                const angle=(c.valor/totalDes)*2*Math.PI;
                const x1=cx+r*Math.cos(cumAngle),y1=cy+r*Math.sin(cumAngle);
                cumAngle+=angle;
                const x2=cx+r*Math.cos(cumAngle),y2=cy+r*Math.sin(cumAngle);
                return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${angle>Math.PI?1:0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${colors[i%colors.length]}" opacity="0.85"/>`;
              }).join("");
              const legend = sumByCat.map((c,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:12px;height:12px;border-radius:3px;background:${colors[i%colors.length]}"></div><span style="font-size:12px">${c.categoria} — R$ ${c.valor?.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span></div>`).join("");

              // Oportunidades
              const oportunidades = (analysis.oportunidades||[]).map(op=>`
                <tr>
                  <td style="padding:8px 12px;font-size:13px;font-weight:600">${op.categoria}</td>
                  <td style="padding:8px 12px;font-size:12px;color:#444">${op.sugestao}</td>
                  <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#2e7d32">R$ ${op.economia_estimada?.toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês</td>
                </tr>`).join("");

              const totalEcon = (analysis.oportunidades||[]).reduce((s,o)=>s+(o.economia_estimada||0),0);
              const [ySel,mSel] = (selPeriods.sort()[0]||"").split("-");
              const periodoLabel = [...selPeriods].sort().map(k=>{const[y,m]=k.split("-");return MONTH_NAMES[parseInt(m)-1]+"/"+y;}).join(" + ");

              const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Análise Financeira — ${periodoLabel}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:850px;margin:0 auto;padding:32px;background:#f8f9fa;color:#1a1a2e}
  h1{font-family:Georgia,serif;font-size:28px;margin-bottom:4px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin:28px 0 12px}
  .card{background:#fff;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .kpi{background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.05)}
  .kpi .lbl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .kpi .val{font-size:20px;font-family:Georgia,serif;font-weight:700}
  table{width:100%;border-collapse:collapse}
  th{background:#f1f3f5;padding:10px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.5px}
  tr:nth-child(even){background:#f9fafb}
  .chart-row{display:flex;gap:28px;align-items:center;flex-wrap:wrap}
  p{line-height:1.7;color:#333;font-size:14px}
  @media print{body{padding:16px}.card{box-shadow:none}}
</style>
</head>
<body>
<h1>Análise Financeira Familiar</h1>
<div style="color:#888;font-size:12px;margin-bottom:24px">Período: ${periodoLabel} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>

<div class="kpis">
  <div class="kpi"><div class="lbl">Receitas</div><div class="val" style="color:#2e7d32">R$ ${summary.totalReceitas.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
  <div class="kpi"><div class="lbl">Despesas</div><div class="val" style="color:#c0392b">R$ ${summary.totalDespesas.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
  <div class="kpi"><div class="lbl">Saldo</div><div class="val" style="color:${summary.saldo>=0?"#2e7d32":"#c0392b"}">R$ ${summary.saldo.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
  <div class="kpi"><div class="lbl">Taxa Poupança</div><div class="val" style="color:${analysis.taxa_poupanca_pct>=20?"#2e7d32":analysis.taxa_poupanca_pct>=10?"#f39c12":"#c0392b"}">${analysis.taxa_poupanca_pct?.toFixed(1)}%</div></div>
</div>

<div class="card"><h2>Panorama Geral</h2><p>${analysis.resumo}</p></div>
<div class="card"><h2>Para Onde o Dinheiro Está Indo</h2><p>${analysis.para_onde_vai}</p></div>
${analysis.padroes ? `<div class="card"><h2>Padrões Identificados</h2><p>${analysis.padroes}</p></div>` : ""}

<div class="card">
  <h2>Distribuição por Categoria</h2>
  <div class="chart-row">
    <svg width="180" height="180" viewBox="0 0 180 180">${paths}<circle cx="${cx}" cy="${cy}" r="35" fill="white"/></svg>
    <div style="flex:1">${legend}</div>
  </div>
  <table style="margin-top:20px">
    <thead><tr><th>Categoria</th><th>Valor</th><th>%</th><th>Avaliação</th><th>Detalhe</th></tr></thead>
    <tbody>${bars}</tbody>
  </table>
</div>

<div class="card">
  <h2>Oportunidades de Economia</h2>
  <table>
    <thead><tr><th>Categoria</th><th>Sugestão</th><th>Economia Est.</th></tr></thead>
    <tbody>${oportunidades}</tbody>
    <tfoot><tr style="background:#e8f5e9"><td colspan="2" style="padding:10px 12px;font-weight:700">💰 Potencial total de economia/mês</td><td style="padding:10px 12px;font-weight:700;color:#2e7d32;font-size:16px">R$ ${totalEcon.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td></tr></tfoot>
  </table>
</div>

<div class="card"><h2>Avaliação de Poupança</h2><p>${analysis.avaliacao_poupanca}</p></div>

<div style="text-align:center;margin-top:32px;font-size:11px;color:#bbb">Financeiro Fontanezzi · Análise gerada por IA com dados reais</div>
</body></html>`;

              const blob = new Blob([html], {type:"text/html"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `analise-financeira-${periodoLabel.replace(/\//g,"-").replace(/ \+ /g,"_")}.html`;
              a.click(); URL.revokeObjectURL(url);
            };

            return (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button onClick={exportAnalise} style={{ background:C.green, border:"none", color:"#fff", borderRadius:8, padding:"9px 16px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                  📄 Exportar HTML
                </button>
              </div>

              <div style={{ background:C.surface, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Panorama Geral</div>
                <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{analysis.resumo}</div>
              </div>

              <div style={{ background:C.surface, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Para onde o dinheiro está indo</div>
                <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{analysis.para_onde_vai}</div>
              </div>

              {analysis.padroes && (
                <div style={{ background:C.surface, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Padrões Identificados</div>
                  <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{analysis.padroes}</div>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
                <StatCard label="Taxa de Poupança" value={`${analysis.taxa_poupanca_pct?.toFixed(1)}%`} icon="📈" color={analysis.taxa_poupanca_pct>=20?C.green:analysis.taxa_poupanca_pct>=10?C.gold:C.red} sub={analysis.avaliacao_poupanca} />
              </div>

              {analysis.top_categorias?.length > 0 && (
                <div>
                  <SectionTitle>Top Categorias de Gasto</SectionTitle>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10 }}>
                    {analysis.top_categorias.map((c,i)=>{
                      const avalColors = { normal:C.green, alto:C.gold, muito_alto:C.red };
                      return (
                        <div key={i} style={{ background:C.surface, borderRadius:12, padding:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{c.categoria}</span>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <span style={{ fontSize:11, background:(avalColors[c.avaliacao]||C.muted)+"22", color:(avalColors[c.avaliacao]||C.muted), borderRadius:6, padding:"2px 8px", fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize" }}>{c.avaliacao?.replace("_"," ")||""}</span>
                              <span style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.text }}>{brl(c.valor)}</span>
                              <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{c.percentual?.toFixed(1)}%</span>
                            </div>
                          </div>
                          {c.detalhe && <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{c.detalhe}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <SectionTitle>Oportunidades de Economia</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10 }}>
                  {(analysis.oportunidades||[]).map((op,i)=>(
                    <div key={i} style={{ background:C.surface, borderRadius:12, padding:14, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{op.categoria}</div>
                        <div style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{op.sugestao}</div>
                      </div>
                      {op.economia_estimada > 0 && (
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>Economia/mês</div>
                          <div style={{ fontSize:16, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.green }}>{brl(op.economia_estimada)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {analysis.oportunidades?.length > 0 && (
                  <div style={{ marginTop:12, fontSize:12, color:C.goldLight, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                    💰 Potencial de economia total: {brl(analysis.oportunidades.reduce((s,o)=>s+(o.economia_estimada||0),0))}/mês
                  </div>
                )}
              </div>
            </div>
            );
          })()}
        </Card>
      )}

      {/* ─── CARTEIRA DE DIVIDENDOS ─── */}
      {tab==="investimentos" && (
        <Card>
          <SectionTitle>Sugestão de Carteira de Dividendos — análise por IA</SectionTitle>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:18, lineHeight:1.6 }}>
            Informe quanto deseja investir e seu perfil de risco. A IA sugere uma carteira diversificada com foco em renda passiva (FIIs, ações pagadoras de dividendos, Tesouro Direto).
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>VALOR A INVESTIR (R$)</div>
              <input style={IS} placeholder="Ex: 10000,00" value={investAmount} onChange={e=>setInvestAmount(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:"'DM Sans',sans-serif" }}>PERFIL DE RISCO</div>
              <select style={IS} value={investRisk} onChange={e=>setInvestRisk(e.target.value)}>
                <option value="conservador">🛡️ Conservador</option>
                <option value="moderado">⚖️ Moderado</option>
                <option value="arrojado">🚀 Arrojado</option>
              </select>
            </div>
          </div>
          <button onClick={runInvestAnalysis} disabled={investLoading} style={{
            background: C.gold, border:"none", color:"#1a1a2e", borderRadius:8,
            padding:"10px 20px", fontSize:12, fontWeight:600,
            fontFamily:"'DM Sans',sans-serif", cursor: investLoading?"default":"pointer", opacity: investLoading?0.6:1,
            marginBottom:20
          }}>{investLoading ? "🤖 Montando carteira..." : "🤖 Sugerir carteira"}</button>

          {investError && (
            <div style={{ fontSize:12, color:C.red, fontFamily:"'DM Sans',sans-serif", background:C.surface, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
              {investError}
            </div>
          )}

          {investLoading && (
            <div style={{ fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:"30px 0" }}>
              Montando sugestão de carteira...
            </div>
          )}

          {investAnalysis && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:C.surface, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>Estratégia</div>
                <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{investAnalysis.estrategia}</div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
                <StatCard label="DY Estimado (anual)" value={`${investAnalysis.yield_estimado_pct?.toFixed(1)}%`} icon="📊" color={C.gold} sub="dividend yield médio" />
                <StatCard label="Renda Mensal Estimada" value={brl(investAnalysis.renda_mensal_estimada)} icon="💵" color={C.green} sub="passiva, aproximada" />
                <StatCard label="Total Investido" value={brl(parseFloat(investAmount.replace(",",".")))} icon="💰" color={C.goldLight} sub={investRisk} />
              </div>

              <div>
                <SectionTitle>Ativos Sugeridos</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                  {(investAnalysis.ativos||[]).map((a,i)=>(
                    <div key={i} style={{ background:C.surface, borderRadius:12, padding:14, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{a.ticker}</span>
                          <span style={{ fontSize:10, background:C.gold+"22", color:C.goldLight, borderRadius:4, padding:"1px 6px", fontFamily:"'DM Sans',sans-serif" }}>{a.tipo}</span>
                        </div>
                        <div style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{a.nome}</div>
                        <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{a.motivo}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:16, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.text }}>{brl(a.valor)}</div>
                        <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>{a.percentual?.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, background:C.surface, borderRadius:12, padding:14, fontStyle:"italic" }}>
                ⚠️ {investAnalysis.aviso}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};


// ─── RELATORIOS ───────────────────────────────────────────────────────────────

const Relatorios = ({ transactions, accounts, cashBal, cartaoTxs=[], cashTxs=[] }) => {
  const [tab, setTab]           = useState("tendencia");
  const [year, setYear]         = useState(String(TODAY.getFullYear()));
  const [selMonths, setSelMonths] = useState([]);   // meses selecionados para acumulado
  const [exportMonth, setExportMonth] = useState(`${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,"0")}`);
  const [showAccum, setShowAccum] = useState(false); // painel de seleção aberto

  const toggleMonth = (key) => setSelMonths(s => s.includes(key) ? s.filter(k=>k!==key) : [...s, key]);
  const clearAccum  = () => { setSelMonths([]); setShowAccum(false); };

  // Transações dos meses selecionados (acumulado) ou ano inteiro
  const accumTxs = selMonths.length > 0
    ? transactions.filter(t => selMonths.some(k => t.date.startsWith(k)) && !t.internalTransfer)
    : null;

  const accumLabel = selMonths.length > 0
    ? selMonths.sort().map(k => MONTH_NAMES[parseInt(k.split("-")[1])-1]+"/"+k.split("-")[0].slice(2)).join(" + ")
    : null;

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

  // Receitas por categoria — all year
  const yearRecTxs = transactions.filter(t=>t.date.startsWith(year)&&t.amount>0&&!t.internalTransfer);
  const byCatRec = {};
  yearRecTxs.forEach(t=>{ byCatRec[t.category]=(byCatRec[t.category]||0)+t.amount; });
  const catSlicesRec = Object.entries(byCatRec).sort((a,b)=>b[1]-a[1]).map(([id,val])=>({ label:catOf(id).label, value:val, color:catOf(id).color, icon:catOf(id).icon, id }));
  const catTotalRec = catSlicesRec.reduce((s,c)=>s+c.value,0)||1;

  // ── BALANÇO GERAL CONSOLIDADO ────────────────────────────────────────────────
  // Junta: extrato (conta corrente, exceto pagamento_cartao) + dinheiro + cartão de crédito
  // Evita duplicação: o pagamento da fatura na conta corrente não entra, só os
  // lançamentos individuais do cartão (que já estão categorizados).
  const balancoPeriod = selMonths.length > 0 ? selMonths : [year];
  const inPeriod = (date) => balancoPeriod.some(k => date.startsWith(k));

  const contaTxsB = transactions.filter(t =>
    inPeriod(t.date) && t.amount < 0 && !t.internalTransfer && t.category !== "pagamento_cartao"
  );
  const cashTxsB = cashTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount) < 0);
  const cartaoTxsB = cartaoTxs.filter(t => inPeriod(t.date) && parseFloat(t.amount) < 0);

  const byCatBalanco = {};
  const addToBalanco = (cat, val, source) => {
    if (!byCatBalanco[cat]) byCatBalanco[cat] = { total: 0, conta: 0, dinheiro: 0, cartao: 0 };
    byCatBalanco[cat].total += val;
    byCatBalanco[cat][source] += val;
  };
  contaTxsB.forEach(t => addToBalanco(t.category || "outros", Math.abs(t.amount), "conta"));
  cashTxsB.forEach(t => addToBalanco(t.category || "outros", Math.abs(parseFloat(t.amount)), "dinheiro"));
  cartaoTxsB.forEach(t => addToBalanco(t.category || "outros", Math.abs(parseFloat(t.amount)), "cartao"));

  const balancoSlices = Object.entries(byCatBalanco)
    .sort((a,b) => b[1].total - a[1].total)
    .map(([id, val]) => ({ id, label: catOf(id).label, icon: catOf(id).icon, color: catOf(id).color, ...val }));
  const balancoTotal = balancoSlices.reduce((s,c)=>s+c.total,0) || 1;

  const balancoTotConta    = contaTxsB.reduce((s,t)=>s+Math.abs(t.amount),0);
  const balancoTotDinheiro = cashTxsB.reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);
  const balancoTotCartao   = cartaoTxsB.reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);

  const balancoPeriodLabel = selMonths.length > 0
    ? selMonths.sort().map(k => MONTH_NAMES[parseInt(k.split("-")[1])-1]+"/"+k.split("-")[0].slice(2)).join(" + ")
    : `Ano ${year}`;

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

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header controls */}
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:2 }}>
          {tabBtn("tendencia","📈 Tendência")}
          {tabBtn("categorias","🍩 Categorias")}
          {tabBtn("balanco","⚖️ Balanço Geral")}
          {tabBtn("pessoa","👥 Por Pessoa")}
          {tabBtn("mensal","📅 Mensal")}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <select style={{ ...IS, width:"auto", fontSize:12 }} value={year} onChange={e=>{ setYear(e.target.value); setSelMonths([]); }}>
            {[0,1,2].map(d=>{ const y=String(TODAY.getFullYear()-d); return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button onClick={()=>setShowAccum(s=>!s)} style={{
            background: selMonths.length>0 ? C.gold+"33" : "transparent",
            border:`1px solid ${selMonths.length>0 ? C.gold : C.border}`,
            color: selMonths.length>0 ? C.goldLight : C.soft,
            borderRadius:8, padding:"8px 14px", fontSize:12,
            fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
          }}>
            Σ {selMonths.length>0 ? `${selMonths.length} meses` : "Somar meses"}
          </button>
          {selMonths.length>0 && (
            <button onClick={()=>exportPDF(transactions,accounts,selMonths,null,cashBal,cartaoTxs,cashTxs)} style={{
              background:"#4caf82", border:"none", color:"#fff", borderRadius:8,
              padding:"8px 14px", fontSize:12, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
            }}>📄 Exportar seleção</button>
          )}
          <select style={{ ...IS, width:"auto", fontSize:12 }} value={exportMonth} onChange={e=>setExportMonth(e.target.value)}>
            {months.map(m=> <option key={m.key} value={m.key}>{m.label}/{year}</option>)}
          </select>
          <button onClick={()=>exportPDF(transactions,accounts,exportMonth,null,cashBal,cartaoTxs,cashTxs)} style={{
            background:"transparent", border:`1px solid ${C.gold}`, color:C.goldLight, borderRadius:8,
            padding:"8px 14px", fontSize:12, fontWeight:600,
            fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
          }}>📄 Exportar mês</button>
          <button onClick={()=>exportCSV(transactions,accounts,null)} style={{
            background:"transparent", border:`1px solid ${C.border}`, color:C.soft, borderRadius:8,
            padding:"8px 14px", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
          }}>⬇ CSV</button>
          <button onClick={()=>exportPDF(transactions,accounts,null,year,cashBal,cartaoTxs,cashTxs)} style={{
            background:C.gold, border:"none", color:"#1a1a2e", borderRadius:8,
            padding:"8px 16px", fontSize:12, fontWeight:600,
            fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
          }}>📄 Exportar ano</button>
        </div>
      </div>

      {/* Seletor de meses */}
      {showAccum && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:17, color:C.text, fontFamily:"'Cormorant Garamond',serif" }}>
              Selecionar meses para somar
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setSelMonths(months.filter(m=>m.txs.length>0).map(m=>m.key))} style={{
                background:"transparent", border:`1px solid ${C.border}`, color:C.muted,
                borderRadius:6, padding:"5px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
              }}>Todos</button>
              <button onClick={clearAccum} style={{
                background:"transparent", border:`1px solid ${C.border}`, color:C.muted,
                borderRadius:6, padding:"5px 12px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
              }}>Limpar</button>
              <button onClick={()=>setShowAccum(false)} style={{
                background:"transparent", border:"none", color:C.muted,
                borderRadius:6, padding:"5px 8px", fontSize:14, cursor:"pointer"
              }}>✕</button>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
            {months.map(m => {
              const sel = selMonths.includes(m.key);
              const hasTxs = m.txs.length > 0;
              return (
                <button key={m.key} onClick={()=>hasTxs&&toggleMonth(m.key)} style={{
                  padding:"10px 4px", borderRadius:8, fontSize:12, fontWeight:sel?600:400,
                  fontFamily:"'DM Sans',sans-serif", cursor:hasTxs?"pointer":"default",
                  background: sel ? C.gold+"33" : "transparent",
                  border:`1px solid ${sel ? C.gold : C.border}`,
                  color: sel ? C.goldLight : hasTxs ? C.soft : C.border,
                  opacity: hasTxs ? 1 : 0.4,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2
                }}>
                  <span>{m.label}</span>
                  {hasTxs && <span style={{ fontSize:9, color: sel?C.gold:C.muted }}>{brl(m.des).replace("R$","").trim()}</span>}
                </button>
              );
            })}
          </div>
          {selMonths.length>0 && (
            <div style={{ marginTop:14, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
              {(()=>{ 
                const rec = accumTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
                const des = accumTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
                return (<>
                  <span style={{ fontSize:12, color:C.green, fontFamily:"'DM Sans',sans-serif" }}>📈 Receitas: <strong>{brl(rec)}</strong></span>
                  <span style={{ fontSize:12, color:C.red,   fontFamily:"'DM Sans',sans-serif" }}>📉 Despesas: <strong>{brl(des)}</strong></span>
                  <span style={{ fontSize:12, color:rec-des>=0?C.goldLight:C.red, fontFamily:"'DM Sans',sans-serif" }}>💰 Saldo: <strong>{brl(rec-des)}</strong></span>
                  <button onClick={()=>exportPDF(transactions,accounts,selMonths,null,cashBal,cartaoTxs,cashTxs)} style={{
                    marginLeft:"auto", background:"#4caf82", border:"none", color:"#fff", borderRadius:8,
                    padding:"8px 18px", fontSize:12, fontWeight:600,
                    fontFamily:"'DM Sans',sans-serif", cursor:"pointer"
                  }}>📄 Exportar {selMonths.length} {selMonths.length===1?"mês":"meses"}</button>
                </>);
              })()}
            </div>
          )}
        </div>
      )}

      {/* KPIs do ano */}
      {(() => {
        const allTxsNoT = transactions.filter(t=>!t.internalTransfer);
        const recAll = allTxsNoT.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
        const desAll = allTxsNoT.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
        const cashRecAll = cashTxs.filter(t=>parseFloat(t.amount)>0).reduce((s,t)=>s+parseFloat(t.amount),0);
        const cashDesAll = cashTxs.filter(t=>parseFloat(t.amount)<0).reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);
        const accountsTotalRel = accounts.reduce((s,a)=>s+(parseFloat(a.balance)||0),0);
        const grandTotalRel = accountsTotalRel + (parseFloat(cashBal)||0);
        const saldoAnteriorRel = grandTotalRel - ((recAll+cashRecAll) - (desAll+cashDesAll));
        return (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
            <StatCard label={`Receitas ${year}`}  value={brl(totRec)}          icon="📈" color={C.green}     sub={`${availMonths.length} meses com dados`} />
            <StatCard label={`Despesas ${year}`}  value={brl(totDes)}          icon="📉" color={C.red}       sub="excl. transferências" />
            <StatCard label="Saldo acumulado"     value={brl(totRec-totDes)}   icon="💰" color={totRec-totDes>=0?C.goldLight:C.red} sub={year} />
            <StatCard label="Economia média/mês"  value={brl(avgSal)}          icon="🎯" color={avgSal>=0?C.green:C.red} sub="receitas − despesas" />
            <StatCard label="Patrimônio total"   value={brl(grandTotalRel)}    icon="🏦" color={C.goldLight} sub="contas + dinheiro" />
            <StatCard label="Saldo anterior"      value={brl(saldoAnteriorRel)} icon="🕓" color={C.muted}    sub="antes dos lançamentos no app" />
          </div>
        );
      })()}

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
          <Card>
            <SectionTitle>Receitas por categoria — {year}</SectionTitle>
            {catSlicesRec.length === 0 ? (
              <div style={{ fontSize:12, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>Sem receitas registradas em {year}.</div>
            ) : (
              <div style={{ display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>
                <DonutChart slices={catSlicesRec} size={180} />
                <div style={{ flex:1, minWidth:200 }}>
                  {catSlicesRec.map(c=>(
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", flex:1 }}>{c.icon} {c.label}</span>
                      <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.green }}>{brl(c.value)}</span>
                      <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", minWidth:36, textAlign:"right" }}>{(c.value/catTotalRec*100).toFixed(0)}%</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Total</span>
                    <span style={{ fontSize:15, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.green }}>{brl(catTotalRec)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── BALANÇO GERAL CONSOLIDADO ─── */}
      {tab==="balanco" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <Card>
            <SectionTitle>Para onde o dinheiro está indo — {balancoPeriodLabel}</SectionTitle>
            <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginBottom:18, lineHeight:1.6 }}>
              Soma conta corrente + dinheiro em espécie + cartão de crédito, por categoria.
              Pagamentos de fatura não são contados (evita duplicidade — cada gasto do cartão já está categorizado individualmente).
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
              <StatCard label="Conta Corrente" value={brl(balancoTotConta)}    icon="🏦" color={C.blue}  sub="débitos em conta" />
              <StatCard label="Dinheiro"       value={brl(balancoTotDinheiro)} icon="💵" color={C.green} sub="espécie" />
              <StatCard label="Cartão Crédito" value={brl(balancoTotCartao)}   icon="💳" color={C.gold}  sub="faturas detalhadas" />
              <StatCard label="Total Geral"    value={brl(balancoTotal)}       icon="⚖️" color={C.goldLight} sub="todos os gastos" />
            </div>
            <div style={{ display:"flex", gap:28, alignItems:"flex-start", flexWrap:"wrap" }}>
              <DonutChart slices={balancoSlices.map(c=>({label:c.label,value:c.total,color:c.color,icon:c.icon,id:c.id}))} size={180} />
              <div style={{ flex:1, minWidth:280 }}>
                {balancoSlices.map(c=>(
                  <div key={c.id} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:C.soft, fontFamily:"'DM Sans',sans-serif", flex:1 }}>{c.icon} {c.label}</span>
                      <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.text }}>{brl(c.total)}</span>
                      <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", minWidth:36, textAlign:"right" }}>{(c.total/balancoTotal*100).toFixed(0)}%</span>
                    </div>
                    {(c.conta>0 || c.dinheiro>0 || c.cartao>0) && (
                      <div style={{ display:"flex", gap:10, marginLeft:20, fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
                        {c.conta>0    && <span>🏦 {brl(c.conta)}</span>}
                        {c.dinheiro>0 && <span>💵 {brl(c.dinheiro)}</span>}
                        {c.cartao>0   && <span>💳 {brl(c.cartao)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
const Dashboard = ({ transactions, accounts, onNavigate, cashBal: cashBalProp }) => {
  const month    = fmt(TODAY).slice(0,7);
  const thisM    = transactions.filter(t => t.date.startsWith(month));
  const receitas = thisM.filter(t=>t.amount>0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);
  const despesas = thisM.filter(t=>t.amount<0&&!t.internalTransfer).reduce((s,t)=>s+t.amount,0);
  const total    = accounts.reduce((s,a)=>s+a.balance,0);
  const invest   = accounts.filter(a=>a.type==="investimento").reduce((s,a)=>s+a.balance,0);
  const cashBal  = cashBalProp ?? 0;

  // Saldo anterior = saldo atual - (receitas - despesas) de TODOS os lançamentos do app.
  // Representa o dinheiro que já existia nas contas/carteira antes de começar a usar o sistema.
  const allTxsNoTransfer = transactions.filter(t=>!t.internalTransfer);
  const totalReceitasAll = allTxsNoTransfer.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const totalDespesasAll = allTxsNoTransfer.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const saldoAnterior = (total + cashBal) - (totalReceitasAll - totalDespesasAll);


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
        <StatCard label="Saldo anterior"     value={brl(saldoAnterior)}      sub="antes dos lançamentos no app" icon="🕓" color={C.muted} />
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
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={{ background:C.green+"15", border:`1px solid ${C.green}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.green, fontFamily:"'DM Sans',sans-serif" }}>
          Entradas: <strong>{brl(totRec)}</strong>
        </div>
        <div style={{ background:C.red+"15", border:`1px solid ${C.red}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.red, fontFamily:"'DM Sans',sans-serif" }}>
          Saídas: <strong>{brl(Math.abs(totDes))}</strong>
        </div>
        <div style={{ background:C.border, borderRadius:10, padding:"10px 20px", fontSize:13, color: (totRec+totDes)>=0?C.green:C.red, fontFamily:"'DM Sans',sans-serif" }}>
          Saldo: <strong>{brl(totRec+totDes)}</strong>
        </div>
        {filter.account ? (() => {
          const acc = accounts.find(a=>a.id===filter.account);
          if (!acc) return null;
          const allAccTxs = transactions.filter(t=>t.accountId===filter.account && !t.internalTransfer);
          const rec = allAccTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
          const des = allAccTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
          const anterior = (acc.balance||0) - (rec - des);
          return (
            <>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
                🕓 Saldo anterior ({acc.name}): <strong style={{color:C.soft}}>{brl(anterior)}</strong>
              </div>
              <div style={{ background:C.goldLight+"15", border:`1px solid ${C.goldLight}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.goldLight, fontFamily:"'DM Sans',sans-serif" }}>
                💰 Saldo atual ({acc.name}): <strong>{brl(acc.balance||0)}</strong>
              </div>
            </>
          );
        })() : (() => {
          const allTxsNoT = transactions.filter(t=>!t.internalTransfer);
          const rec = allTxsNoT.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
          const des = allTxsNoT.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
          const total = accounts.reduce((s,a)=>s+(a.balance||0),0);
          const anterior = total - (rec - des);
          return (
            <>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
                🕓 Saldo anterior (todas as contas): <strong style={{color:C.soft}}>{brl(anterior)}</strong>
              </div>
              <div style={{ background:C.goldLight+"15", border:`1px solid ${C.goldLight}30`, borderRadius:10, padding:"10px 20px", fontSize:13, color:C.goldLight, fontFamily:"'DM Sans',sans-serif" }}>
                💰 Saldo atual (todas as contas): <strong>{brl(total)}</strong>
              </div>
            </>
          );
        })()}
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
                    {fdate(t.date)} · {acc?.name||"—"} · <span style={{color:cat.color}}>{cat.label}{t.subcategory ? ` › ${t.subcategory}` : ""}</span>
                    {t.spender && t.spender !== "casal" && (
                      <span style={{ marginLeft:5, fontSize:10, background: t.spender==="rodrigo"?"#7c6dc922":"#c96da022", color: t.spender==="rodrigo"?"#7c6dc9":"#c96da0", borderRadius:4, padding:"1px 5px" }}>
                        {t.spender==="rodrigo"?"👨 Rodrigo":"👩 Cláudia"}
                      </span>
                    )}
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
                <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:6 }}>
                  <Chip icon={cat.icon} label={cat.label} color={cat.color} />
                  {t.spender && t.spender !== "casal" && (
                    <span style={{ fontSize:10, background: t.spender==="rodrigo"?"#7c6dc922":"#c96da022", color: t.spender==="rodrigo"?"#7c6dc9":"#c96da0", borderRadius:4, padding:"1px 5px", whiteSpace:"nowrap" }}>
                      {t.spender==="rodrigo"?"👨":"👩"}
                    </span>
                  )}
                </div>
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
const ImportarExtrato = ({ accounts, onImport, getTxs }) => {
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

    // detect duplicates — usa getTxs() para garantir lista sempre atualizada
    const currentTxs = getTxs ? getTxs() : [];
    const dups = withInternal.filter(r =>
      currentTxs.some(t => t.accountId===r.accountId && t.date===r.date && Math.abs(t.amount)===Math.abs(r.amount) && t.description.toLowerCase()===r.description.toLowerCase())
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

  const isCasalAcc = accounts.find(a => a.id === selAcc)?.owner === "casal";
  const setSpender = (id, val) => setRows(rs => rs.map(r => r.id===id ? {...r, spender: val} : r));

  const confirmImport = () => {
    const toImport = rows.filter(r=>r.keep).map(r => ({
      ...r,
      spender: (isCasalAcc && r.category !== "taxas") ? (r.spender || "casal") : ""
    }));
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
                  <div style={{ display:"grid", gridTemplateColumns: isCasalAcc ? "40px 75px 1fr 140px 120px 90px" : "40px 75px 1fr 140px 105px", alignItems:"center", padding:"10px 16px", opacity:r.keep?1:.4, background: isDup?"#e0a02008":"transparent" }}>
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
                    {isCasalAcc && r.category !== "taxas" && r.amount < 0 ? (
                      <div style={{ display:"flex", gap:3 }}>
                        {[["rodrigo","👨"],["claudia","👩"],["casal","💑"]].map(([key,icon])=>(
                          <button key={key} onClick={()=>setSpender(r.id,key)} style={{
                            flex:1, padding:"3px 0", borderRadius:6, fontSize:11, cursor:"pointer",
                            background:(r.spender||"casal")===key?C.gold+"33":"transparent",
                            border:`1px solid ${(r.spender||"casal")===key?C.gold:C.border}`,
                            color:(r.spender||"casal")===key?C.gold:C.muted
                          }}>{icon}</button>
                        ))}
                      </div>
                    ) : isCasalAcc ? <div/> : null}
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

  const confirm = async () => {
    const rawAmt = parseFloat(String(form.amount).replace(",",".")) || 0;
    const finalAmt = form.type==="receita" ? Math.abs(rawAmt) : -Math.abs(rawAmt);
    try {
      await onAddTx({ ...form, amount: finalAmt });
      setStep("done");
    } catch(e) {
      alert("Erro ao salvar: " + e.message);
    }
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

  const spendable = DEFAULT_CATEGORIES.filter(c=>!["receita","salario_claudia","consulta_particular","planos_ortasso","fat_olade","laudos","trf","trt","pag_sjc","outras_receitas","transferencia"].includes(c.id));

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

const Carteira = ({ accounts, onCashChange, transactions=[] }) => {
  const [cashTxs, setCashTxs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editCash, setEditCash] = useState(null);
  const [form, setForm] = useState({ date: fmt(TODAY), description: "", amount: "", type: "saida", category: "outros", subcategory: "", notes: "", owner: "rodrigo" });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load cash transactions from Supabase, fallback to localStorage
  useEffect(() => {
    dbFrom("cash_transactions").then(tbl => {
      if (!tbl) {
        // No Supabase — use localStorage
        try { setCashTxs(JSON.parse(localStorage.getItem("fontanezzi_cash_txs")) || []); } catch {}
        return;
      }
      tbl.select("*", "&order=date.desc").then(res => {
        if (res?.data?.length) {
          setCashTxs(res.data);
        } else {
          // Supabase empty — migrate from localStorage if exists
          try {
            const local = JSON.parse(localStorage.getItem("fontanezzi_cash_txs")) || [];
            if (local.length) {
              setCashTxs(local);
              // Migrate to Supabase
              Promise.all(local.map(tx => tbl.insert({
                ...tx,
                owner: tx.owner || "rodrigo"
              }))).then(() => {
                localStorage.removeItem("fontanezzi_cash_txs");
              });
            }
          } catch {}
        }
      });
    });
  }, []);

  const cashBalance = cashTxs.reduce((s, t) => s + parseFloat(t.amount||0), 0);
  const cashRodrigo = cashTxs.filter(t=>t.owner==="rodrigo"||!t.owner).reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const cashClaudia = cashTxs.filter(t=>t.owner==="claudia").reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const accountsTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const grandTotal = accountsTotal + cashBalance;

  // Saldo anterior total: o que já existia antes de começar a lançar no app
  const allTxsNoTransfer = transactions.filter(t=>!t.internalTransfer);
  const allRec = allTxsNoTransfer.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const allDes = allTxsNoTransfer.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const cashRec = cashTxs.filter(t=>parseFloat(t.amount)>0).reduce((s,t)=>s+parseFloat(t.amount),0);
  const cashDes = cashTxs.filter(t=>parseFloat(t.amount)<0).reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0);
  const saldoAnteriorTotal = grandTotal - ((allRec + cashRec) - (allDes + cashDes));


  const openNew = () => { setForm({ date: fmt(TODAY), description: "", amount: "", type: "saida", category: "outros", subcategory: "", notes: "", owner: "rodrigo" }); setEditCash(null); setShowForm(true); };
  const openEdit = (tx) => { setEditCash(tx); setForm({ ...tx, type: parseFloat(tx.amount) >= 0 ? "entrada" : "saida", amount: Math.abs(parseFloat(tx.amount)).toString(), owner: tx.owner || "rodrigo" }); setShowForm(true); };

  // ── Ajustar saldo de dinheiro diretamente (sem criar lançamento manual) ─────
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustVal, setAdjustVal]   = useState("");
  const [adjustOwner, setAdjustOwner] = useState("casal");

  const openAdjust = () => { setAdjustVal(cashBalance.toFixed(2).replace(".",",")); setAdjustOwner("casal"); setShowAdjust(true); };

  const handleAdjust = async () => {
    const newTotal = parseFloat(adjustVal.replace(",","."));
    if (isNaN(newTotal)) return;
    const diff = newTotal - cashBalance;
    if (Math.abs(diff) < 0.005) { setShowAdjust(false); return; } // sem mudança

    const tx = {
      id: "cash_adj_" + Date.now(),
      date: fmt(TODAY),
      description: "Ajuste de saldo",
      amount: diff,
      type: diff >= 0 ? "entrada" : "saida",
      category: "outros",
      notes: "Ajuste manual do saldo em dinheiro",
      owner: adjustOwner,
    };

    const next = [tx, ...cashTxs];
    setCashTxs(next);
    setShowAdjust(false);
    if (onCashChange) onCashChange();

    // Persistir em background
    dbFrom("cash_transactions").then(tbl => tbl?.insert(tx)).catch(err => console.error("[adjust]", err));
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) return;
    const amt = parseFloat(form.amount.replace(",", "."));
    if (isNaN(amt)) return;
    const tx = { ...form, id: editCash?.id || ("cash_" + Date.now()), amount: form.type === "entrada" ? Math.abs(amt) : -Math.abs(amt) };
    const isEdit = !!editCash;

    // 1. Fechar modal e atualizar UI imediatamente
    const next = isEdit ? cashTxs.map(t => t.id === tx.id ? tx : t) : [tx, ...cashTxs];
    setCashTxs(next);
    setShowForm(false); setEditCash(null);
    if (onCashChange) onCashChange();

    // 2. Persistir no Supabase em background
    dbFrom("cash_transactions").then(async tbl => {
      if (!tbl) return;
      if (isEdit) await tbl.update(tx, { id: tx.id });
      else await tbl.insert(tx);
    }).catch(err => console.error("[cashSave]", err));
  };

  const handleDelete = async (id) => {
    setCashTxs(prev => prev.filter(t => t.id !== id));
    if (onCashChange) onCashChange();
    dbFrom("cash_transactions").then(tbl => tbl?.del({ id }));
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

  // Saldo anterior de uma conta: saldo atual - (receitas - despesas) lançadas nessa conta
  const saldoAnteriorConta = (accId) => {
    const txs = transactions.filter(t => t.accountId === accId && !t.internalTransfer);
    const rec = txs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const des = txs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const acc = accounts.find(a=>a.id===accId);
    return (acc?.balance||0) - (rec - des);
  };

  const AccountRow = ({ a }) => {
    const anterior = saldoAnteriorConta(a.id);
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans',sans-serif" }}>{a.name}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{typeLabel[a.type] || a.type}</div>
            {Math.abs(anterior) > 0.005 && (
              <div style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Sans',sans-serif", marginTop:2 }}>Saldo anterior: {brl(anterior)}</div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 16, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: a.balance >= 0 ? C.text : C.red }}>
          {brl(a.balance)}
        </div>
      </div>
    );
  };

  // Subtotals
  const sumOf = (arr) => arr.reduce((s, a) => s + a.balance, 0);
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
          {[
            ["🏦 Contas", brl(accountsTotal), "#60a5fa"],
            ["💵 Dinheiro", brl(cashBalance), cashBalance >= 0 ? "#34d399" : "#f87171"],
            ["🕓 Saldo anterior", brl(saldoAnteriorTotal), "#94a3b8"],
          ].map(([label, val, col]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif", marginBottom: 4, whiteSpace: "nowrap" }}>{label}</div>
              <div style={{ fontSize: 16, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</div>
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
                <span style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.soft }}>{brl(sumOf(correntes))}</span>
              </div>
            )}
            {investimentos.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Subtotal investimentos</span>
                <span style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.blue }}>{brl(sumOf(investimentos))}</span>
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
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>total somado</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={openAdjust} style={{
                background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "9px 14px", fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: "pointer"
              }}>✏️ Ajustar saldo</button>
              <button onClick={openNew} style={{
                background: C.gold, color: C.bg, border: "none", borderRadius: 8,
                padding: "9px 16px", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer"
              }}>+ Lançar</button>
            </div>
          </div>

          {/* Por pessoa */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
            {[
              ["👨 Rodrigo", cashRodrigo, C.blue],
              ["👩 Cláudia", cashClaudia, C.purple],
              ["Total", cashBalance, cashBalance >= 0 ? C.green : C.red],
            ].map(([label, val, col], i) => (
              <div key={label} style={{ padding: "12px 14px", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
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
              const ownerIcon = t.owner === "claudia" ? "👩" : "👨";
              return (
                <div key={t.id}>
                  {i > 0 && <div style={{ height: 1, background: C.border }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px" }}>
                    <div style={{ fontSize: 18 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>{fdate(t.date)} · {ownerIcon} · {cat.label}{t.subcategory ? ` › ${t.subcategory}` : ""}</div>
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
      {showAdjust && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, width: 400, maxWidth: "95vw" }}>
            <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond',serif", color: C.text, marginBottom: 8 }}>
              Ajustar saldo em dinheiro
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 22, lineHeight: 1.5 }}>
              Informe o valor total que você tem em espécie agora. O sistema calcula a diferença e registra automaticamente um ajuste — sem precisar lançar entrada ou saída manualmente.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>SALDO ATUAL</div>
                <div style={{ fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: C.soft }}>{brl(cashBalance)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>NOVO SALDO TOTAL (R$)</div>
                <input
                  style={IS}
                  placeholder="0,00"
                  value={adjustVal}
                  onChange={e => setAdjustVal(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>ATRIBUIR DIFERENÇA A</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["rodrigo","👨 Rodrigo","#7c6dc9"],["claudia","👩 Cláudia","#c96da0"],["casal","💑 Casal","#4caf82"]].map(([key,label,color])=>(
                    <button key={key} onClick={()=>setAdjustOwner(key)} style={{
                      flex:1, padding:"9px 0", borderRadius:8, fontSize:12, fontWeight:500,
                      fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                      background: adjustOwner===key ? color+"22" : "transparent",
                      border:`1px solid ${adjustOwner===key ? color : C.border}`,
                      color: adjustOwner===key ? color : C.muted
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              {(() => {
                const newTotal = parseFloat(adjustVal.replace(",","."));
                if (isNaN(newTotal)) return null;
                const diff = newTotal - cashBalance;
                if (Math.abs(diff) < 0.005) return null;
                return (
                  <div style={{ fontSize: 12, color: diff>=0?C.green:C.red, fontFamily: "'DM Sans',sans-serif", background: C.surface, borderRadius:8, padding:"10px 12px" }}>
                    {diff>=0 ? "Será lançada uma entrada de " : "Será lançada uma saída de "}
                    <strong>{brl(Math.abs(diff))}</strong> para ajustar o saldo.
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={handleAdjust} style={{ flex: 1, background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Salvar ajuste</button>
              <button onClick={()=>setShowAdjust(false)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 20px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

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
                  <button key={t} onClick={()=>{
                    sf("type",t);
                    // Resetar categoria para o grupo correto ao trocar entrada/saída
                    const receitaCats = ["receita","salario_claudia","consulta_particular","planos_ortasso","fat_olade","laudos","trf","trt","pag_sjc","outras_receitas"];
                    const isCurrentReceita = receitaCats.includes(form.category);
                    if (t === "entrada" && !isCurrentReceita) sf("category","receita");
                    if (t === "saida" && isCurrentReceita) sf("category","outros");
                  }} style={{
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
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>DE QUEM</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["rodrigo","👨 Rodrigo"],["claudia","👩 Cláudia"]].map(([v,l])=>(
                    <button key={v} onClick={()=>sf("owner",v)} style={{
                      flex:1, padding:"9px", borderRadius:8, fontSize:13,
                      fontFamily:"'DM Sans',sans-serif", cursor:"pointer", fontWeight:500,
                      background: form.owner===v ? C.blue+"22" : "transparent",
                      border: `1px solid ${form.owner===v ? C.blue : C.border}`,
                      color: form.owner===v ? C.blue : C.muted
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>CATEGORIA</div>
                <select style={IS} value={form.category} onChange={e=>sf("category",e.target.value)}>
                  {(form.type === "entrada"
                    ? DEFAULT_CATEGORIES.filter(c=>["receita","salario_claudia","consulta_particular","planos_ortasso","fat_olade","laudos","trf","trt","pag_sjc","outras_receitas"].includes(c.id))
                    : DEFAULT_CATEGORIES.filter(c=>!["receita","salario_claudia","consulta_particular","planos_ortasso","fat_olade","laudos","trf","trt","pag_sjc","outras_receitas","transferencia"].includes(c.id))
                  ).map(c=>(
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              {subOf(form.category).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>SUBCATEGORIA</div>
                  <select style={IS} value={form.subcategory||""} onChange={e=>sf("subcategory",e.target.value)}>
                    <option value="">— Selecionar —</option>
                    {subOf(form.category).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
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

// ─── DÍVIDAS (automático a partir de lançamentos categoria "divida") ──────────
const Dividas = ({ transactions=[], cashTxs=[], cartaoTxs=[] }) => {
  // Junta lançamentos das 3 origens classificados como "divida" (apenas despesas)
  const allDividaTxs = [
    ...transactions.filter(t => t.category==="divida" && t.amount<0 && !t.internalTransfer).map(t=>({...t, origem:"Conta corrente", origemIcon:"🏦"})),
    ...cashTxs.filter(t => t.category==="divida" && parseFloat(t.amount)<0).map(t=>({...t, amount:parseFloat(t.amount), origem:"Dinheiro", origemIcon:"💵"})),
    ...cartaoTxs.filter(t => t.category==="divida" && parseFloat(t.amount)<0).map(t=>({...t, amount:parseFloat(t.amount), origem:"Cartão", origemIcon:"💳"})),
  ].sort((a,b) => b.date.localeCompare(a.date));

  // ── Seleção de mês(es) ────────────────────────────────────────────────────────
  const [selMonths, setSelMonths] = useState(() => {
    const y = TODAY.getFullYear();
    const m = String(TODAY.getMonth()+1).padStart(2,"0");
    return [`${y}-${m}`];
  });
  const [periodYear, setPeriodYear] = useState(TODAY.getFullYear());
  const toggleMonth = (key) => setSelMonths(s => s.includes(key) ? s.filter(k=>k!==key) : [...s,key]);

  const filtered = selMonths.length === 0
    ? allDividaTxs
    : allDividaTxs.filter(t => selMonths.some(k => t.date.startsWith(k)));

  const total = filtered.reduce((s,t)=>s+Math.abs(t.amount),0);

  const periodLabel = selMonths.length === 0
    ? "todos os períodos"
    : [...selMonths].sort().map(k => {
        const [y,m] = k.split("-");
        return MONTH_NAMES[parseInt(m)-1] + "/" + y;
      }).join(" + ");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Seletor de mês(es) */}
      <Card>
        <SectionTitle>Selecionar período</SectionTitle>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={()=>setPeriodYear(y=>y-1)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>‹</button>
            <span style={{ fontSize:13, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.text }}>{periodYear}</span>
            <button onClick={()=>setPeriodYear(y=>y+1)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>›</button>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setSelMonths([])} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Todos</button>
            <button onClick={()=>{
              const y = TODAY.getFullYear(); const m = String(TODAY.getMonth()+1).padStart(2,"0");
              setSelMonths([`${y}-${m}`]); setPeriodYear(y);
            }} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>Mês atual</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
          {Array.from({length:12},(_,i)=>{
            const key = `${periodYear}-${String(i+1).padStart(2,"0")}`;
            const sel = selMonths.includes(key);
            const hasData = allDividaTxs.some(t=>t.date.startsWith(key));
            return (
              <button key={key} onClick={()=>{ if(hasData) toggleMonth(key); }} style={{
                padding:"8px 4px", borderRadius:8, fontSize:11, fontWeight:sel?700:400,
                fontFamily:"'DM Sans',sans-serif", cursor:hasData?"pointer":"default",
                background: sel ? C.gold+"22" : "transparent",
                border:`1px solid ${sel ? C.gold : C.border}`,
                color: sel ? C.goldLight : hasData ? C.soft : C.border,
                opacity: hasData ? 1 : 0.35
              }}>{MONTH_NAMES[i]}</button>
            );
          })}
        </div>
      </Card>

      {/* Total */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        <StatCard label="Total em dívidas pagas" value={brl(total)} icon="📉" color={C.red} sub={`${filtered.length} lançamento${filtered.length!==1?"s":""} · ${periodLabel}`} />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"40px 24px", textAlign:"center", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
          {allDividaTxs.length === 0 ? (
            <>Nenhum lançamento classificado como <strong style={{color:C.soft}}>Dívida</strong> ainda.<br/>
            Lançamentos com essa categoria — em conta corrente, dinheiro ou cartão — aparecem aqui automaticamente.</>
          ) : (
            <>Nenhuma dívida em {periodLabel}.</>
          )}
        </div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          {filtered.map((t,i) => (
            <div key={t.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom: i<filtered.length-1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:20 }}>{t.origemIcon}</span>
                <div>
                  <div style={{ fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{t.description}</div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>
                    {fdate(t.date)} · {t.origem}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:16, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.red }}>
                {brl(Math.abs(t.amount))}
              </div>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", background:C.surface }}>
            <span style={{ fontSize:13, color:C.soft, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Total</span>
            <span style={{ fontSize:18, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.red }}>{brl(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CARTÕES DE CRÉDITO ───────────────────────────────────────────────────────
const CARTOES_KEY = "fontanezzi_cartoes";       // fallback local
const CARTAO_TXS_KEY = "fontanezzi_cartao_txs"; // fallback local

// Helpers locais
const loadCartoes = () => { try { return JSON.parse(localStorage.getItem(CARTOES_KEY)) || []; } catch { return []; } };
const saveCartoes = (d) => localStorage.setItem(CARTOES_KEY, JSON.stringify(d));
const loadCartaoTxs = () => { try { return JSON.parse(localStorage.getItem(CARTAO_TXS_KEY)) || []; } catch { return []; } };
const saveCartaoTxs = (d) => localStorage.setItem(CARTAO_TXS_KEY, JSON.stringify(d));

const BANDEIRAS = ["Visa","Mastercard","Elo","American Express","Hipercard","Outros"];
const CARTAO_COLORS = ["#1a56db","#e3a008","#0e9f6e","#9061f9","#e74694","#6b7280"];

// ─── FORM CADASTRO CARTÃO ─────────────────────────────────────────────────────
const CartaoForm = ({ initial, onSave, onClose }) => {
  const blank = { nome:"", bandeira:"Visa", owner:"rodrigo", limite:"", vencimento:"", cor:CARTAO_COLORS[0] };
  const [f, setF] = useState(initial ? {...initial, limite:String(initial.limite||"")} : blank);
  const sf = (k,v) => setF(x=>({...x,[k]:v}));
  const handleSave = () => {
    if (!f.nome.trim()) return;
    onSave({ ...f, id:initial?.id||("cc_"+Date.now()), limite:parseFloat(String(f.limite).replace(",","."))||0 });
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#0009",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:440}}>
        <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:C.text,marginBottom:22}}>{initial?"Editar cartão":"Novo cartão"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Nome do cartão</div>
            <input style={IS} placeholder="Ex: Nubank, C6, Inter..." value={f.nome} onChange={e=>sf("nome",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Bandeira</div>
              <select style={IS} value={f.bandeira} onChange={e=>sf("bandeira",e.target.value)}>
                {BANDEIRAS.map(b=><option key={b} value={b}>{b}</option>)}
              </select></div>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Titular</div>
              <select style={IS} value={f.owner} onChange={e=>sf("owner",e.target.value)}>
                <option value="rodrigo">👨 Rodrigo</option>
                <option value="claudia">👩 Cláudia</option>
                <option value="casal">💑 Casal</option>
              </select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Limite (R$)</div>
              <input style={IS} placeholder="0,00" value={f.limite} onChange={e=>sf("limite",e.target.value)}/></div>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Vencimento (dia)</div>
              <input style={IS} placeholder="10" type="number" min="1" max="31" value={f.vencimento} onChange={e=>sf("vencimento",e.target.value)}/></div>
          </div>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:8,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Cor</div>
            <div style={{display:"flex",gap:8}}>
              {CARTAO_COLORS.map(cor=>(
                <div key={cor} onClick={()=>sf("cor",cor)} style={{width:28,height:28,borderRadius:"50%",background:cor,cursor:"pointer",border:f.cor===cor?"3px solid #1e2535":"3px solid transparent",transition:"all .15s"}}/>
              ))}
            </div></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={handleSave} style={{flex:1,background:C.gold,color:C.bg,border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Salvar</button>
          <button onClick={onClose} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 18px",fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── FORM LANÇAMENTO CARTÃO ───────────────────────────────────────────────────
const CartaoTxForm = ({ cartoes, initial, onSave, onClose }) => {
  const blank = { cartaoId:cartoes[0]?.id||"", date:fmt(TODAY), description:"", amount:"", category:"outros", subcategory:"", notes:"" };
  const [f, setF] = useState(initial ? {...initial, amount:String(Math.abs(initial.amount||"")), subcategory:initial.subcategory||""} : blank);
  const sf = (k,v) => setF(x=>({...x,[k]:v, ...(k==="category"?{subcategory:""}:{})}));
  const handleSave = () => {
    if (!f.description.trim() || !f.amount || !f.cartaoId) return;
    const amt = parseFloat(String(f.amount).replace(",","."));
    if (isNaN(amt)) return;
    onSave({ ...f, id:initial?.id||("cctx_"+Date.now()), amount:-Math.abs(amt) });
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#0009",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:440}}>
        <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:C.text,marginBottom:22}}>{initial?"Editar lançamento":"Novo lançamento"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Cartão</div>
            <select style={IS} value={f.cartaoId} onChange={e=>sf("cartaoId",e.target.value)}>
              {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.bandeira})</option>)}
            </select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Data</div>
              <input type="date" style={IS} value={f.date} onChange={e=>sf("date",e.target.value)}/></div>
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Valor (R$)</div>
              <input style={IS} placeholder="0,00" value={f.amount} onChange={e=>sf("amount",e.target.value)}/></div>
          </div>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Descrição</div>
            <input style={IS} placeholder="Ex: Supermercado, Farmácia..." value={f.description} onChange={e=>sf("description",e.target.value)}/></div>
          <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Categoria</div>
            <select style={IS} value={f.category} onChange={e=>sf("category",e.target.value)}>
              {DEFAULT_CATEGORIES.filter(c=>!["receita","salario_claudia","consulta_particular","planos_ortasso","fat_olade","laudos","trf","trt","pag_sjc","outras_receitas","transferencia"].includes(c.id))
                .map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select></div>
          {subOf(f.category).length > 0 && (
            <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Subcategoria</div>
              <select style={IS} value={f.subcategory||""} onChange={e=>sf("subcategory",e.target.value)}>
                <option value="">— Selecionar —</option>
                {subOf(f.category).map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
          )}
          <div><div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Obs.</div>
            <input style={IS} placeholder="Opcional..." value={f.notes||""} onChange={e=>sf("notes",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={handleSave} style={{flex:1,background:C.gold,color:C.bg,border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Salvar</button>
          <button onClick={onClose} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 18px",fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── CARTÕES MAIN COMPONENT ───────────────────────────────────────────────────
const Cartoes = () => {
  const [cartoes, setCartoes]       = useState([]);
  const [txs, setTxsState]          = useState([]);
  const txsRef = useRef([]);
  const setTxs = (val) => {
    const next = typeof val === "function" ? val(txsRef.current) : val;
    txsRef.current = next;
    setTxsState(next);
  };
  const [showCartaoForm, setShowCC] = useState(false);
  const [editCartao, setEditCC]     = useState(null);
  const [showTxForm, setShowTx]     = useState(false);
  const [editTx, setEditTx]         = useState(null);
  const [selCartao, setSelCartao]   = useState(null); // null = todos
  const [selMonth, setSelMonth]     = useState(fmt(TODAY).slice(0,7));
  const [uploading, setUploading]   = useState(false);
  const [uploadStatus, setUpStatus] = useState("");
  const [tab, setTab]               = useState("resumo"); // resumo | lancamentos | cartoes
  const [loadingCC, setLoadingCC]   = useState(true);
  const toastRef = useRef(null);

  const showToast = (msg) => {
    setUpStatus(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setUpStatus(""), 3000);
  };

  // ── Carregar do Supabase (com fallback/migração do localStorage) ────────────
  useEffect(() => {
    const load = async () => {
      setLoadingCC(true);
      const [ccTbl, txTbl] = await Promise.all([dbFrom("cartoes"), dbFrom("cartao_transactions")]);

      let ccData = [];
      if (ccTbl) {
        const res = await ccTbl.select("*", "&order=created_at.asc");
        ccData = res?.data || [];
      }
      // Migração: se Supabase vazio mas há dados locais, sobe pro Supabase
      if (ccData.length === 0) {
        const local = loadCartoes();
        if (local.length > 0 && ccTbl) {
          await Promise.all(local.map(c => ccTbl.insert({
            id: c.id, nome: c.nome, bandeira: c.bandeira, owner: c.owner,
            limite: c.limite || 0, vencimento: c.vencimento || null, cor: c.cor,
            limite_utilizado: c.limiteUtilizado ?? null, limite_disponivel: c.limiteDisponivel ?? null,
          })));
          ccData = local.map(c => ({
            id: c.id, nome: c.nome, bandeira: c.bandeira, owner: c.owner,
            limite: c.limite || 0, vencimento: c.vencimento, cor: c.cor,
            limite_utilizado: c.limiteUtilizado ?? null, limite_disponivel: c.limiteDisponivel ?? null,
          }));
        }
      }
      setCartoes(ccData.map(c => ({
        id: c.id, nome: c.nome, bandeira: c.bandeira, owner: c.owner,
        limite: parseFloat(c.limite) || 0, vencimento: c.vencimento, cor: c.cor,
        limiteUtilizado: c.limite_utilizado != null ? parseFloat(c.limite_utilizado) : null,
        limiteDisponivel: c.limite_disponivel != null ? parseFloat(c.limite_disponivel) : null,
      })));

      let txData = [];
      if (txTbl) {
        const res = await txTbl.select("*", "&order=date.desc");
        txData = res?.data || [];
      }
      if (txData.length === 0) {
        const local = loadCartaoTxs();
        if (local.length > 0 && txTbl) {
          await Promise.all(local.map(t => txTbl.insert({
            id: t.id, cartao_id: t.cartaoId, date: t.date, description: t.description,
            amount: t.amount, category: t.category || "outros", notes: t.notes || "",
            spender: t.spender || "",
          })));
          txData = local.map(t => ({
            id: t.id, cartao_id: t.cartaoId, date: t.date, description: t.description,
            amount: t.amount, category: t.category || "outros", notes: t.notes || "", spender: t.spender || "",
          }));
        }
      }
      setTxs(txData.map(t => ({
        id: t.id, cartaoId: t.cartao_id, date: t.date, description: t.description,
        amount: parseFloat(t.amount), category: t.category || "outros",
        notes: t.notes || "", spender: t.spender || "",
      })));
      setLoadingCC(false);
    };
    load();
  }, []);

  const saveCC = async (c) => {
    const exists = cartoes.find(x=>x.id===c.id);
    const next = exists ? cartoes.map(x=>x.id===c.id?c:x) : [...cartoes,c];
    setCartoes(next);
    setShowCC(false); setEditCC(null);
    showToast("✅ Cartão salvo!");

    const tbl = await dbFrom("cartoes");
    if (!tbl) return;
    const dbRow = {
      nome: c.nome, bandeira: c.bandeira, owner: c.owner, limite: c.limite || 0,
      vencimento: c.vencimento || null, cor: c.cor,
      limite_utilizado: c.limiteUtilizado ?? null, limite_disponivel: c.limiteDisponivel ?? null,
    };
    if (exists) await tbl.update(dbRow, { id: c.id });
    else await tbl.insert({ id: c.id, ...dbRow });
  };

  const deleteCC = async (id) => {
    if (!window.confirm("Excluir este cartão?")) return;
    const next = cartoes.filter(c=>c.id!==id);
    setCartoes(next);
    const txNext = txsRef.current.filter(t=>t.cartaoId!==id);
    setTxs(txNext);

    const [ccTbl, txTbl] = await Promise.all([dbFrom("cartoes"), dbFrom("cartao_transactions")]);
    if (ccTbl) await ccTbl.del({ id });
    if (txTbl) {
      const toDelete = txsRef.current.filter(t=>t.cartaoId===id);
      await Promise.all(toDelete.map(t => txTbl.del({ id: t.id })));
    }
  };


  // Salvar transações importadas em lote no Supabase
  const persistCartaoTxs = async (newTxs) => {
    const tbl = await dbFrom("cartao_transactions");
    if (!tbl) return;
    for (let i=0; i<newTxs.length; i+=20) {
      await Promise.all(newTxs.slice(i,i+20).map(t => tbl.insert({
        id: t.id, cartao_id: t.cartaoId, date: t.date, description: t.description,
        amount: t.amount, category: t.category || "outros", notes: t.notes || "", spender: t.spender || "",
      })));
    }
  };

  // Persistir limite do cartão no Supabase
  const persistCartaoLimite = async (cartaoId, fields) => {
    const tbl = await dbFrom("cartoes");
    if (!tbl || !cartaoId) return;
    const dbFields = {};
    if ("limite" in fields) dbFields.limite = fields.limite;
    if ("limiteUtilizado" in fields) dbFields.limite_utilizado = fields.limiteUtilizado;
    if ("limiteDisponivel" in fields) dbFields.limite_disponivel = fields.limiteDisponivel;
    await tbl.update(dbFields, { id: cartaoId });
  };

  const saveTx = async (tx) => {
    const exists = txsRef.current.find(x=>x.id===tx.id);
    const next = exists ? txsRef.current.map(x=>x.id===tx.id?tx:x) : [tx,...txsRef.current];
    setTxs(next);
    setShowTx(false); setEditTx(null);
    showToast("✅ Lançamento salvo!");

    const tbl = await dbFrom("cartao_transactions");
    if (!tbl) return;
    const dbRow = {
      cartao_id: tx.cartaoId, date: tx.date, description: tx.description,
      amount: tx.amount, category: tx.category || "outros",
      notes: tx.notes || "", spender: tx.spender || "",
    };
    if (exists) await tbl.update(dbRow, { id: tx.id });
    else await tbl.insert({ id: tx.id, ...dbRow });
  };

  const deleteTx = async (id) => {
    const next = txsRef.current.filter(t=>t.id!==id);
    setTxs(next);
    const tbl = await dbFrom("cartao_transactions");
    if (tbl) await tbl.del({ id });
  };

  // ── Parsers de CSV por bandeira ──────────────────────────────────────────────
  const parseCSVFatura = (text, cartao) => {
    const nome = (cartao?.nome || "").toLowerCase();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // ── Nubank: "date","title","amount"  (formato real exportado pelo app)
    if (nome.includes("nubank") || (lines[0]?.toLowerCase().includes("date") && lines[0]?.toLowerCase().includes("title") && lines[0]?.toLowerCase().includes("amount"))) {
      const txs = []; let limite_total = null; let limite_disponivel = null;
      for (let i=1; i<lines.length; i++) {
        // Parsear respeitando aspas: campos podem ter vírgula dentro de aspas
        const cols = [];
        let cur = ""; let inQ = false;
        for (const ch of lines[i]) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
          else { cur += ch; }
        }
        cols.push(cur.trim());

        if (cols.length < 3) continue;
        const rawDate = cols[0];
        const desc    = cols[1];
        // amount: pode ser "280,00" ou "- 3.100,48" (pagamento)
        const rawAmt  = cols[2].replace(/"/g,"").replace(/\./g,"").replace(",",".").trim();
        const amt     = parseFloat(rawAmt);
        if (!desc || isNaN(amt)) continue;
        if (amt <= 0) continue; // ignorar pagamentos (negativos = crédito na fatura)
        const date = rawDate.match(/\d{4}-\d{2}-\d{2}/) ? rawDate.slice(0,10)
          : rawDate.match(/(\d{2})\/(\d{2})\/(\d{4})/) ? rawDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1") : rawDate;
        txs.push({ date, description: desc, amount: amt, category: "outros" });
      }
      return { transacoes: txs, limite_total, limite_disponivel };
    }

    // ── PicPay: "Data","Descrição","Valor","Parcela","Categoria"
    if (nome.includes("picpay") || lines[0]?.toLowerCase().includes("descrição") && lines[0]?.toLowerCase().includes("parcela")) {
      const txs = [];
      for (let i=1; i<lines.length; i++) {
        const cols = lines[i].match(/(".*?"|[^,;]+)(?=[,;]|$)/g)?.map(c=>c.replace(/^"|"$/g,"").trim()) || [];
        if (cols.length < 3) continue;
        const rawDate = cols[0]; const desc = cols[1];
        const rawAmt = String(cols[2]).replace("R$","").replace(".","").replace(",",".").trim();
        const amt = Math.abs(parseFloat(rawAmt));
        if (!desc || isNaN(amt) || amt <= 0) continue;
        const date = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4})/) ? rawDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1")
          : rawDate.match(/\d{4}-\d{2}-\d{2}/) ? rawDate.slice(0,10) : rawDate;
        const cat = cols[4] || "outros";
        txs.push({ date, description: desc, amount: amt, category: mapCategory(cat) });
      }
      return { transacoes: txs, limite_total: null, limite_disponivel: null };
    }

    // ── Next / genérico: tentar detectar automaticamente
    const txs = [];
    for (let i=1; i<lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c=>c.replace(/^"|"$/g,"").trim());
      if (cols.length < 3) continue;
      // Procurar coluna de data, descrição e valor
      const dateCol = cols.find(c => c.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/));
      if (!dateCol) continue;
      const amtRaw = cols.reverse().find(c => c.match(/[\d,.]+/));
      const amt = Math.abs(parseFloat(String(amtRaw||"").replace("R$","").replace(".","").replace(",",".")));
      if (!amtRaw || isNaN(amt) || amt <= 0) continue;
      cols.reverse();
      const dateIdx = cols.findIndex(c => c.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/));
      const desc = cols.slice(dateIdx+1).find(c=>c.length>3 && !c.match(/^[\d,.R$]+$/)) || "Lançamento";
      const date = dateCol.match(/(\d{2})\/(\d{2})\/(\d{4})/) ? dateCol.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1") : dateCol.slice(0,10);
      txs.push({ date, description: desc, amount: amt, category: "outros" });
    }
    return { transacoes: txs, limite_total: null, limite_disponivel: null };
  };

  // Mapeia categorias do CSV para as categorias do app
  const mapCategory = (cat) => {
    const c = (cat||"").toLowerCase();
    if (c.includes("restaurante")||c.includes("food")||c.includes("aliment")||c.includes("lanche")) return "restaurante";
    if (c.includes("feira")||c.includes("hortifruti")||c.includes("verdura")||c.includes("sacolão")||c.includes("sacolao")) return "feira";
    if (c.includes("supermercado")||c.includes("mercado")) return "supermercado";
    if (c.includes("farmácia")||c.includes("farmacia")||c.includes("drogaria")||c.includes("saúde")||c.includes("saude")) return "farmacia";
    if (c.includes("transporte")||c.includes("uber")||c.includes("99")||c.includes("posto")||c.includes("gasolina")) return "transporte";
    if (c.includes("educação")||c.includes("educacao")||c.includes("escola")||c.includes("curso")) return "educacao";
    if (c.includes("lazer")||c.includes("entretenimento")||c.includes("cinema")||c.includes("streaming")) return "lazer";
    if (c.includes("vestuário")||c.includes("vestuario")||c.includes("roupa")||c.includes("calçado")) return "vestuario";
    if (c.includes("viagem")||c.includes("hotel")||c.includes("hospedagem")||c.includes("aéreo")) return "lazer";
    if (c.includes("serviço")||c.includes("servico")||c.includes("assinatura")||c.includes("recorrente")) return "financeiro";
    if (c.includes("compras")||c.includes("shopping")) return "outros";
    return "outros";
  };

  // Upload fatura PDF ou CSV
  const handleFaturaUpload = async (e, cartaoId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const cartao = cartoes.find(c => c.id === cartaoId);
      const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

      // ── CSV ──────────────────────────────────────────────────────────────────
      if (isCSV) {
        setUpStatus("📊 Lendo CSV da fatura...");
        const text = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsText(file, "UTF-8");
        });

        const parsed = parseCSVFatura(text, cartao);

        // Se CSV simples (sem IA), classificar com IA apenas se tiver categorias "outros"
        const needsAI = parsed.transacoes.some(t => t.category === "outros");
        let finalParsed = parsed;

        if (needsAI && parsed.transacoes.length > 0) {
          setUpStatus("🤖 IA classificando categorias...");
          const txSummary = parsed.transacoes.map(t => `${t.date}|${t.description}|${t.amount}`).join("\n");
          try {
            const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 3000,
                messages: [{ role: "user", content:
`Classifique cada transação com uma categoria. Retorne SOMENTE JSON sem markdown.
Formato: [{"idx":0,"category":"categoria"},{"idx":1,"category":"categoria"},...]
Categorias: alimentacao, supermercado, restaurante, padaria, feira, farmacia, saude, transporte, gasolina, educacao, lazer, moradia, vestuario, financeiro, empregada, bela, trabalho, divida, taxas, outros

Transações (formato data|descrição|valor):
${txSummary}

Responda APENAS o array JSON:`
                }]
              })
            });
            if (res.ok) {
              const data = await res.json();
              const aiText = data.content?.[0]?.text || "";
              const match = aiText.match(/\[[\s\S]*\]/);
              if (match) {
                const cats = JSON.parse(match[0]);
                cats.forEach(({ idx, category }) => {
                  if (parsed.transacoes[idx]) parsed.transacoes[idx].category = category;
                });
              }
            }
          } catch(e) { console.warn("AI classification failed:", e); }
        }

        // Atualizar limite se veio no CSV
        if (parsed.limite_total && cartaoId) {
          setCartoes(prev => {
            const next = prev.map(c => c.id===cartaoId ? {
              ...c,
              limite: parsed.limite_total,
              limiteDisponivel: parsed.limite_disponivel,
              limiteUtilizado: parsed.limite_utilizado,
            } : c);
            saveCartoes(next);
            return next;
          });
        }

        // Montar transações e deduplificar
        const newTxs = parsed.transacoes.map(t => ({
          id: "cctx_" + Math.random().toString(36).slice(2),
          cartaoId: cartaoId || cartoes[0]?.id,
          date: t.date,
          description: String(t.description).trim(),
          amount: -Math.abs(parseFloat(t.amount) || 0),
          category: t.category || "outros",
          notes: "",
          spender: "",
        })).filter(t => t.description && t.amount !== 0);

        const deduped = newTxs.filter(n => !txsRef.current.some(t =>
          t.cartaoId===n.cartaoId && t.date===n.date &&
          Math.abs(t.amount)===Math.abs(n.amount) &&
          t.description.toLowerCase()===n.description.toLowerCase()
        ));

        const next = [...deduped, ...txsRef.current];
        setTxs(next);
        persistCartaoTxs(deduped);
        setUpStatus(`✅ ${deduped.length} transações importadas do CSV!`);
        setUploading(false);
        return;
      }

      // ── PDF ──────────────────────────────────────────────────────────────────
      setUpStatus("📄 Lendo fatura PDF...");

      // Load pdf.js
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            resolve();
          };
          s.onerror = () => reject(new Error("Falha ao carregar pdf.js"));
          document.head.appendChild(s);
        });
      }

      // Extract text
      const b64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pdf = await window.pdfjsLib.getDocument({ data:bytes }).promise;
      let fullText = "";
      for (let p=1; p<=pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(i=>i.str).join(" ") + "\n";
      }

      setUpStatus("🤖 IA extraindo transações e limite...");

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-haiku-4-5-20251001",
          max_tokens:4000,
          messages:[{ role:"user", content:
`Fatura de cartão de crédito brasileiro. Retorne SOMENTE objeto JSON sem markdown.

Formato:
{
  "limite_total": numero_ou_null,
  "limite_utilizado": numero_ou_null,
  "limite_disponivel": numero_ou_null,
  "valor_fatura": numero_ou_null,
  "transacoes": [{"date":"YYYY-MM-DD","description":"texto","amount":numero_positivo,"category":"categoria"}]
}

Categorias disponíveis: alimentacao, supermercado, restaurante, feira, farmacia, transporte, saude, educacao, lazer, moradia, vestuario, financeiro, empregada, bela, trabalho, divida, taxas, outros

Regras:
- Todas as transações = amount POSITIVO (são débitos do cartão)
- Ignore pagamentos da fatura, encargos e totais
- Converta datas DD/MM/AAAA para YYYY-MM-DD
- Se não encontrar limite, retorne null

TEXTO DA FATURA:
${fullText.slice(0, 8000)}

Responda APENAS o objeto JSON:`
          }]
        })
      });

      if (!res.ok) { setUpStatus("❌ Erro na API: " + res.status); setUploading(false); return; }

      const data = await res.json();
      const aiText = data.content?.[0]?.text || "";
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { setUpStatus("❌ IA não retornou JSON válido"); setUploading(false); return; }

      const parsed = JSON.parse(jsonMatch[0]);

      // Update limite if found
      if (parsed.limite_total && cartaoId) {
        setCartoes(prev => prev.map(c => c.id===cartaoId ? {
          ...c,
          limite: parsed.limite_total,
          limiteUtilizado: parsed.limite_utilizado ?? null,
          limiteDisponivel: parsed.limite_disponivel,
        } : c));
        persistCartaoLimite(cartaoId, {
          limite: parsed.limite_total,
          limiteUtilizado: parsed.limite_utilizado ?? null,
          limiteDisponivel: parsed.limite_disponivel ?? null,
        });
      }

      // Add transactions
      const newTxs = (parsed.transacoes||[]).map(t => ({
        id: "cctx_"+Math.random().toString(36).slice(2),
        cartaoId: cartaoId || cartoes[0]?.id,
        date: String(t.date||"").replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1") || fmt(TODAY),
        description: String(t.description||"").trim(),
        amount: -Math.abs(parseFloat(t.amount)||0),
        category: t.category || "outros",
        notes: "",
        spender: "",
      })).filter(t => t.description && t.amount !== 0);

      // Dedup
      const deduped = newTxs.filter(n => !txsRef.current.some(t =>
        t.cartaoId===n.cartaoId && t.date===n.date &&
        Math.abs(t.amount)===Math.abs(n.amount) &&
        t.description.toLowerCase()===n.description.toLowerCase()
      ));

      const next = [...deduped, ...txsRef.current];
      setTxs(next);
      await persistCartaoTxs(deduped);
      setUpStatus(`✅ ${deduped.length} transações importadas!${parsed.limite_total ? ` Limite: ${brl(parsed.limite_total)}` : ""}`);
    } catch(e) {
      setUpStatus("❌ " + e.message);
    }
    setUploading(false);
  };

  // Upload comprovante (ticket)
  const handleComprovanteUpload = async (e, cartaoId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUpStatus("🤖 IA lendo comprovante...");
    try {
      const b64 = await new Promise((res,rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";

      let content;
      if (isImage) {
        content = [
          { type:"image", source:{ type:"base64", media_type:file.type, data:b64 } },
          { type:"text", text:`Comprovante de compra no cartão. Extraia: data (YYYY-MM-DD), estabelecimento/descrição, valor total. Retorne JSON: {"date":"YYYY-MM-DD","description":"texto","amount":valor_positivo,"category":"categoria"}. Categorias: alimentacao, supermercado, restaurante, feira, farmacia, transporte, saude, educacao, lazer, moradia, vestuario, financeiro, empregada, bela, trabalho, outros. Responda APENAS o JSON.` }
        ];
      } else {
        // PDF comprovante — extract text first
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdf = await window.pdfjsLib.getDocument({ data:bytes }).promise;
        let text = "";
        for (let p=1; p<=pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const c = await page.getTextContent();
          text += c.items.map(i=>i.str).join(" ") + "\n";
        }
        content = `Comprovante de compra: ${text.slice(0,3000)}\n\nExtraia: data (YYYY-MM-DD), estabelecimento, valor. Retorne JSON: {"date":"YYYY-MM-DD","description":"texto","amount":valor_positivo,"category":"categoria"}. Responda APENAS o JSON.`;
      }

      const res = await fetch("https://besombpjuvqrcxtnstvk.supabase.co/functions/v1/bright-action", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:500, messages:[{ role:"user", content }] })
      });

      if (!res.ok) { setUpStatus("❌ Erro API"); setUploading(false); return; }
      const data = await res.json();
      const aiText = data.content?.[0]?.text || "";
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { setUpStatus("❌ Não foi possível ler o comprovante"); setUploading(false); return; }

      const parsed = JSON.parse(jsonMatch[0]);
      const tx = {
        id: "cctx_"+Math.random().toString(36).slice(2),
        cartaoId: cartaoId || cartoes[0]?.id,
        date: String(parsed.date||"").replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1") || fmt(TODAY),
        description: String(parsed.description||"").trim(),
        amount: -Math.abs(parseFloat(parsed.amount)||0),
        category: parsed.category || "outros",
        notes: "",
        spender: "",
      };
      if (!tx.description || !tx.amount) { setUpStatus("❌ Não encontrou dados no comprovante"); setUploading(false); return; }

      const next = [tx, ...txsRef.current];
      setTxs(next);
      await persistCartaoTxs([tx]);
      setUpStatus(`✅ Lançado: ${tx.description} — ${brl(Math.abs(tx.amount))}`);
    } catch(e) {
      setUpStatus("❌ " + e.message);
    }
    setUploading(false);
  };

  // Filter txs
  const filteredTxs = txs.filter(t => {
    if (selCartao && t.cartaoId !== selCartao) return false;
    if (selMonth && !t.date.startsWith(selMonth)) return false;
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date));

  // Totals per card this month
  const gastoByCartao = (id) => txs.filter(t => t.cartaoId===id && t.date.startsWith(selMonth)).reduce((s,t) => s+Math.abs(t.amount), 0);

  // Grand total this month
  const totalMes = filteredTxs.reduce((s,t) => s+Math.abs(t.amount), 0);

  // By category
  const byCat = filteredTxs.reduce((acc, t) => {
    acc[t.category] = (acc[t.category]||0) + Math.abs(t.amount);
    return acc;
  }, {});

  // By owner
  const byOwner = { rodrigo:0, claudia:0, casal:0 };
  filteredTxs.forEach(t => {
    const c = cartoes.find(x=>x.id===t.cartaoId);
    if (c) byOwner[c.owner] = (byOwner[c.owner]||0) + Math.abs(t.amount);
  });

  const ownerLabel = { rodrigo:"👨 Rodrigo", claudia:"👩 Cláudia", casal:"💑 Casal" };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>

      {showCartaoForm && <CartaoForm initial={editCartao} onSave={saveCC} onClose={()=>{setShowCC(false);setEditCC(null);}}/>}
      {showTxForm && <CartaoTxForm cartoes={cartoes} initial={editTx} onSave={saveTx} onClose={()=>{setShowTx(false);setEditTx(null);}}/>}

      {uploadStatus && (
        <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.text,color:C.card,borderRadius:10,padding:"12px 22px",fontSize:13,fontFamily:"'DM Sans',sans-serif",zIndex:999,boxShadow:"0 4px 20px #0003",whiteSpace:"nowrap",maxWidth:"90vw",textOverflow:"ellipsis",overflow:"hidden"}}>
          {uploadStatus}
        </div>
      )}

      {/* Header com filtros */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <input type="month" style={{...IS,width:150}} value={selMonth} onChange={e=>setSelMonth(e.target.value)}/>
        <select style={{...IS,flex:"1 1 140px"}} value={selCartao||""} onChange={e=>setSelCartao(e.target.value||null)}>
          <option value="">💳 Todos os cartões</option>
          {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <button onClick={()=>{setEditTx(null);setShowTx(true);}} style={{background:C.gold,color:C.bg,border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap"}}>
          + Lançamento
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:C.card,borderRadius:10,padding:4,border:`1px solid ${C.border}`}}>
        {[["resumo","📊 Resumo"],["lancamentos","📋 Lançamentos"],["cartoes","💳 Cartões"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",
            background:tab===id?C.gold:"transparent",
            color:tab===id?C.bg:C.muted,
            fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:tab===id?600:400,
          }}>{label}</button>
        ))}
      </div>

      {/* RESUMO */}
      {tab==="resumo" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Total do mês */}
          <div style={{background:"linear-gradient(135deg,#1e2535 0%,#2d3550 100%)",borderRadius:16,padding:"22px 24px"}}>
            <div style={{fontSize:11,color:"#94a3b8",letterSpacing:3,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",marginBottom:6}}>Total em cartões — {MONTHS[parseInt(selMonth.split("-")[1])-1]}</div>
            <div style={{fontSize:38,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#f0c060",lineHeight:1}}>{brl(totalMes)}</div>
          </div>

          {/* Por pessoa */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
            {Object.entries(byOwner).filter(([,v])=>v>0).map(([owner,val])=>(
              <div key={owner} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>{ownerLabel[owner]}</div>
                <div style={{fontSize:16,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:C.text}}>{brl(val)}</div>
              </div>
            ))}
          </div>

          {/* Por categoria */}
          {Object.keys(byCat).length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Por categoria</div>
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([catId, val])=>{
                const cat = DEFAULT_CATEGORIES.find(c=>c.id===catId)||DEFAULT_CATEGORIES.at(-1);
                const pct = Math.round(val/totalMes*100);
                return (
                  <div key={catId} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,color:C.text,fontFamily:"'DM Sans',sans-serif"}}>{cat.icon} {cat.label}</span>
                      <span style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:C.text}}>{brl(val)} <span style={{color:C.muted,fontSize:11}}>({pct}%)</span></span>
                    </div>
                    <div style={{height:6,background:C.border,borderRadius:6}}>
                      <div style={{height:"100%",width:`${pct}%`,background:cat.color,borderRadius:6,transition:"width .4s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Por cartão */}
          {cartoes.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {cartoes.map(c=>{
                const gasto = gastoByCartao(c.id);
                const pctUsado = c.limite > 0 ? Math.min(gasto/c.limite*100, 100) : 0;
                const limDisp = c.limiteDisponivel ?? (c.limite > 0 ? c.limite - gasto : null);
                return (
                  <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{width:42,height:28,borderRadius:6,background:c.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>{c.bandeira.slice(0,4).toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:14,color:C.text,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{c.nome}</div>
                          <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>{ownerLabel[c.owner]} · Vence dia {c.vencimento||"?"}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:C.red}}>{brl(gasto)}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>gasto este mês</div>
                      </div>
                    </div>
                    {c.limite > 0 && (
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.5px",textTransform:"uppercase"}}>Limite</span>
                          <span style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:pctUsado>80?C.red:pctUsado>60?C.gold:C.green,fontWeight:600}}>{Math.round(pctUsado)}% usado</span>
                        </div>
                        <div style={{height:7,background:C.border,borderRadius:8,marginBottom:8}}>
                          <div style={{height:"100%",width:`${pctUsado}%`,background:pctUsado>80?C.red:pctUsado>60?C.gold:C.green,borderRadius:8,transition:"width .5s"}}/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                          <div style={{background:C.surface,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                            <div style={{fontSize:9,color:C.muted,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>Total</div>
                            <div style={{fontSize:12,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:C.text}}>{brl(c.limite)}</div>
                          </div>
                          <div style={{background:C.surface,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                            <div style={{fontSize:9,color:C.muted,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>Utilizado</div>
                            <div style={{fontSize:12,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:pctUsado>80?C.red:pctUsado>60?C.gold:C.text}}>{brl(c.limiteUtilizado ?? gasto)}</div>
                          </div>
                          <div style={{background:C.surface,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                            <div style={{fontSize:9,color:C.muted,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>Disponível</div>
                            <div style={{fontSize:12,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:C.green}}>{brl(limDisp !== null ? limDisp : c.limite - gasto)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Upload buttons */}
                    <div style={{display:"flex",gap:8,marginTop:14}}>
                      <label style={{flex:1,background:C.border,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"8px",fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"center",display:"block"}}>
                        📄 Fatura PDF/CSV
                        <input type="file" accept=".pdf,.csv,text/csv" style={{display:"none"}} onChange={e=>handleFaturaUpload(e,c.id)} disabled={uploading}/>
                      </label>
                      <label style={{flex:1,background:C.border,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"8px",fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"center",display:"block"}}>
                        🧾 Subir comprovante
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>handleComprovanteUpload(e,c.id)} disabled={uploading}/>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LANÇAMENTOS */}
      {tab==="lancamentos" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filteredTxs.length===0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"40px",textAlign:"center",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
              Nenhum lançamento. Toque em + para adicionar.
            </div>
          )}
          {filteredTxs.map(t=>{
            const cat = DEFAULT_CATEGORIES.find(c=>c.id===t.category)||DEFAULT_CATEGORIES.at(-1);
            const cc = cartoes.find(c=>c.id===t.cartaoId);
            return (
              <div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:22,flexShrink:0}}>{cat.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:C.text,fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.description}</div>
                  <div style={{fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                    {new Date(t.date+"T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}
                    {cc && <> · <span style={{color:cc.cor}}>●</span> {cc.nome}</>}
                    · <span style={{color:cat.color}}>{cat.label}{t.subcategory ? ` › ${t.subcategory}` : ""}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:C.red}}>{brl(Math.abs(t.amount))}</div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{setEditTx(t);setShowTx(true);}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>✏️</button>
                    <button onClick={()=>deleteTx(t.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GESTÃO DE CARTÕES */}
      {tab==="cartoes" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>{setEditCC(null);setShowCC(true);}} style={{background:C.gold,color:C.bg,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
              + Novo cartão
            </button>
          </div>
          {cartoes.length===0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"40px",textAlign:"center",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
              Nenhum cartão cadastrado. Toque em + Novo cartão para começar.
            </div>
          )}
          {cartoes.map(c=>(
            <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:50,height:32,borderRadius:8,background:c.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>{c.bandeira.slice(0,4).toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,color:C.text,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{c.nome}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                  {ownerLabel[c.owner]} · {c.bandeira}
                  {c.limite>0 && ` · Limite: ${brl(c.limite)}`}
                  {c.vencimento && ` · Vence dia ${c.vencimento}`}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditCC(c);setShowCC(true);}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"5px 10px",fontSize:13,cursor:"pointer"}}>✏️</button>
                <button onClick={()=>deleteCC(c.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"5px 10px",fontSize:13,cursor:"pointer"}}>🗑️</button>
              </div>
            </div>
          ))}
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
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const txsRef  = useRef([]);
  const accsRef = useRef(MOCK_ACCOUNTS);

  // Manter refs sempre atualizados via useEffect
  useEffect(() => { txsRef.current  = transactions; }, [transactions]);
  useEffect(() => { accsRef.current = accounts; },     [accounts]);

  // Transações de cartão de crédito e dinheiro — para o relatório consolidado
  const [cartaoTxs, setCartaoTxs] = useState([]);
  const [cashTxsGlobal, setCashTxsGlobal] = useState([]);
  useEffect(() => {
    const loadExtra = async () => {
      const [ccTbl, cashTbl] = await Promise.all([dbFrom("cartao_transactions"), dbFrom("cash_transactions")]);
      if (ccTbl) {
        const res = await ccTbl.select("*", "&order=date.desc");
        if (res?.data) {
          setCartaoTxs(res.data.map(t => ({
            id: t.id, cartaoId: t.cartao_id, date: t.date, description: t.description,
            amount: parseFloat(t.amount), category: t.category || "outros",
            notes: t.notes || "", spender: t.spender || "",
          })));
        }
      }
      if (cashTbl) {
        const res = await cashTbl.select("*", "&order=date.desc");
        if (res?.data) {
          setCashTxsGlobal(res.data.map(t => ({
            id: t.id, date: t.date, description: t.description,
            amount: parseFloat(t.amount), category: t.category || "outros",
            notes: t.notes || "", owner: t.owner || "rodrigo",
          })));
        }
      }
    };
    loadExtra();
  }, []);
  const [editTx, setEditTx]     = useState(null);
  const [showForm, setForm]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [cashBal, setCashBal]   = useState(0);
  const sbConnected = true; // credentials hardcoded

  const refreshCashBal = async () => {
    const tbl = await dbFrom("cash_transactions");
    if (!tbl) return;
    const res = await tbl.select("*", "&order=date.desc");
    if (res?.data) {
      const total = res.data.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      setCashBal(total);
    }
  };

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  // Detectar sessão expirada e forçar novo login
  useEffect(() => {
    const interval = setInterval(() => {
      if (window._sbSessionExpired) {
        window._sbSessionExpired = false;
        // Tentar refresh automático
        sbRefreshToken().then(ok => {
          if (!ok) {
            // Limpar tudo e forçar login
            localStorage.removeItem("sb_token");
            localStorage.removeItem("sb_refresh_token");
            setUser(null);
            showToast("Sessão expirada. Faça login novamente.", "warn");
          } else {
            // Refresh ok — recarregar dados
            const loadData = async () => {
              const [txRes, accRes, cashRes] = await Promise.all([
                dbFrom("transactions").then(t => t?.select("*", "&order=date.desc")),
                dbFrom("accounts").then(t => t?.select("*", "&order=created_at.asc")),
                dbFrom("cash_transactions").then(t => t?.select("*")),
              ]);
              if (txRes?.data?.length) {
                setTxs(txRes.data.map(t => ({
                  id: t.id, accountId: t.account_id || t.accountId,
                  date: t.date, description: t.description,
                  amount: parseFloat(t.amount), category: t.category || "outros",
                  notes: t.notes || "", internalTransfer: t.internal_transfer || false, spender: t.spender || "", subcategory: t.subcategory || "",
                })));
              }
              if (accRes?.data?.length) {
                setAccounts(accRes.data.map(a => ({ ...a, balance: parseFloat(a.balance) || 0 })));
              }
              if (cashRes?.data) {
                setCashBal(cashRes.data.reduce((s, t) => s + parseFloat(t.amount || 0), 0));
              }
            };
            loadData();
          }
        });
      }
    }, 5000); // checar a cada 5s
    return () => clearInterval(interval);
  }, []);

  // Check OAuth callback on mount
  useEffect(() => {
    const token = checkOAuthCallback();
    if (token) {
      const u = JSON.parse(localStorage.getItem("sb_user") || "{}");
      setUser(u);
    }
  }, []);

  // Load data from Supabase on mount and when user changes
  useEffect(() => {
    const token = localStorage.getItem("sb_token");
    const savedUser = localStorage.getItem("sb_user");

    if (!user && token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
      return;
    }

    if (!user && !token) {
      setTxs(MOCK_TXS);
      return;
    }

    // Migration: garantir coluna spender na tabela transactions
    const runMigrations = async () => {
      try {
        const { url, key } = getSBCreds();
        const token = localStorage.getItem("sb_token") || key;
        // Tenta inserir com spender — se der erro 400 a coluna não existe, então cria via RPC
        // Como não temos acesso direto ao DDL via REST, usamos upsert com campo extra
        // O Supabase ignora campos inexistentes no insert por padrão (JSONB columns)
        // Solução: tentar select com spender e ignorar erro
        await fetch(`${url}/rest/v1/transactions?select=spender&limit=1`, {
          headers: { "apikey": key, "Authorization": `Bearer ${token}` }
        });
      } catch(e) {}
    };
    runMigrations();

    const loadData = async () => {
      setLoading(true);
      const refreshTok = localStorage.getItem("sb_refresh_token");
      if (refreshTok) await sbRefreshToken();

      Promise.all([
        dbFrom("transactions").then(t => t?.select("*", "&order=date.desc")),
        dbFrom("accounts").then(t => t?.select("*", "&order=created_at.asc")),
        dbFrom("cash_transactions").then(t => t?.select("*")),
      ]).then(([txRes, accRes, cashRes]) => {
        if (txRes?.data) {
          const txs = txRes.data.map(t => ({
            id: t.id,
            accountId: t.account_id || t.accountId,
            date: t.date,
            description: t.description,
            amount: parseFloat(t.amount),
            category: t.category || "outros",
            notes: t.notes || "",
            internalTransfer: t.internal_transfer || t.internalTransfer || false, subcategory: t.subcategory || "",
                  spender: t.spender || "",
          }));
          setTxs(txs);
        }
        if (accRes?.data?.length) {
          const accs = accRes.data.map(a => ({ ...a, balance: parseFloat(a.balance) || 0 }));
          setAccounts(accs);
        }
        if (cashRes?.data) {
          const total = cashRes.data.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
          setCashBal(total);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Load error:", err);
        setLoading(false);
      });
    };

    loadData();
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

  // Recarrega contas do Supabase e atualiza estado
  const reloadAccounts = async () => {
    const tbl = await dbFrom("accounts");
    if (!tbl) return;
    const res = await tbl.select("*", "&order=created_at.asc");
    if (res?.data?.length) {
      const accs = res.data.map(a => ({ ...a, balance: parseFloat(a.balance) || 0 }));
      setAccounts(accs);
    }
  };

  // Atualiza balance da conta no Supabase via delta e recarrega
  const updateAccountBalance = async (accountId, delta) => {
    if (!accountId || delta === 0) return;
    // Pega saldo atual da ref (sempre atualizado)
    const acc = accsRef.current.find(a => a.id === accountId);
    if (!acc) {
      console.warn("[updateAccountBalance] conta não encontrada:", accountId, "contas disponíveis:", accsRef.current.map(a => a.id));
      return;
    }
    const newBal = parseFloat(acc.balance || 0) + delta;
    // Atualiza localmente primeiro (UI responsiva)
    setAccounts(accs => accs.map(a => a.id === accountId ? { ...a, balance: newBal } : a));
    // Persiste no Supabase
    const tbl = await dbFrom("accounts");
    if (tbl) {
      const res = await tbl.update({ balance: newBal }, { id: accountId });
      if (res?.error) {
        console.error("[updateAccountBalance] erro ao salvar:", res.error);
        // Recarrega do Supabase para garantir consistência
        await reloadAccounts();
      }
    }
  };

  const saveTx = async (tx) => {
    const existingTx = txsRef.current.find(t => t.id === tx.id);

    // 1. Fechar modal e atualizar UI imediatamente (não travar esperando Supabase)
    setForm(false); setEditTx(null);

    // 2. Atualizar lista local de transações
    setTxs(ts => ts.findIndex(t => t.id === tx.id) >= 0
      ? ts.map(t => t.id === tx.id ? tx : t)
      : [tx, ...ts]);

    // 3. Atualizar saldo da conta localmente
    if (tx.accountId && !tx.internalTransfer) {
      const oldAmt = existingTx ? parseFloat(existingTx.amount) : 0;
      const delta  = parseFloat(tx.amount) - oldAmt;
      if (delta !== 0) {
        setAccounts(accs => accs.map(a => {
          if (a.id !== tx.accountId) return a;
          return { ...a, balance: parseFloat(a.balance || 0) + delta };
        }));
      }
    }

    showToast("Lançamento salvo!");

    // 4. Persistir no Supabase em background (sem await — não bloqueia UI)
    dbFrom("transactions").then(async tbl => {
      if (!tbl) {
        showToast("⚠️ Sessão expirada — reabra o app para sincronizar");
        return;
      }
      if (existingTx) {
        await tbl.update({
          account_id: tx.accountId,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          notes: tx.notes || "",
          internal_transfer: tx.internalTransfer || false,
          spender: tx.spender || "",
          subcategory: tx.subcategory || "",
        }, { id: tx.id });
      } else {
        await tbl.insert({
          id: tx.id,
          account_id: tx.accountId,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          notes: tx.notes || "",
          internal_transfer: tx.internalTransfer || false,
          spender: tx.spender || "",
          subcategory: tx.subcategory || "",
        });
      }
      // Persistir saldo da conta no Supabase
      if (tx.accountId && !tx.internalTransfer) {
        const oldAmt = existingTx ? parseFloat(existingTx.amount) : 0;
        const delta  = parseFloat(tx.amount) - oldAmt;
        if (delta !== 0) {
          const acc = accsRef.current.find(a => a.id === tx.accountId);
          if (acc) {
            const tblAcc = await dbFrom("accounts");
            if (tblAcc) await tblAcc.update({ balance: acc.balance }, { id: acc.id });
          }
        }
      }
    }).catch(err => {
      console.error("[saveTx] erro ao persistir:", err);
      showToast("⚠️ Erro ao salvar no banco: " + (err.message || err));
    });
  };

  const deleteTx = async (id) => {
    if (!window.confirm("Excluir este lançamento?")) return;
    const tx = txsRef.current.find(t => t.id === id);

    // 1. Remover da UI imediatamente
    setTxs(ts => ts.filter(t => t.id !== id));

    // 2. Reverter saldo da conta localmente
    if (tx?.accountId && tx?.amount && !tx?.internalTransfer) {
      const delta = -parseFloat(tx.amount);
      setAccounts(accs => accs.map(a => {
        if (a.id !== tx.accountId) return a;
        return { ...a, balance: parseFloat(a.balance || 0) + delta };
      }));
    }

    showToast("Removido", "warn");

    // 3. Deletar do Supabase em background
    dbFrom("transactions").then(async tbl => {
      if (!tbl) return;
      await tbl.del({ id });
      // Persistir saldo revertido no Supabase
      if (tx?.accountId && tx?.amount && !tx?.internalTransfer) {
        const acc = accsRef.current.find(a => a.id === tx.accountId);
        if (acc) {
          const tblAcc = await dbFrom("accounts");
          if (tblAcc) await tblAcc.update({ balance: acc.balance }, { id: acc.id });
        }
      }
    }).catch(err => console.error("[deleteTx] erro:", err));
  };

  const importTxs = async (rows, accountId, saldoFinal) => {
    // Buscar transações atuais direto do Supabase para garantir dedup correto
    let currentTxs = txsRef.current;
    try {
      const tblCheck = await dbFrom("transactions");
      if (tblCheck) {
        const fresh = await tblCheck.select("*", "&order=date.desc");
        if (fresh?.data?.length) {
          currentTxs = fresh.data.map(t => ({
            id: t.id,
            accountId: t.account_id || t.accountId,
            date: t.date,
            description: t.description,
            amount: parseFloat(t.amount),
            category: t.category || "outros",
            notes: t.notes || "",
            internalTransfer: t.internal_transfer || false, subcategory: t.subcategory || "",
          }));
          // Atualizar estado local também
          setTxs(currentTxs);
        }
      }
    } catch(e) { console.warn("importTxs: usando txs locais", e); }

    const deduped = rows.filter(r => {
      const rAmt = Math.abs(parseFloat(r.amount));
      const rDate = r.date;
      const rDesc = r.description.toLowerCase().trim();

      return !currentTxs.some(t => {
        const tAmt = Math.abs(parseFloat(t.amount));
        const tDate = t.date;
        const tDesc = t.description.toLowerCase().trim();
        const sameAccount = t.accountId === r.accountId;

        // Exact match: mesma conta, data, valor e descrição
        if (sameAccount && tDate === rDate && tAmt === rAmt && tDesc === rDesc) return true;

        // Match por valor+data+conta (lançamento manual com descrição diferente)
        if (sameAccount && tDate === rDate && tAmt === rAmt) return true;

        return false;
      });
    });

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
          spender: tx.spender || "",
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
    { id:"cartoes",     label:"Cartões",      icon:"💳" },
    { id:"dividas",     label:"Dívidas",      icon:"📉" },
    { id:"metas",       label:"Metas",        icon:"🎯" },
    { id:"importar",    label:"Importar",     icon:"↑"  },
    { id:"comprovantes",label:"Comprovantes", icon:"📷" },
    { id:"contas",      label:"Contas",       icon:"⬡"  },
    { id:"analise",     label:"Análise IA",   icon:"🤖" },
    { id:"consulta",     label:"Consulta IA",  icon:"🎙️" },
  ];

  const pageTitle = {
    dashboard:"Visão Geral", extrato:"Movimentações", relatorios:"Relatórios",
    carteira:"Carteira", cartoes:"Cartões de Crédito", dividas:"Dívidas & Financiamentos",
    metas:"Metas", importar:"Importar Extrato", comprovantes:"Comprovantes", contas:"Contas",
    analise:"Análise IA & Investimentos",
    consulta:"Consulta por IA"
  };

  const bottomNav = [
    { id:"dashboard",  label:"Início",    icon:"◈" },
    { id:"extrato",    label:"Extrato",   icon:"≡" },
    { id:"cartoes",    label:"Cartões",   icon:"💳" },
    { id:"carteira",   label:"Carteira",  icon:"👜" },
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

      {/* FAB global — novo lançamento em qualquer tela */}
      {!showForm && !editTx && nav !== "importar" && nav !== "comprovantes" && (
        <button onClick={()=>{setEditTx(null);setForm(true);}} style={{
          position:"fixed", bottom:80, right:20,
          width:52, height:52, borderRadius:"50%",
          background:C.gold, color:C.bg, border:"none",
          fontSize:24, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:90, fontWeight:300,
        }} title="Novo lançamento">+</button>
      )}
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
              {nav==="dashboard"    && <Dashboard    transactions={transactions} accounts={accounts} onNavigate={setNav} cashBal={cashBal} />}
              {nav==="extrato"      && <Extrato      transactions={transactions} accounts={accounts} onEdit={t=>{setEditTx(t);}} onDelete={deleteTx} onAdd={()=>setForm(true)} />}
              {nav==="relatorios"   && <Relatorios   transactions={transactions} accounts={accounts} cashBal={cashBal} cartaoTxs={cartaoTxs} cashTxs={cashTxsGlobal} />}
              {nav==="analise"      && <AnaliseIA    transactions={transactions} accounts={accounts} cashBal={cashBal} cartaoTxs={cartaoTxs} cashTxs={cashTxsGlobal} />}
              {nav==="consulta"     && <ConsultaIA   transactions={transactions} accounts={accounts} cashBal={cashBal} cartaoTxs={cartaoTxs} cashTxs={cashTxsGlobal} />}
              {nav==="carteira"     && <Carteira     accounts={accounts} onCashChange={refreshCashBal} transactions={transactions} />}
              {nav==="cartoes"      && <Cartoes />}
              {nav==="dividas"      && <Dividas transactions={transactions} cashTxs={cashTxsGlobal} cartaoTxs={cartaoTxs} />}
              {nav==="metas"        && <Metas        transactions={transactions} />}
              {nav==="importar"     && <ImportarExtrato accounts={accounts} onImport={importTxs} getTxs={() => txsRef.current} />}
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
