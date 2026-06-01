import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:       "#0d0f14",
  surface:  "#13161e",
  card:     "#1a1e2a",
  border:   "#252836",
  gold:     "#c9a84c",
  goldLight:"#e8c97a",
  goldDim:  "#7a6330",
  green:    "#4caf82",
  red:      "#e05c5c",
  blue:     "#4c8ec9",
  text:     "#e8e6df",
  muted:    "#6b6f7d",
  soft:     "#9a98a0",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
`;

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "alimentacao",   label: "Alimentação",    icon: "🍽️",  color: "#e08c4c" },
  { id: "transporte",    label: "Transporte",     icon: "🚗",  color: "#4c8ec9" },
  { id: "saude",         label: "Saúde",          icon: "🏥",  color: "#4caf82" },
  { id: "educacao",      label: "Educação",       icon: "📚",  color: "#9b59b6" },
  { id: "lazer",         label: "Lazer",          icon: "🎭",  color: "#e05c9b" },
  { id: "moradia",       label: "Moradia",        icon: "🏠",  color: "#c9a84c" },
  { id: "vestuario",     label: "Vestuário",      icon: "👔",  color: "#5cc9e0" },
  { id: "financeiro",    label: "Financeiro",     icon: "💳",  color: "#e05c5c" },
  { id: "transferencia", label: "Transferência",  icon: "🔄",  color: "#6b6f7d" },
  { id: "receita",       label: "Receita",        icon: "💰",  color: "#4caf82" },
  { id: "outros",        label: "Outros",         icon: "📦",  color: "#9a98a0" },
];

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS = [
  { id: "a1", name: "Nubank - Rodrigo",   type: "corrente", owner: "rodrigo", balance: 8420.50,  color: "#9b59b6" },
  { id: "a2", name: "Itaú - Rodrigo",     type: "corrente", owner: "rodrigo", balance: 15230.00, color: "#c9a84c" },
  { id: "a3", name: "Nubank - Esposa",    type: "corrente", owner: "esposa",  balance: 5870.30,  color: "#e05c9b" },
  { id: "a4", name: "C6 Casal",           type: "corrente", owner: "casal",   balance: 3200.00,  color: "#4caf82" },
  { id: "a5", name: "XP Investimentos",   type: "investimento", owner: "rodrigo", balance: 42000.00, color: "#4c8ec9" },
];

const TODAY = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return fmt(d); };

const MOCK_TRANSACTIONS = [
  { id: "t1",  accountId: "a1", date: daysAgo(0),  description: "Padaria São José",         amount: -28.50,   category: "alimentacao",  notes: "" },
  { id: "t2",  accountId: "a2", date: daysAgo(1),  description: "Posto Ipiranga",            amount: -180.00,  category: "transporte",   notes: "" },
  { id: "t3",  accountId: "a1", date: daysAgo(1),  description: "iFood",                    amount: -67.30,   category: "alimentacao",  notes: "" },
  { id: "t4",  accountId: "a3", date: daysAgo(2),  description: "Farmácia Drogasil",         amount: -95.00,   category: "saude",        notes: "" },
  { id: "t5",  accountId: "a2", date: daysAgo(2),  description: "Salário",                   amount: 18500.00, category: "receita",      notes: "" },
  { id: "t6",  accountId: "a3", date: daysAgo(3),  description: "Salário Esposa",            amount: 9800.00,  category: "receita",      notes: "" },
  { id: "t7",  accountId: "a1", date: daysAgo(3),  description: "TRF → C6 Casal",           amount: -2000.00, category: "transferencia", internalTransfer: true, linkedTx: "t8" },
  { id: "t8",  accountId: "a4", date: daysAgo(3),  description: "TRF ← Rodrigo",            amount: 2000.00,  category: "transferencia", internalTransfer: true, linkedTx: "t7" },
  { id: "t9",  accountId: "a4", date: daysAgo(4),  description: "Supermercado Pão de Açúcar",amount: -423.80,  category: "alimentacao",  notes: "" },
  { id: "t10", accountId: "a2", date: daysAgo(5),  description: "Plano de Saúde Amil",      amount: -890.00,  category: "saude",        notes: "" },
  { id: "t11", accountId: "a2", date: daysAgo(6),  description: "Colégio Dom Bosco",         amount: -1200.00, category: "educacao",     notes: "" },
  { id: "t12", accountId: "a1", date: daysAgo(7),  description: "Shopee",                   amount: -145.00,  category: "vestuario",    notes: "" },
  { id: "t13", accountId: "a3", date: daysAgo(8),  description: "Netflix",                  amount: -55.90,   category: "lazer",        notes: "" },
  { id: "t14", accountId: "a2", date: daysAgo(9),  description: "Conta de Luz CEMIG",       amount: -320.00,  category: "moradia",      notes: "" },
  { id: "t15", accountId: "a2", date: daysAgo(10), description: "Internet Vivo Fibra",      amount: -149.90,  category: "moradia",      notes: "" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt_brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmt_date = (s) => new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const cat_of = (id) => DEFAULT_CATEGORIES.find(c => c.id === id) || DEFAULT_CATEGORIES.at(-1);

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const Badge = ({ children, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap"
  }}>{children}</span>
);

const Chip = ({ icon, label, color }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
    background: color + "18", color, borderRadius: 20, padding: "3px 10px",
    fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
    <span>{icon}</span>{label}
  </span>
);

const Divider = () => <div style={{ height: 1, background: C.border, margin: "0" }} />;

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
    padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6,
    position: "relative", overflow: "hidden"
  }}>
    <div style={{ position: "absolute", top: 16, right: 20, fontSize: 22, opacity: .18 }}>{icon}</div>
    <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: color || C.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.soft, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
  </div>
);

// ─── SUPABASE CONFIG MODAL ────────────────────────────────────────────────────
const SupabaseConfig = ({ onSave }) => {
  const [url, setUrl] = useState(localStorage.getItem("sb_url") || "");
  const [key, setKey] = useState(localStorage.getItem("sb_key") || "");
  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box"
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, width: 440, maxWidth: "90vw" }}>
        <div style={{ fontSize: 11, color: C.goldDim, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Configuração</div>
        <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond', serif", color: C.text, marginBottom: 8 }}>Conectar ao Supabase</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 28 }}>Cole as credenciais do seu projeto para ativar o banco de dados. Por enquanto o app roda com dados de demonstração.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>PROJECT URL</div>
            <input style={inputStyle} placeholder="https://xxxx.supabase.co" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>ANON KEY</div>
            <input style={inputStyle} placeholder="eyJ..." value={key} onChange={e => setKey(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => onSave(url, key)} style={{
            flex: 1, background: C.gold, color: C.bg, border: "none", borderRadius: 8,
            padding: "12px 0", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
          }}>Salvar e conectar</button>
          <button onClick={() => onSave("", "")} style={{
            flex: 1, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "12px 0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
          }}>Usar demo</button>
        </div>
      </div>
    </div>
  );
};

// ─── TRANSACTION FORM ─────────────────────────────────────────────────────────
const TxForm = ({ accounts, onSave, onClose, initial }) => {
  const [form, setForm] = useState(initial || {
    accountId: accounts[0]?.id || "", date: fmt(TODAY),
    description: "", amount: "", category: "outros", notes: "", type: "despesa"
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box"
  };
  const handleSave = () => {
    if (!form.description || !form.amount) return;
    const amt = parseFloat(form.amount.replace(",", "."));
    onSave({ ...form, id: initial?.id || "tx_" + Date.now(), amount: form.type === "despesa" ? -Math.abs(amt) : Math.abs(amt) });
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, width: 480, maxWidth: "95vw" }}>
        <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: C.text, marginBottom: 24 }}>
          {initial ? "Editar lançamento" : "Novo lançamento"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Tipo */}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
            {["despesa","receita","transferencia"].map(t => (
              <button key={t} onClick={() => set("type", t)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                background: form.type === t ? (t === "receita" ? C.green : t === "transferencia" ? C.blue : C.red) + "22" : "transparent",
                border: `1px solid ${form.type === t ? (t === "receita" ? C.green : t === "transferencia" ? C.blue : C.red) : C.border}`,
                color: form.type === t ? (t === "receita" ? C.green : t === "transferencia" ? C.blue : C.red) : C.muted
              }}>
                {t === "despesa" ? "💸 Despesa" : t === "receita" ? "💰 Receita" : "🔄 Transferência"}
              </button>
            ))}
          </div>
          {/* Conta */}
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>CONTA</div>
            <select style={inputStyle} value={form.accountId} onChange={e => set("accountId", e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {/* Data */}
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>DATA</div>
            <input type="date" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          {/* Descrição */}
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>DESCRIÇÃO</div>
            <input style={inputStyle} placeholder="Ex: Supermercado" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          {/* Valor */}
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>VALOR (R$)</div>
            <input style={inputStyle} placeholder="0,00" value={form.amount} onChange={e => set("amount", e.target.value)} />
          </div>
          {/* Categoria */}
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>CATEGORIA</div>
            <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
              {DEFAULT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          {/* Notas */}
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>NOTAS (opcional)</div>
            <input style={inputStyle} placeholder="Observações..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} style={{
            flex: 1, background: C.gold, color: C.bg, border: "none", borderRadius: 8,
            padding: "12px 0", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
          }}>Salvar</button>
          <button onClick={onClose} style={{
            background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "12px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── AI CLASSIFIER ────────────────────────────────────────────────────────────
const classifyWithAI = async (description) => {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `Classifique esta transação financeira brasileira em UMA das categorias abaixo. Responda APENAS com o id da categoria, sem mais nada.

Transação: "${description}"

Categorias disponíveis:
- alimentacao (padaria, restaurante, mercado, ifood, uber eats, açougue)
- transporte (posto, gasolina, uber, combustível, pedágio, estacionamento)
- saude (farmácia, hospital, plano de saúde, médico, dentista, exame)
- educacao (escola, faculdade, curso, livro, material escolar)
- lazer (streaming, cinema, viagem, hotel, esporte, netflix, spotify)
- moradia (aluguel, condomínio, luz, água, internet, gás, reforma)
- vestuario (roupa, sapato, loja, shopping)
- financeiro (cartão de crédito, empréstimo, financiamento, seguro)
- transferencia (TED, PIX, transferência)
- receita (salário, freelance, aluguel recebido, dividendo)
- outros (qualquer outra coisa)

Responda apenas o id:`
        }]
      })
    });
    const data = await res.json();
    const cat = data.content?.[0]?.text?.trim().toLowerCase();
    return DEFAULT_CATEGORIES.find(c => c.id === cat)?.id || "outros";
  } catch { return "outros"; }
};

// ─── VIEWS ────────────────────────────────────────────────────────────────────

// DASHBOARD
const Dashboard = ({ transactions, accounts }) => {
  const thisMonth = transactions.filter(t => t.date.startsWith(fmt(TODAY).slice(0, 7)));
  const receitas  = thisMonth.filter(t => t.amount > 0 && !t.internalTransfer).reduce((s, t) => s + t.amount, 0);
  const despesas  = thisMonth.filter(t => t.amount < 0 && !t.internalTransfer).reduce((s, t) => s + t.amount, 0);
  const saldoTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const saldoInvest = accounts.filter(a => a.type === "investimento").reduce((s, a) => s + a.balance, 0);

  // Gastos por categoria
  const byCat = {};
  thisMonth.filter(t => t.amount < 0 && !t.internalTransfer).forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount);
  });
  const catRanking = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCat = catRanking[0]?.[1] || 1;

  // Últimos lançamentos
  const recent = [...transactions].filter(t => !t.internalTransfer).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <StatCard label="Patrimônio total" value={fmt_brl(saldoTotal)} sub="todas as contas" icon="🏦" color={C.goldLight} />
        <StatCard label="Receitas do mês"  value={fmt_brl(receitas)}  sub={new Date().toLocaleString("pt-BR",{month:"long"})} icon="📈" color={C.green} />
        <StatCard label="Despesas do mês"  value={fmt_brl(Math.abs(despesas))} sub="sem transf. internas" icon="📉" color={C.red} />
        <StatCard label="Investimentos"    value={fmt_brl(saldoInvest)} sub="XP e corretoras" icon="💼" color={C.blue} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Gastos por categoria */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 18 }}>Gastos por categoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {catRanking.map(([catId, val]) => {
              const cat = cat_of(catId);
              return (
                <div key={catId}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.soft, fontFamily: "'DM Sans', sans-serif" }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize: 12, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{fmt_brl(val)}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(val / maxCat) * 100}%`, background: cat.color, borderRadius: 4, transition: "width .6s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contas */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 18 }}>Contas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {accounts.map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color }} />
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
                      {a.type} · {a.owner === "casal" ? "💑 Casal" : a.owner === "rodrigo" ? "👨 Rodrigo" : "👩 Esposa"}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", color: a.balance >= 0 ? C.text : C.red, fontWeight: 600 }}>
                  {fmt_brl(a.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas movimentações */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: 18 }}>Últimas movimentações</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {recent.map((t, i) => {
            const cat = cat_of(t.category);
            const acc = accounts.find(a => a.id === t.accountId);
            return (
              <div key={t.id}>
                {i > 0 && <Divider />}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0" }}>
                  <div style={{ fontSize: 20, width: 36, textAlign: "center" }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{fmt_date(t.date)} · {acc?.name}</div>
                  </div>
                  <Chip icon={cat.icon} label={cat.label} color={cat.color} />
                  <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: t.amount > 0 ? C.green : C.text, minWidth: 100, textAlign: "right" }}>
                    {t.amount > 0 ? "+" : ""}{fmt_brl(t.amount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// EXTRATO (Transactions)
const Extrato = ({ transactions, accounts, onEdit, onDelete, onAdd }) => {
  const [filter, setFilter] = useState({ search: "", category: "", account: "", month: fmt(TODAY).slice(0, 7) });
  const set = (k, v) => setFilter(f => ({ ...f, [k]: v }));

  const filtered = transactions.filter(t => {
    if (filter.month && !t.date.startsWith(filter.month)) return false;
    if (filter.category && t.category !== filter.category) return false;
    if (filter.account && t.accountId !== filter.account) return false;
    if (filter.search && !t.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "8px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filtros */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...inputStyle, flex: "1 1 160px" }} placeholder="🔍 Buscar..." value={filter.search} onChange={e => set("search", e.target.value)} />
        <input type="month" style={inputStyle} value={filter.month} onChange={e => set("month", e.target.value)} />
        <select style={inputStyle} value={filter.category} onChange={e => set("category", e.target.value)}>
          <option value="">Todas categorias</option>
          {DEFAULT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={inputStyle} value={filter.account} onChange={e => set("account", e.target.value)}>
          <option value="">Todas contas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={onAdd} style={{
          marginLeft: "auto", background: C.gold, color: C.bg, border: "none", borderRadius: 8,
          padding: "9px 18px", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
        }}>+ Lançamento</button>
      </div>

      {/* Tabela */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 130px 120px 100px 80px", gap: 0 }}>
          {/* Header */}
          {["Data","Descrição","Conta","Categoria","Valor",""].map((h, i) => (
            <div key={i} style={{ padding: "12px 16px", fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              {h}
            </div>
          ))}
          {/* Rows */}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: "40px 20px", textAlign: "center", color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              Nenhuma movimentação encontrada
            </div>
          )}
          {filtered.map((t, i) => {
            const cat = cat_of(t.category);
            const acc = accounts.find(a => a.id === t.accountId);
            return (
              <>
                {i > 0 && <div key={`d${t.id}`} style={{ gridColumn: "1/-1", height: 1, background: C.border }} />}
                <div key={`dt${t.id}`} style={{ padding: "12px 16px", fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center" }}>{fmt_date(t.date)}</div>
                <div key={`ds${t.id}`} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  {t.internalTransfer && <span title="Transferência interna" style={{ fontSize: 10, background: C.blue + "22", color: C.blue, border: `1px solid ${C.blue}44`, borderRadius: 4, padding: "1px 5px" }}>INT</span>}
                  <span style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{t.description}</span>
                </div>
                <div key={`da${t.id}`} style={{ padding: "12px 16px", fontSize: 12, color: C.soft, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center" }}>{acc?.name || "—"}</div>
                <div key={`dc${t.id}`} style={{ padding: "12px 16px", display: "flex", alignItems: "center" }}>
                  <Chip icon={cat.icon} label={cat.label} color={cat.color} />
                </div>
                <div key={`dv${t.id}`} style={{ padding: "12px 16px", display: "flex", alignItems: "center", fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: t.amount > 0 ? C.green : C.text }}>
                  {t.amount > 0 ? "+" : ""}{fmt_brl(t.amount)}
                </div>
                <div key={`do${t.id}`} style={{ padding: "12px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => onEdit(t)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "4px 6px", borderRadius: 6 }} title="Editar">✏️</button>
                  <button onClick={() => onDelete(t.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "4px 6px", borderRadius: 6 }} title="Excluir">🗑️</button>
                </div>
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// UPLOAD EXTRATO (IA)
const UploadExtrato = ({ accounts, onImport }) => {
  const [step, setStep] = useState("idle"); // idle | parsing | review | done
  const [rows, setRows] = useState([]);
  const [classifying, setClassifying] = useState(false);
  const [selAccount, setSelAccount] = useState(accounts[0]?.id || "");

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const parsed = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(/[;,]/).map(c => c.replace(/"/g, "").trim());
      if (cols.length < 3) continue;
      const date = cols[0]; const desc = cols[1]; const raw = cols[2];
      const amount = parseFloat(raw.replace(/\./g, "").replace(",", "."));
      if (isNaN(amount)) continue;
      parsed.push({ id: "imp_" + Math.random().toString(36).slice(2), date, description: desc, amount, accountId: selAccount, category: "outros", keep: true });
    }
    return parsed;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep("parsing");
    const text = await file.text();
    let parsed = [];
    if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) parsed = parseCSV(text);
    else { alert("Por enquanto suportamos CSV. OFX e PDF em breve!"); setStep("idle"); return; }
    if (!parsed.length) { alert("Não foi possível interpretar o arquivo. Verifique o formato."); setStep("idle"); return; }
    setRows(parsed);
    setStep("review");
    // Classify with AI
    setClassifying(true);
    const updated = await Promise.all(parsed.map(async r => ({ ...r, category: await classifyWithAI(r.description) })));
    setRows(updated);
    setClassifying(false);
  };

  const toggle = (id) => setRows(rs => rs.map(r => r.id === id ? { ...r, keep: !r.keep } : r));
  const setcat = (id, cat) => setRows(rs => rs.map(r => r.id === id ? { ...r, category: cat } : r));

  const confirmImport = () => {
    const toImport = rows.filter(r => r.keep);
    onImport(toImport);
    setStep("done");
  };

  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "8px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: C.text, marginBottom: 6 }}>Importar Extrato</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>
          Faça upload do extrato bancário. A IA classifica automaticamente cada movimentação.
          <br /><span style={{ color: C.goldDim }}>Formatos suportados: CSV (em breve: OFX, PDF, Excel)</span>
        </div>

        {step === "idle" && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>CONTA DESTINO</div>
              <select style={inputStyle} value={selAccount} onChange={e => setSelAccount(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: C.gold, color: C.bg,
              border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
            }}>
              📁 Selecionar arquivo
              <input type="file" accept=".csv,.txt,.ofx" style={{ display: "none" }} onChange={handleFile} />
            </label>
          </div>
        )}

        {step === "parsing" && (
          <div style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>⏳ Processando arquivo...</div>
        )}

        {step === "done" && (
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ color: C.green, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>✅ Importação concluída!</div>
            <button onClick={() => setStep("idle")} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Nova importação</button>
          </div>
        )}
      </div>

      {step === "review" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 15, color: C.text, fontFamily: "'Cormorant Garamond', serif" }}>{rows.length} movimentações encontradas</span>
              {classifying && <span style={{ fontSize: 12, color: C.gold, fontFamily: "'DM Sans', sans-serif", marginLeft: 12 }}>🤖 IA classificando...</span>}
            </div>
            <button onClick={confirmImport} disabled={classifying} style={{
              background: classifying ? C.border : C.gold, color: C.bg, border: "none", borderRadius: 8,
              padding: "9px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: classifying ? "not-allowed" : "pointer"
            }}>Confirmar importação ({rows.filter(r => r.keep).length})</button>
          </div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {rows.map((r, i) => {
              const cat = cat_of(r.category);
              return (
                <div key={r.id}>
                  {i > 0 && <Divider />}
                  <div style={{ display: "grid", gridTemplateColumns: "40px 80px 1fr 160px 100px", gap: 0, alignItems: "center", padding: "10px 16px", opacity: r.keep ? 1 : .35 }}>
                    <input type="checkbox" checked={r.keep} onChange={() => toggle(r.id)} style={{ accentColor: C.gold, width: 16, height: 16 }} />
                    <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{fmt_date(r.date)}</div>
                    <div style={{ fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{r.description}</div>
                    <select value={r.category} onChange={e => setcat(r.id, e.target.value)} style={{ ...inputStyle, fontSize: 11, padding: "4px 8px" }}>
                      {DEFAULT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                    <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: r.amount > 0 ? C.green : C.text, textAlign: "right" }}>
                      {r.amount > 0 ? "+" : ""}{fmt_brl(r.amount)}
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

// CONTAS
const Contas = ({ accounts, onAdd, onEdit }) => {
  const ownerLabel = { rodrigo: "👨 Rodrigo", esposa: "👩 Esposa", casal: "💑 Casal" };
  const typeLabel  = { corrente: "Conta Corrente", poupanca: "Poupança", cartao: "Cartão de Crédito", investimento: "Investimento" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onAdd} style={{
          background: C.gold, color: C.bg, border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer"
        }}>+ Nova conta</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {accounts.map(a => (
          <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: a.color, borderRadius: "16px 0 0 16px" }} />
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, color: C.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{typeLabel[a.type] || a.type}</div>
                </div>
                <Badge color={a.color}>{ownerLabel[a.owner] || a.owner}</Badge>
              </div>
              <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: a.balance >= 0 ? C.text : C.red }}>
                {fmt_brl(a.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [showConfig, setShowConfig]     = useState(false);
  const [nav, setNav]                   = useState("dashboard");
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [accounts]                      = useState(MOCK_ACCOUNTS);
  const [editTx, setEditTx]             = useState(null);
  const [showForm, setShowForm]         = useState(false);

  const handleSaveTx = (tx) => {
    setTransactions(ts => {
      const idx = ts.findIndex(t => t.id === tx.id);
      if (idx >= 0) { const n = [...ts]; n[idx] = tx; return n; }
      return [tx, ...ts];
    });
    setShowForm(false); setEditTx(null);
  };
  const handleDeleteTx = (id) => setTransactions(ts => ts.filter(t => t.id !== id));
  const handleImport = (rows) => setTransactions(ts => [...rows, ...ts]);

  const navItems = [
    { id: "dashboard",  label: "Dashboard",  icon: "◈" },
    { id: "extrato",    label: "Extrato",     icon: "≡" },
    { id: "importar",   label: "Importar",    icon: "↑" },
    { id: "contas",     label: "Contas",      icon: "⬡" },
  ];

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.5); }
        input[type=month]::-webkit-calendar-picker-indicator { filter: invert(.5); }
        select option { background: ${C.card}; color: ${C.text}; }
      `}</style>

      {showConfig && <SupabaseConfig onSave={(u, k) => { localStorage.setItem("sb_url", u); localStorage.setItem("sb_key", k); setShowConfig(false); }} />}
      {(showForm || editTx) && (
        <TxForm accounts={accounts} initial={editTx} onSave={handleSaveTx} onClose={() => { setShowForm(false); setEditTx(null); }} />
      )}

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: C.bg }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "0 0 20px", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "28px 24px 24px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.goldDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Família</div>
            <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: C.goldLight, fontWeight: 600, lineHeight: 1 }}>Fontanezzi</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Controle Financeiro</div>
          </div>
          {/* Nav */}
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px",
                borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4, textAlign: "left",
                background: nav === item.id ? C.gold + "18" : "transparent",
                color: nav === item.id ? C.goldLight : C.soft,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: nav === item.id ? 500 : 400,
                borderLeft: nav === item.id ? `2px solid ${C.gold}` : "2px solid transparent",
                transition: "all .15s"
              }}>
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          {/* Footer */}
          <div style={{ padding: "0 12px" }}>
            <button onClick={() => setShowConfig(true)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 12
            }}>⚙ Configurações</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Topbar */}
          <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>
                {navItems.find(n => n.id === nav)?.label}
              </div>
              <div style={{ fontSize: 24, fontFamily: "'Cormorant Garamond', serif", color: C.text, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
                {nav === "dashboard" ? new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) :
                 nav === "extrato" ? "Movimentações" :
                 nav === "importar" ? "Importar Extrato" : "Minhas Contas"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.muted }}>
                <span style={{ marginRight: 6 }}>👨</span>Rodrigo
                <span style={{ margin: "0 8px", color: C.border }}>|</span>
                <span style={{ marginRight: 6 }}>👩</span>Esposa
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 32px" }}>
            {nav === "dashboard" && <Dashboard transactions={transactions} accounts={accounts} />}
            {nav === "extrato"   && <Extrato transactions={transactions} accounts={accounts} onEdit={t => { setEditTx(t); }} onDelete={handleDeleteTx} onAdd={() => setShowForm(true)} />}
            {nav === "importar"  && <UploadExtrato accounts={accounts} onImport={handleImport} />}
            {nav === "contas"    && <Contas accounts={accounts} onAdd={() => {}} onEdit={() => {}} />}
          </div>
        </div>
      </div>
    </>
  );
}
