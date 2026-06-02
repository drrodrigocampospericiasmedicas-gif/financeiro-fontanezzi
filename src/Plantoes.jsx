import { useState, useEffect } from "react";

// ─── DESIGN ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0a0c10", surface:"#111318", card:"#161a22", border:"#1e2330",
  blue:"#3b82f6", teal:"#14b8a6", gold:"#f59e0b", green:"#10b981",
  red:"#ef4444", text:"#f1f5f9", muted:"#64748b", soft:"#94a3b8",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');`;
const IS = { width:"100%", background:"#0a0c10", border:"1px solid #1e2330", borderRadius:8, color:"#f1f5f9", padding:"10px 13px", fontSize:14, fontFamily:"'IBM Plex Sans',sans-serif", outline:"none", boxSizing:"border-box" };

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
function getSB() {
  const url = localStorage.getItem("sb_url");
  const key = localStorage.getItem("sb_key");
  const token = localStorage.getItem("sb_token");
  if (!url || !key) return null;
  const hdrs = { "apikey":key, "Authorization":`Bearer ${token||key}`, "Content-Type":"application/json", "Prefer":"return=representation" };
  const base = (t) => `${url}/rest/v1/${t}`;
  return {
    async select(table, extra="") { const r = await fetch(`${base(table)}?select=*${extra}`, { headers:hdrs }); return r.ok ? await r.json() : []; },
    async insert(table, row) { const r = await fetch(base(table), { method:"POST", headers:hdrs, body:JSON.stringify(row) }); return r.ok ? await r.json() : null; },
    async update(table, row, id) { const r = await fetch(`${base(table)}?id=eq.${id}`, { method:"PATCH", headers:hdrs, body:JSON.stringify(row) }); return r.ok; },
    async del(table, id) { const r = await fetch(`${base(table)}?id=eq.${id}`, { method:"DELETE", headers:hdrs }); return r.ok; }
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const brl = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const TODAY = new Date();
const fmtD = (d) => d.toISOString().split("T")[0];
const parseDate = (s) => { try { const [y,m,d]=String(s).split("T")[0].split("-").map(Number); return new Date(y,m-1,d); } catch { return new Date(); } };
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const TIPOS = [
  { id:"plantao",     label:"Plantão",     icon:"🏥", color:C.blue },
  { id:"ambulatorio", label:"Ambulatório", icon:"🩺", color:C.teal },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS   = "plantoes_data";
const LS_L = "plantoes_locais";
const LS_B = "plantoes_bank";
const loadLS  = (k,d=[]) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const saveLS  = (k,v) => localStorage.setItem(k, JSON.stringify(v));

// ─── BANCO ────────────────────────────────────────────────────────────────────
const BankSettings = ({ onClose }) => {
  const [b, setB] = useState(loadLS(LS_B, {banco:"",agencia:"",conta:"",pix:""}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:420}}>
        <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:C.text,marginBottom:6}}>Dados Bancários</div>
        <div style={{fontSize:13,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",marginBottom:20}}>Aparecem no rodapé do PDF</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["banco","Banco"],["agencia","Agência"],["conta","Conta"],["pix","PIX"]].map(([k,l])=>(
            <div key={k}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
              <input style={IS} value={b[k]||""} onChange={e=>setB(x=>({...x,[k]:e.target.value}))} placeholder={l}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={()=>{saveLS(LS_B,b);onClose();}} style={{flex:1,background:C.blue,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Salvar</button>
          <button onClick={onClose} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 18px",fontSize:14,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── CADASTRO DE LOCAIS ───────────────────────────────────────────────────────
const LocalForm = ({ initial, onSave, onClose }) => {
  const blank = { nome:"", tipo:"plantao", valorPadrao:"", obs:"" };
  const [f, setF] = useState(initial ? {...initial, valorPadrao:String(initial.valorPadrao||"")} : blank);
  const sf = (k,v) => setF(x=>({...x,[k]:v}));
  const handleSave = () => {
    if (!f.nome.trim()) return;
    const val = parseFloat(String(f.valorPadrao).replace(",",".")) || 0;
    onSave({...f, id:initial?.id||("loc_"+Date.now()), valorPadrao:val});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:420}}>
        <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:C.text,marginBottom:22}}>
          {initial?"Editar local":"Novo local / plantão"}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:8}}>
            {TIPOS.map(t=>(
              <button key={t.id} onClick={()=>sf("tipo",t.id)} style={{
                flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,
                fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,
                background:f.tipo===t.id?t.color+"22":"transparent",
                color:f.tipo===t.id?t.color:C.muted,
                outline:f.tipo===t.id?`1.5px solid ${t.color}`:`1px solid ${C.border}`,
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Nome do local / hospital</div>
            <input style={IS} placeholder="Ex: UPA Centro, Hospital São Lucas..." value={f.nome} onChange={e=>sf("nome",e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Valor padrão (R$)</div>
            <input style={IS} placeholder="0,00" value={f.valorPadrao} onChange={e=>sf("valorPadrao",e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Observação padrão</div>
            <input style={IS} placeholder="Opcional..." value={f.obs||""} onChange={e=>sf("obs",e.target.value)}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={handleSave} style={{flex:1,background:C.blue,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Salvar</button>
          <button onClick={onClose} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 18px",fontSize:14,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── GERENCIAR LOCAIS ─────────────────────────────────────────────────────────
const GerenciarLocais = ({ locais, onSave, onDelete, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,padding:0}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:500,maxHeight:"80vh",overflow:"auto"}}>
        {showForm
          ? <LocalForm initial={editItem} onSave={(l)=>{onSave(l);setShowForm(false);setEditItem(null);}} onClose={()=>{setShowForm(false);setEditItem(null);}}/>
          : <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:C.text}}>Locais cadastrados</div>
              <button onClick={()=>{setEditItem(null);setShowForm(true);}} style={{background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>+ Novo</button>
            </div>
            {locais.length===0 && (
              <div style={{textAlign:"center",color:C.muted,padding:"32px 0",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13}}>
                Nenhum local cadastrado.<br/>Toque em + Novo para adicionar.
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {locais.map(l=>{
                const tipo = TIPOS.find(t=>t.id===l.tipo);
                return (
                  <div key={l.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:8,background:tipo.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{tipo.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,color:C.text,fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500}}>{l.nome}</div>
                      <div style={{fontSize:12,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",marginTop:2}}>
                        <span style={{color:tipo.color}}>{tipo.label}</span>
                        {l.valorPadrao>0 && <span> · {brl(l.valorPadrao)}</span>}
                        {l.obs && <span> · {l.obs}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>{setEditItem(l);setShowForm(true);}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>✏️</button>
                      <button onClick={()=>onDelete(l.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={onClose} style={{width:"100%",marginTop:20,background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",fontSize:14,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Fechar</button>
          </>
        }
      </div>
    </div>
  );
};

// ─── SELECIONAR LOCAL DO DIA ──────────────────────────────────────────────────
const DayPicker = ({ date, locais, onSelect, onManual, onClose }) => {
  const d = parseDate(date);
  const label = d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,padding:0}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:500,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:11,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Adicionar plantão em</div>
        <div style={{fontSize:18,fontFamily:"'Playfair Display',serif",color:C.text,marginBottom:20,textTransform:"capitalize"}}>{label}</div>

        {locais.length > 0 && (
          <>
            <div style={{fontSize:12,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Locais cadastrados</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,overflowY:"auto",flex:1}}>
              {locais.map(l => {
                const tipo = TIPOS.find(t=>t.id===l.tipo);
                return (
                  <button key={l.id} onClick={()=>onSelect(l, date)} style={{
                    background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
                    padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left"
                  }}>
                    <div style={{width:38,height:38,borderRadius:8,background:tipo.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{tipo.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,color:C.text,fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500}}>{l.nome}</div>
                      <div style={{fontSize:12,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",marginTop:1}}>
                        <span style={{color:tipo.color}}>{tipo.label}</span>
                        {l.valorPadrao>0 && <span> · {brl(l.valorPadrao)}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:20,color:C.muted}}>›</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{flexShrink:0,paddingTop:8}}>
          <button onClick={()=>onManual(date)} style={{
            width:"100%", background:C.blue+"18", border:`1px solid ${C.blue}44`,
            color:C.blue, borderRadius:12, padding:"13px", fontSize:14, fontWeight:500,
            fontFamily:"'IBM Plex Sans',sans-serif", cursor:"pointer", marginBottom:10
          }}>✏️ Lançamento manual</button>
          <button onClick={onClose} style={{width:"100%",background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",fontSize:14,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── FORM DE PLANTÃO ─────────────────────────────────────────────────────────
const PlantaoForm = ({ initial, prefillLocal, onSave, onClose }) => {
  const blank = { data:fmtD(TODAY), tipo:"plantao", local:"", valor:"", obs:"" };
  const init = initial
    ? {...initial, valor:String(initial.valor||"")}
    : prefillLocal
      ? { data:prefillLocal.data||fmtD(TODAY), tipo:prefillLocal.tipo||"plantao", local:prefillLocal.nome||"", valor:String(prefillLocal.valorPadrao||""), obs:prefillLocal.obs||"" }
      : blank;
  const [f, setF] = useState(init);
  const sf = (k,v) => setF(x=>({...x,[k]:v}));
  const handleSave = () => {
    if (!f.data||!f.local.trim()||!f.valor) return;
    const val = parseFloat(String(f.valor).replace(",","."));
    if (isNaN(val)) return;
    onSave({...f, id:initial?.id||("pl_"+Date.now()), valor:val});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:"100%",maxWidth:440}}>
        <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:C.text,marginBottom:22}}>
          {initial?"Editar lançamento":"Novo lançamento"}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:8}}>
            {TIPOS.map(t=>(
              <button key={t.id} onClick={()=>sf("tipo",t.id)} style={{
                flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,
                fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,
                background:f.tipo===t.id?t.color+"22":"transparent",
                color:f.tipo===t.id?t.color:C.muted,
                outline:f.tipo===t.id?`1.5px solid ${t.color}`:`1px solid ${C.border}`,
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Data</div>
            <input type="date" style={IS} value={f.data} onChange={e=>sf("data",e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Local / Hospital</div>
            <input style={IS} placeholder="Ex: UPA Centro..." value={f.local} onChange={e=>sf("local",e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Valor (R$)</div>
            <input style={IS} placeholder="0,00" value={f.valor} onChange={e=>sf("valor",e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Observações</div>
            <input style={IS} placeholder="Opcional..." value={f.obs||""} onChange={e=>sf("obs",e.target.value)}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={handleSave} style={{flex:1,background:C.blue,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Salvar</button>
          <button onClick={onClose} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 18px",fontSize:14,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── CALENDÁRIO ───────────────────────────────────────────────────────────────
const Calendar = ({ plantoes, month, year, onDayClick }) => {
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  const getDay = (d) => {
    if (!d) return [];
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return plantoes.filter(p => String(p.data).split("T")[0]===ds);
  };

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:C.surface}}>
        {WEEKDAYS.map(w=>(
          <div key={w} style={{padding:"10px 0",textAlign:"center",fontSize:11,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>{w}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:C.border}}>
        {cells.map((d,i)=>{
          const items = getDay(d);
          const hasP = items.some(p=>p.tipo==="plantao");
          const hasA = items.some(p=>p.tipo==="ambulatorio");
          const isToday = d && new Date(year,month,d).toDateString()===TODAY.toDateString();
          const ds = d ? `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` : null;
          return (
            <div key={i} onClick={()=>d&&onDayClick(ds)} style={{
              background:C.card, minHeight:64, padding:"6px 8px", cursor:d?"pointer":"default", position:"relative"
            }}
            onMouseEnter={e=>{if(d)e.currentTarget.style.background="#1a2235";}}
            onMouseLeave={e=>{if(d)e.currentTarget.style.background=C.card;}}>
              {d && <>
                <div style={{
                  width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  background:isToday?C.blue:"transparent",
                  fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",
                  color:isToday?"#fff":C.soft,fontWeight:isToday?600:400,
                }}>{d}</div>
                <div style={{marginTop:2,display:"flex",flexDirection:"column",gap:2}}>
                  {hasP && <div style={{fontSize:9,background:C.blue+"33",color:C.blue,borderRadius:3,padding:"1px 4px",fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500}}>🏥 Plantão</div>}
                  {hasA && <div style={{fontSize:9,background:C.teal+"33",color:C.teal,borderRadius:3,padding:"1px 4px",fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500}}>🩺 Amb.</div>}
                </div>
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PDF ───────────────────────────────────────────────────────────────────────
function generateAndSharePDF(plantoes, month, year) {
  const bank = loadLS(LS_B, {});
  const fmt_date = (s) => { try { const [y,m,d]=String(s).split("T")[0].split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}); } catch { return s; } };
  const fmt_brl = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);

  const monthData = plantoes.filter(p => {
    try { const d=parseDate(p.data); return d.getMonth()===month && d.getFullYear()===year; } catch { return false; }
  }).sort((a,b)=>String(a.data).localeCompare(String(b.data)));

  const totP = monthData.filter(p=>p.tipo==="plantao").reduce((s,p)=>s+p.valor,0);
  const totA = monthData.filter(p=>p.tipo==="ambulatorio").reduce((s,p)=>s+p.valor,0);
  const tot  = totP + totA;

  const rows = monthData.map(p=>`
    <tr>
      <td>${fmt_date(p.data)}</td>
      <td><span class="badge ${p.tipo}">${p.tipo==="plantao"?"🏥 Plantão":"🩺 Ambulatório"}</span></td>
      <td>${p.local}</td>
      <td class="valor">${fmt_brl(p.valor)}</td>
      <td>${p.obs||""}</td>
    </tr>`).join("");

  const bankHtml = (bank.pix||bank.conta) ? `
    <div class="bank"><div class="bank-title">Dados para Pagamento</div>
    <div class="bank-grid">
      ${bank.banco?`<div><b>Banco:</b> ${bank.banco}</div>`:""}
      ${bank.agencia?`<div><b>Agência:</b> ${bank.agencia}</div>`:""}
      ${bank.conta?`<div><b>Conta:</b> ${bank.conta}</div>`:""}
      ${bank.pix?`<div class="pix-row"><b>PIX:</b> ${bank.pix}</div>`:""}
    </div></div>` : "";

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'IBM Plex Sans',sans-serif;color:#1a1a2e;background:#fff;padding:40px;max-width:800px;margin:0 auto;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #1a1a2e;}
  .title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#1a1a2e;line-height:1.2;}
  .subtitle{font-size:12px;color:#64748b;margin-top:4px;}
  .period-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;}
  .period-value{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1a1a2e;text-align:right;}
  .totals{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:22px;}
  .tc{border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;}
  .tc.main{background:#1a1a2e;color:#fff;}
  .tl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:5px;}
  .tc.main .tl{color:#94a3b8;}
  .tv{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1a1a2e;}
  .tc.p .tv{color:#1d4ed8;} .tc.a .tv{color:#0d9488;} .tc.main .tv{color:#fff;}
  table{width:100%;border-collapse:collapse;margin-bottom:22px;}
  th{background:#1a1a2e;color:#fff;padding:9px 11px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;}
  td{padding:9px 11px;border-bottom:1px solid #e2e8f0;font-size:13px;}
  .badge{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:500;}
  .badge.plantao{background:#dbeafe;color:#1d4ed8;} .badge.ambulatorio{background:#ccfbf1;color:#0d9488;}
  .valor{font-weight:600;}
  .bank{border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-top:20px;}
  .bank-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px;}
  .bank-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:13px;}
  .pix-row{grid-column:1/-1;font-size:14px;}
  .footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;}
</style></head><body>
  <div class="header">
    <div><div class="title">Plantões<br>Dr. Rodrigo Fontanezzi</div>
    <div class="subtitle">CRM 97684-9 · RQE 32466 · Ortopedia e Traumatologia</div></div>
    <div><div class="period-label">Período</div><div class="period-value">${MONTHS[month]} ${year}</div></div>
  </div>
  <div class="totals">
    <div class="tc p"><div class="tl">🏥 Plantões</div><div class="tv">${fmt_brl(totP)}</div></div>
    <div class="tc a"><div class="tl">🩺 Ambulatório</div><div class="tv">${fmt_brl(totA)}</div></div>
    <div class="tc main"><div class="tl">Total do Mês</div><div class="tv">${fmt_brl(tot)}</div></div>
  </div>
  <table><thead><tr><th>Data</th><th>Tipo</th><th>Local / Hospital</th><th>Valor</th><th>Obs.</th></tr></thead>
  <tbody>${rows}</tbody></table>
  ${bankHtml}
  <div class="footer">Gerado em ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})} · ${monthData.length} lançamento${monthData.length!==1?"s":""}</div>
</body></html>`;

  const blob = new Blob([html],{type:"text/html"});
  const url = URL.createObjectURL(blob);
  const win = window.open(url,"_blank");
  if (win) win.onload = ()=>win.print();
  setTimeout(()=>{
    const text = `Plantões Dr. Rodrigo Fontanezzi — ${MONTHS[month]} ${year}\nTotal: ${fmt_brl(tot)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  },1200);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({msg})=>(
  <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.blue,color:"#fff",borderRadius:10,padding:"12px 22px",fontSize:13,fontFamily:"'IBM Plex Sans',sans-serif",zIndex:999,boxShadow:"0 4px 20px #0006",whiteSpace:"nowrap"}}>{msg}</div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [plantoes, setPlantoes]     = useState([]);
  const [locais, setLocais]         = useState([]);
  const [month, setMonth]           = useState(TODAY.getMonth());
  const [year, setYear]             = useState(TODAY.getFullYear());
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [prefillLocal, setPrefill]  = useState(null); // {data, ...localData}
  const [showBank, setShowBank]     = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  const [dayPicker, setDayPicker]   = useState(null); // date string
  const [tab, setTab]               = useState("lista");
  const [toast, setToast]           = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(() => {
    setLocais(loadLS(LS_L, []));
    const sb = getSB();
    if (sb) {
      sb.select("plantoes","&order=data.desc").then(data=>{
        if (data?.length) setPlantoes(data); else setPlantoes(loadLS(LS,[],));
      }).catch(()=>setPlantoes(loadLS(LS,[])));
    } else { setPlantoes(loadLS(LS,[])); }
  }, []);

  const savePlantao = async (item) => {
    const next = editItem ? plantoes.map(p=>p.id===item.id?item:p) : [item,...plantoes];
    setPlantoes(next); saveLS(LS, next);
    const sb = getSB();
    if (sb) { if (editItem) await sb.update("plantoes",item,item.id); else await sb.insert("plantoes",item); }
    setShowForm(false); setEditItem(null); setPrefill(null); setDayPicker(null);
    showToast("✅ Plantão salvo!");
  };

  const delPlantao = async (id) => {
    if (!window.confirm("Excluir?")) return;
    const next = plantoes.filter(p=>p.id!==id);
    setPlantoes(next); saveLS(LS,next);
    const sb=getSB(); if(sb) await sb.del("plantoes",id);
    showToast("Removido");
  };

  const saveLocal = (l) => {
    const next = locais.find(x=>x.id===l.id) ? locais.map(x=>x.id===l.id?l:x) : [...locais,l];
    setLocais(next); saveLS(LS_L,next);
    showToast("✅ Local salvo!");
  };

  const delLocal = (id) => {
    const next = locais.filter(l=>l.id!==id);
    setLocais(next); saveLS(LS_L,next);
  };

  // Ao clicar num dia — se tem locais cadastrados, abre o picker; senão abre form manual
  const onDayClick = (ds) => {
    setDayPicker(ds);
  };

  // Ao selecionar um local no picker — pré-preenche o form
  const onPickLocal = (local, date) => {
    setDayPicker(null);
    setPrefill({...local, data:date});
    setEditItem(null);
    setShowForm(true);
  };

  // Manual a partir do picker
  const onPickManual = (date) => {
    setDayPicker(null);
    setPrefill({data:date});
    setEditItem(null);
    setShowForm(true);
  };

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const filtered = plantoes.filter(p=>{
    try { const d=parseDate(p.data); return d.getMonth()===month && d.getFullYear()===year; } catch { return false; }
  }).sort((a,b)=>String(a.data).localeCompare(String(b.data)));

  const totP = filtered.filter(p=>p.tipo==="plantao").reduce((s,p)=>s+p.valor,0);
  const totA = filtered.filter(p=>p.tipo==="ambulatorio").reduce((s,p)=>s+p.valor,0);

  return (
    <>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5);}select option{background:${C.card};color:${C.text};}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.surface};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}`}</style>

      {showForm && <PlantaoForm initial={editItem} prefillLocal={prefillLocal} onSave={savePlantao} onClose={()=>{setShowForm(false);setEditItem(null);setPrefill(null);}}/>}
      {showBank && <BankSettings onClose={()=>setShowBank(false)}/>}
      {showLocais && <GerenciarLocais locais={locais} onSave={saveLocal} onDelete={delLocal} onClose={()=>setShowLocais(false)}/>}
      {dayPicker && <DayPicker date={dayPicker} locais={locais} onSelect={onPickLocal} onManual={onPickManual} onClose={()=>setDayPicker(null)}/>}
      {toast && <Toast msg={toast}/>}

      <div style={{minHeight:"100vh",background:C.bg,paddingBottom:100}}>
        {/* Header */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 16px"}}>
          <div style={{maxWidth:600,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",letterSpacing:2,textTransform:"uppercase"}}>Dr. Rodrigo Fontanezzi</div>
              <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",color:C.text,fontWeight:700,lineHeight:1.1}}>Controle de Plantões</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowLocais(true)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.soft,borderRadius:8,padding:"8px 11px",fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>
                🏥 Locais
              </button>
              <button onClick={()=>setShowBank(true)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.soft,borderRadius:8,padding:"8px 11px",fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>
                🏦
              </button>
              <button onClick={()=>generateAndSharePDF(plantoes,month,year)} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>
                📤 PDF
              </button>
            </div>
          </div>
        </div>

        <div style={{maxWidth:600,margin:"0 auto",padding:"18px 14px"}}>
          {/* Navigator */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <button onClick={prevMonth} style={{background:C.card,border:`1px solid ${C.border}`,color:C.soft,borderRadius:8,padding:"8px 16px",fontSize:18,cursor:"pointer"}}>‹</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",color:C.text,fontWeight:600}}>{MONTHS[month]}</div>
              <div style={{fontSize:13,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif"}}>{year}</div>
            </div>
            <button onClick={nextMonth} style={{background:C.card,border:`1px solid ${C.border}`,color:C.soft,borderRadius:8,padding:"8px 16px",fontSize:18,cursor:"pointer"}}>›</button>
          </div>

          {/* Totais */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
            {[["🏥 Plantões",totP,C.blue,"plantao"],["🩺 Ambulatório",totA,C.teal,"ambulatorio"],["Total",totP+totA,C.gold,""]].map(([label,val,color,tipo])=>(
              <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif",textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{label}</div>
                <div style={{fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:700,color}}>{brl(val)}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:2,fontFamily:"'IBM Plex Sans',sans-serif"}}>
                  {tipo ? `${filtered.filter(p=>p.tipo===tipo).length} lanç.` : `${filtered.length} lanç.`}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginBottom:14,background:C.card,borderRadius:10,padding:4,border:`1px solid ${C.border}`}}>
            {[["lista","📋 Lista"],["calendario","📅 Calendário"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",
                background:tab===id?C.blue:"transparent",
                color:tab===id?"#fff":C.muted,
                fontSize:13,fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:tab===id?600:400,
              }}>{label}</button>
            ))}
          </div>

          {/* Lista */}
          {tab==="lista" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.length===0 && (
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:12}}>🏥</div>
                  <div style={{fontSize:15,color:C.soft,fontFamily:"'IBM Plex Sans',sans-serif",marginBottom:4}}>Nenhum plantão em {MONTHS[month]}</div>
                  <div style={{fontSize:13,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif"}}>Toque em + para adicionar</div>
                </div>
              )}
              {filtered.map(p=>{
                const tipo = TIPOS.find(t=>t.id===p.tipo)||TIPOS[0];
                const d = parseDate(p.data);
                return (
                  <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:44,height:44,borderRadius:10,background:tipo.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{tipo.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,color:C.text,fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.local}</div>
                      <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:11,background:tipo.color+"22",color:tipo.color,borderRadius:4,padding:"1px 7px",fontFamily:"'IBM Plex Sans',sans-serif"}}>{tipo.label}</span>
                        <span style={{fontSize:11,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif"}}>{d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
                        {p.obs&&<span style={{fontSize:11,color:C.muted,fontFamily:"'IBM Plex Sans',sans-serif"}}>· {p.obs}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                      <div style={{fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:600,color:tipo.color}}>{brl(p.valor)}</div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>{setEditItem(p);setPrefill(null);setShowForm(true);}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"2px 4px"}}>✏️</button>
                        <button onClick={()=>delPlantao(p.id)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"2px 4px"}}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendário */}
          {tab==="calendario" && <Calendar plantoes={plantoes} month={month} year={year} onDayClick={onDayClick}/>}
        </div>
      </div>

      {/* FAB */}
      <button onClick={()=>{setEditItem(null);setPrefill(null);setDayPicker(null);setShowForm(true);}} style={{
        position:"fixed",bottom:24,right:20,width:56,height:56,borderRadius:"50%",
        background:C.blue,color:"#fff",border:"none",fontSize:26,cursor:"pointer",
        boxShadow:`0 4px 20px ${C.blue}66`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,
      }}>+</button>
    </>
  );
}
