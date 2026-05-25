import { useState } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useCustomers } from '../../hooks/useCustomers'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, Spinner, ErrorMsg, fmt, formatDate, ANIMAL_META } from '../ui/shared'

const INCOME_TYPES = [
  { value:'sale_animal',  label:'Animal Sale' },
  { value:'sale_eggs',    label:'Egg Sales' },
  { value:'sale_wool',    label:'Wool Sale' },
  { value:'sale_produce', label:'Produce Sale' },
  { value:'sale_meat',    label:'Meat Sale' },
  { value:'breeding',     label:'Breeding / Stud Fee' },
  { value:'other',        label:'Other Income' },
]
const EXPENSE_CATS = [
  { value:'hay',            label:'Hay' },
  { value:'feed',           label:'Feed' },
  { value:'medicine',       label:'Medicine / Vet' },
  { value:'bedding',        label:'Bedding' },
  { value:'equipment',      label:'Equipment' },
  { value:'infrastructure', label:'Infrastructure' },
  { value:'supplements',    label:'Supplements' },
  { value:'labour',         label:'Labour' },
  { value:'other',          label:'Other' },
]
const DOZEN_OPTIONS = [0.5, 1, 2, 3, 4, 5, 6]
const EGG_PRICE     = 5
const SUPPORTED_SPECIES = ['sheep', 'chickens', 'horses']
const SUPPORTED_ANIMALS = SUPPORTED_SPECIES.map(key => [key, ANIMAL_META[key]]).filter(([, meta]) => meta)

// ─── Income Form ───────────────────────────────────────────────────────────────
function IncomeForm({ customers, onSave, onCancel }) {
  const [form, setForm] = useState({
    species:'chickens', income_type:'sale_eggs', description:'', amount:'',
    date: new Date().toISOString().split('T')[0], customer_id:'', quantity:'', unit:'',
  })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  // Load saved egg price from localStorage, fall back to default $5
  const [eggPrice,  setEggPrice]  = useState(() => {
    const saved = localStorage.getItem('fh_egg_price_per_dozen')
    return saved ? parseFloat(saved) : EGG_PRICE
  })
  const [editPrice, setEditPrice] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const isEggs = form.income_type === 'sale_eggs'

  const handleDozens = (n) => {
    set('quantity', n)
    set('unit', 'dozen')
    set('amount', (n * eggPrice).toFixed(2))
    set('description', `${n===0.5?'½':n} dozen egg${n===1?'':'s'}`)
  }

  const handlePriceChange = (newPrice) => {
    const p = parseFloat(newPrice) || 0
    setEggPrice(p)
    if (form.quantity) {
      set('amount', (form.quantity * p).toFixed(2))
    }
  }

  const handlePriceSave = () => {
    // Persist to localStorage so it's remembered next time
    localStorage.setItem('fh_egg_price_per_dozen', eggPrice.toString())
    setEditPrice(false)
  }

  const handleSave = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { setError('Enter a valid amount'); return }
    setSaving(true); setError('')
    try {
      await onSave({
        ...form,
        amount:      Number(form.amount),
        customer_id: form.customer_id || null,
        quantity:    form.quantity    || null,
        unit:        form.unit        || null,
        description: form.description || form.income_type.replace(/_/g,' '),
      })
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <div style={{ ...S.card, padding:22, marginBottom:16, border:'1px dashed #c8b89a', background:'#fdfaf6' }}>
      <style>{`@media(max-width:767px){.pnl-form-grid{grid-template-columns:1fr!important;}}`}</style>
      <span style={S.sectionLabel}>New Income</span>
      {error && <p style={{ color:'#c62828', fontSize:13, marginBottom:10 }}>{error}</p>}

      <div className="pnl-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div>
          <label style={S.label}>Animal Type</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.species} onChange={e=>set('species',e.target.value)}>
            {SUPPORTED_ANIMALS.map(([key, meta]) => (
              <option key={key} value={key}>{meta.emoji} {meta.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Income Type</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.income_type} onChange={e=>set('income_type',e.target.value)}>
            {INCOME_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {isEggs && (
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
              <label style={{ ...S.label, margin:0 }}>Quick Dozens</label>
              {/* Editable price per dozen */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
                <span style={{ fontSize:11, color:'#a08060' }}>Price per dozen:</span>
                {editPrice ? (
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:13, color:'#5a3e1b' }}>$</span>
                    <input
                      type="number" step="0.50" min="0"
                      style={{ ...S.input, width:64, padding:'4px 8px', fontSize:13 }}
                      value={eggPrice}
                      onChange={e=>handlePriceChange(e.target.value)}
                      autoFocus
                    />
                    <button onClick={handlePriceSave}
                      style={{ ...S.btn, ...S.btnPrimary, padding:'4px 10px', fontSize:11 }}>✓</button>
                  </div>
                ) : (
                  <button onClick={()=>setEditPrice(true)}
                    style={{ ...S.btn, background:'#f0ebe4', color:'#5a3e1b', border:'1px solid #d0c4b0', padding:'4px 10px', fontSize:11, fontWeight:600 }}>
                    ${eggPrice.toFixed(2)}/doz ✎
                  </button>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {DOZEN_OPTIONS.map(n=>(
                <button key={n} onClick={()=>handleDozens(n)}
                  style={{ ...S.btn, padding:'8px 14px', fontSize:14, fontWeight:700,
                    background: form.quantity===n?'#c8a060':'#fff',
                    color:      form.quantity===n?'#2c2416':'#7a6648',
                    border:     form.quantity===n?'2px solid #c8a060':'1px solid #d0c4b0' }}>
                  {n===0.5?'½':n}
                </button>
              ))}
            </div>
            <p style={{ fontSize:11, color:'#a08060', margin:'6px 0 0', fontStyle:'italic' }}>
              Auto-fills at ${eggPrice.toFixed(2)}/dozen — tap ✎ to change and save your price.
            </p>
          </div>
        )}
        <div>
          <label style={S.label}>Amount ($)</label>
          <input type="number" step="0.01" style={S.input} value={form.amount}
            onChange={e=>set('amount',e.target.value)} placeholder="0.00"/>
        </div>
        <div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date} onChange={e=>set('date',e.target.value)}/>
        </div>
        <div>
          <label style={S.label}>Description (optional)</label>
          <input style={S.input} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="e.g. Weekly egg sale"/>
        </div>
        <div>
          <label style={S.label}>Customer (optional)</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.customer_id} onChange={e=>set('customer_id',e.target.value)}>
            <option value="">— No customer —</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {customers.length === 0 && (
            <p style={{ fontSize:11, color:'#a08060', margin:'5px 0 0', fontStyle:'italic' }}>
              No customers yet — add them in the <strong style={{ color:'#5a3e1b' }}>Customers</strong> tab first.
            </p>
          )}
          {customers.length > 0 && (
            <p style={{ fontSize:11, color:'#a08060', margin:'5px 0 0' }}>
              Don't see your customer? <strong style={{ color:'#5a3e1b' }}>Add them in the Customers tab.</strong>
            </p>
          )}
        </div>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btn,...S.btnPrimary, opacity:saving?0.7:1 }}>
          {saving?'Saving…':'Save Income'}
        </button>
        <button onClick={onCancel} style={{ ...S.btn,...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Expense Form ──────────────────────────────────────────────────────────────
function ExpenseForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    species:'sheep', category:'hay', description:'', amount:'',
    date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { setError('Enter a valid amount'); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...form, amount: Number(form.amount), description: form.description || form.category })
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <div style={{ ...S.card, padding:22, marginBottom:16, border:'1px dashed #f5c6c6', background:'#fff8f8' }}>
      <style>{`@media(max-width:767px){.exp-form-grid{grid-template-columns:1fr!important;}}`}</style>
      <span style={S.sectionLabel}>New Expense</span>
      {error && <p style={{ color:'#c62828', fontSize:13, marginBottom:10 }}>{error}</p>}
      <div className="exp-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div>
          <label style={S.label}>Animal Type</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.species} onChange={e=>set('species',e.target.value)}>
            {SUPPORTED_ANIMALS.map(([key, meta]) => (
              <option key={key} value={key}>{meta.emoji} {meta.label}</option>
            ))}
            <option value="general">🌾 General</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Category</label>
          <select style={{ ...S.input, cursor:'pointer' }} value={form.category} onChange={e=>set('category',e.target.value)}>
            {EXPENSE_CATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Amount ($)</label>
          <input type="number" step="0.01" style={S.input} value={form.amount}
            onChange={e=>set('amount',e.target.value)} placeholder="0.00"/>
        </div>
        <div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date} onChange={e=>set('date',e.target.value)}/>
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={S.label}>Description (optional)</label>
          <input style={S.input} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="e.g. Hay bale x20"/>
        </div>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btn,...S.btnPrimary, opacity:saving?0.7:1 }}>
          {saving?'Saving…':'Save Expense'}
        </button>
        <button onClick={onCancel} style={{ ...S.btn,...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── P&L Page ──────────────────────────────────────────────────────────────────
export function PnLPage() {
  const { costs,  loading:lc, error:ec, addCost,   deleteCost }   = useFeedCosts()
  const { income, loading:li, error:ei, addIncome, deleteIncome } = useIncome()
  const { customers }    = useCustomers()
  const isMobile         = useIsMobile()
  const [showInc,  setShowInc]  = useState(false)
  const [showExp,  setShowExp]  = useState(false)
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [view,     setView]     = useState('overview') // overview | income | expenses

  const filterI  = speciesFilter==='all' ? income : income.filter(i=>i.species===speciesFilter)
  const filterC  = speciesFilter==='all' ? costs  : costs.filter(c=>c.species===speciesFilter)
  const totalIn  = filterI.reduce((s,i)=>s+Number(i.amount),0)
  const totalOut = filterC.reduce((s,c)=>s+Number(c.amount),0)
  const net      = totalIn - totalOut

  const handleAddIncome  = async(p)=>{ await addIncome(p);  setShowInc(false) }
  const handleAddExpense = async(p)=>{ await addCost(p);    setShowExp(false) }

  if (lc||li) return <div style={S.page}><Spinner/></div>
  if (ec||ei) return <div style={S.page}><ErrorMsg message={ec||ei}/></div>

  return (
    <div style={{ ...S.page, padding:isMobile?'14px 12px':'32px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:30, fontWeight:700, margin:'0 0 4px' }}>
            💰 Profit & Loss
          </h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Track income and expenses across your farm</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>{ setShowInc(v=>!v); setShowExp(false) }}
            style={{ ...S.btn, background:showInc?'#2e7d32':'#e8f5e9', color:showInc?'#fff':'#2e7d32', border:'1px solid #c8e6c9', fontWeight:600 }}>
            {showInc?'✕ Cancel':'+ Income'}
          </button>
          <button onClick={()=>{ setShowExp(v=>!v); setShowInc(false) }}
            style={{ ...S.btn, ...S.btnPrimary }}>
            {showExp?'✕ Cancel':'+ Expense'}
          </button>
        </div>
      </div>

      {showInc && <IncomeForm  customers={customers} onSave={handleAddIncome}  onCancel={()=>setShowInc(false)}/>}
      {showExp && <ExpenseForm                        onSave={handleAddExpense} onCancel={()=>setShowExp(false)}/>}

      {/* Species filter tiles */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { key:'all',      emoji:'🌾', label:'All Animals',  inc:income.reduce((s,i)=>s+Number(i.amount),0), out:costs.reduce((s,c)=>s+Number(c.amount),0) },
          ...SUPPORTED_ANIMALS.map(([key, meta]) => ({
            key,
            emoji: meta.emoji,
            label: meta.label,
            inc: income.filter(i=>i.species===key).reduce((s,i)=>s+Number(i.amount),0),
            out: costs.filter(c=>c.species===key).reduce((s,c)=>s+Number(c.amount),0),
          })),
        ].map(sp=>{
          const spNet   = sp.inc - sp.out
          const isActive= speciesFilter===sp.key
          const nc      = spNet>=0?'#2e7d32':'#c62828'
          return (
            <div key={sp.key} onClick={()=>setSpeciesFilter(sp.key)}
              style={{ ...S.card, padding:isMobile?'10px 8px':'14px 12px', cursor:'pointer', textAlign:'center',
                border:isActive?`2px solid ${nc}`:'1px solid #e8e0d0', background:isActive?'#fdfaf0':'#fff', transition:'all 0.15s' }}>
              <div style={{ fontSize:isMobile?18:22, marginBottom:3 }}>{sp.emoji}</div>
              <div style={{ fontSize:9, color:'#a08060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>{sp.label}</div>
              <div style={{ fontSize:isMobile?13:16, fontWeight:700, color:nc, fontFamily:"'Playfair Display',serif" }}>
                {(spNet>=0?'+':'')+fmt(spNet)}
              </div>
              {!isMobile && (
                <div style={{ fontSize:10, color:'#a08060', marginTop:2, display:'flex', justifyContent:'center', gap:6 }}>
                  <span style={{ color:'#2e7d32' }}>+{fmt(sp.inc)}</span>
                  <span style={{ color:'#c62828' }}>−{fmt(sp.out)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary totals + view tabs */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:6 }}>
          {['overview','income','expenses'].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ ...S.btn, padding:'6px 14px', fontSize:13,
                background:view===v?'#5a3e1b':'#fff', color:view===v?'#fff':'#7a6648',
                border:'1px solid #d0c4b0' }}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:isMobile?12:20, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:10, color:'#2e7d32', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>In</p>
            <p style={{ fontSize:isMobile?15:18, fontWeight:700, color:'#2e7d32', margin:0, fontFamily:"'Playfair Display',serif" }}>+{fmt(totalIn)}</p>
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:10, color:'#c62828', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>Out</p>
            <p style={{ fontSize:isMobile?15:18, fontWeight:700, color:'#c62828', margin:0, fontFamily:"'Playfair Display',serif" }}>−{fmt(totalOut)}</p>
          </div>
          <div style={{ textAlign:'center', borderLeft:'1px solid #e8e0d0', paddingLeft:isMobile?12:18 }}>
            <p style={{ fontSize:10, color:'#a08060', fontWeight:700, textTransform:'uppercase', margin:'0 0 1px' }}>Net</p>
            <p style={{ fontSize:isMobile?17:22, fontWeight:700, color:net>=0?'#2e7d32':'#c62828', margin:0, fontFamily:"'Playfair Display',serif" }}>
              {(net>=0?'+':'')+fmt(net)}
            </p>
          </div>
        </div>
      </div>

      {/* Entries */}
      {(view==='overview'||view==='income') && filterI.length>0 && (
        <div style={{ ...S.card, padding:isMobile?14:22, marginBottom:14 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 14px' }}>Income</p>
          {filterI.map(i=>{
            const typeLabel=(INCOME_TYPES.find(t=>t.value===i.income_type)||{label:i.income_type}).label
            return (
              <div key={i.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:8, background:'#f1f8f1', marginBottom:7 }}>
                <span style={{ fontSize:16 }}>{ANIMAL_META[i.species]?.emoji||'🌾'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.description||typeLabel}</p>
                  <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                    {typeLabel}{i.customer?.name?` · ${i.customer.name}`:''} · {formatDate(i.date)}
                    {i.quantity&&i.unit?` · ${i.quantity} ${i.unit}`:''}
                  </p>
                </div>
                <span style={{ fontWeight:700, fontSize:13, color:'#2e7d32', flexShrink:0 }}>+{fmt(Number(i.amount))}</span>
                <button onClick={()=>deleteIncome(i.id)} style={{ background:'none', border:'none', color:'#c0a080', cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {(view==='overview'||view==='expenses') && filterC.length>0 && (
        <div style={{ ...S.card, padding:isMobile?14:22, marginBottom:14 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, margin:'0 0 14px' }}>Expenses</p>
          {filterC.map(c=>{
            const catLabel=(EXPENSE_CATS.find(x=>x.value===c.category)||{label:c.category}).label
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:8, background:'#fff3f3', marginBottom:7 }}>
                <span style={{ fontSize:16 }}>{ANIMAL_META[c.species]?.emoji||'🌾'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description||catLabel}</p>
                  <p style={{ fontSize:11, color:'#a08060', margin:0 }}>{catLabel} · {formatDate(c.date)}</p>
                </div>
                <span style={{ fontWeight:700, fontSize:13, color:'#c62828', flexShrink:0 }}>−{fmt(Number(c.amount))}</span>
                <button onClick={()=>deleteCost(c.id)} style={{ background:'none', border:'none', color:'#c0a080', cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {filterI.length===0 && filterC.length===0 && (
        <div style={{ ...S.card, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>💰</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, margin:'0 0 8px' }}>No entries yet</p>
          <p style={{ fontSize:14, color:'#a08060', margin:'0 0 16px' }}>Log your first income or expense above.</p>
        </div>
      )}
    </div>
  )
}
