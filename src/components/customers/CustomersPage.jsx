import { useState, useEffect } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { useIncome } from '../../hooks/useIncome'
import { S, Spinner, ErrorMsg, fmt } from '../ui/shared'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const fn = () => setM(window.innerWidth < 768); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])
  return m
}

// ─── Donut ─────────────────────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerValue }) {
  const total=segments.reduce((s,sg)=>s+sg.value,0)
  if(!total) return null
  const size=150, r=56, cx=size/2, cy=size/2
  let angle=-90
  if(segments.filter(s=>s.value>0).length===1){
    const sg=segments.find(s=>s.value>0)
    return(<svg width={size} height={size}><circle cx={cx} cy={cy} r={r} fill={sg.color} opacity={0.9}/><circle cx={cx} cy={cy} r={36} fill="#fff"/><text x={cx} y={cy-5} textAnchor="middle" fontSize={11} fill="#a08060" fontWeight={600}>{centerLabel}</text><text x={cx} y={cy+12} textAnchor="middle" fontSize={13} fill="#2c2416" fontWeight={700} style={{ fontFamily:"'Playfair Display',serif" }}>{centerValue}</text></svg>)
  }
  const paths=segments.filter(s=>s.value>0).map(sg=>{
    const pct=sg.value/total, start=angle, end=angle+pct*360; angle=end
    const sR=(start*Math.PI)/180, eR=(end*Math.PI)/180, large=end-start>180?1:0
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR)
    return {...sg, d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct}
  })
  return(
    <svg width={size} height={size}>
      {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
      <circle cx={cx} cy={cy} r={36} fill="#fff"/>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize={11} fill="#a08060" fontWeight={600}>{centerLabel}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize={13} fill="#2c2416" fontWeight={700} style={{ fontFamily:"'Playfair Display',serif" }}>{centerValue}</text>
    </svg>
  )
}

// ─── Customer Form ─────────────────────────────────────────────────────────────
function CustomerForm({ existing, onSave, onCancel }) {
  const [form, setForm]=useState({ name:existing?.name||'', email:existing?.email||'', phone:existing?.phone||'', notes:existing?.notes||'' })
  const [saving,setSaving]=useState(false)
  const [error, setError] =useState('')
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const handleSave=async()=>{
    if(!form.name.trim()){ setError('Name is required'); return }
    setSaving(true); setError('')
    try { await onSave(form) } catch(err){ setError(err.message); setSaving(false) }
  }
  return(
    <div style={{ ...S.card, padding:22, marginBottom:16, border:'1px dashed #c8b89a', background:'#fdfaf6' }}>
      <style>{`@media(max-width:767px){.cust-form-grid{grid-template-columns:1fr!important;}}`}</style>
      <span style={S.sectionLabel}>{existing?'Edit Customer':'New Customer'}</span>
      {error&&<p style={{ color:'#c62828', fontSize:13, marginBottom:10 }}>{error}</p>}
      <div className="cust-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. John Smith" autoFocus/></div>
        <div><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="Optional"/></div>
        <div><label style={S.label}>Email</label><input type="email" style={S.input} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="Optional"/></div>
        <div><label style={S.label}>Notes</label><input style={S.input} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="e.g. Buys eggs weekly"/></div>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btn,...S.btnPrimary, opacity:saving?0.7:1 }}>{saving?'Saving…':existing?'Save Changes':'Add Customer'}</button>
        <button onClick={onCancel} style={{ ...S.btn,...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Customers Page ────────────────────────────────────────────────────────────
export function CustomersPage() {
  const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const { income } = useIncome()
  const isMobile   = useIsMobile()
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(null)

  const custColors=['#5a3e1b','#795548','#a1887f','#8d6e63','#6d4c41','#4e342e','#bcaaa4']

  // Enrich customers with income data
  const enriched=customers.map((c,i)=>({
    ...c,
    spent: income.filter(i=>i.customer_id===c.id).reduce((s,i)=>s+Number(i.amount),0),
    eggs:  income.filter(i=>i.customer_id===c.id&&i.income_type==='sale_eggs').reduce((s,i)=>s+(i.quantity||0),0),
    txns:  income.filter(i=>i.customer_id===c.id).sort((a,b)=>b.date.localeCompare(a.date)),
    color: custColors[i%custColors.length],
  }))

  const filtered=enriched.filter(c=>
    !search||c.name.toLowerCase().includes(search.toLowerCase())||
    c.email?.toLowerCase().includes(search.toLowerCase())||
    c.phone?.includes(search)
  )

  const withRevenue=enriched.filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent)
  const totalRevenue=withRevenue.reduce((s,c)=>s+c.spent,0)
  const untagged=income.filter(i=>!i.customer_id).reduce((s,i)=>s+Number(i.amount),0)

  const pieSegs=[
    ...withRevenue.map(c=>({ label:c.name.split(' ')[0], value:c.spent, color:c.color })),
    ...(untagged>0?[{ label:'Untagged', value:untagged, color:'#e0e0e0' }]:[])
  ]

  const handleAdd    = async(data)=>{ await addCustomer(data); setShowForm(false) }
  const handleUpdate = async(data)=>{ await updateCustomer(editingId,data); setEditingId(null) }
  const handleDelete = async(id,name)=>{
    if(!window.confirm(`Delete ${name}? They will be removed from all sales.`)) return
    try { await deleteCustomer(id) } catch(err){ alert(err.message) }
  }

  return(
    <div style={{ ...S.page, padding:isMobile?'16px 12px':'32px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, fontWeight:700, margin:'0 0 4px' }}>👥 Customers</h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Manage your buyers and track their purchases</p>
        </div>
        <button onClick={()=>{ setShowForm(v=>!v); setEditingId(null) }} style={{ ...S.btn,...S.btnPrimary, marginLeft:'auto' }}>
          {showForm?'✕ Cancel':'+ Add Customer'}
        </button>
      </div>

      {showForm&&<CustomerForm onSave={handleAdd} onCancel={()=>setShowForm(false)}/>}

      {/* Revenue pie chart — only if there's tagged revenue */}
      {withRevenue.length>0 && (
        <div style={{ ...S.card, padding:isMobile?16:24, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, margin:0 }}>Revenue by Customer</p>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?18:22, color:'#2e7d32', margin:0 }}>{fmt(totalRevenue)}</p>
              <p style={{ fontSize:11, color:'#a08060', margin:0 }}>total tagged revenue</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?12:20, flexWrap:'wrap' }}>
            <DonutChart segments={pieSegs} centerLabel="Revenue" centerValue={fmt(totalRevenue)}/>
            <div style={{ flex:1, minWidth:140 }}>
              {pieSegs.map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'#4a3c28', fontWeight:600, flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:12, color:'#2e7d32', fontWeight:700 }}>{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input style={{ ...S.input, marginBottom:14 }} placeholder="Search customers…" value={search} onChange={e=>setSearch(e.target.value)}/>

      {loading?<Spinner/>:error?<ErrorMsg message={error}/>:
        filtered.length===0?(
          <div style={{ ...S.card, padding:60, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
            <p style={{ color:'#a08060', fontSize:15, marginBottom:16 }}>
              {search?'No customers match your search.':'No customers yet. Add your first buyer!'}
            </p>
            {!search&&<button onClick={()=>setShowForm(true)} style={{ ...S.btn,...S.btnPrimary }}>+ Add Customer</button>}
          </div>
        ):(
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(c=>{
              const isOpen=expanded===c.id
              return(
                <div key={c.id} style={{ ...S.card, overflow:'hidden' }}>
                  {editingId===c.id?(
                    <div style={{ padding:16 }}>
                      <CustomerForm existing={c} onSave={handleUpdate} onCancel={()=>setEditingId(null)}/>
                    </div>
                  ):(
                    <>
                      {/* Customer row */}
                      <div onClick={()=>setExpanded(isOpen?null:c.id)}
                        style={{ padding:isMobile?'14px 16px':'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', userSelect:'none' }}>
                        <div style={{ width:42, height:42, borderRadius:'50%', background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:"'Playfair Display',serif" }}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:16, margin:'0 0 2px' }}>{c.name}</p>
                          <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
                            {[c.phone,c.email].filter(Boolean).join(' · ')||'No contact info'}
                          </p>
                          {c.notes&&<p style={{ fontSize:12, color:'#7a6648', margin:'2px 0 0', fontStyle:'italic' }}>{c.notes}</p>}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginRight:6 }}>
                          {c.spent>0&&<p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?14:18, color:'#2e7d32', margin:'0 0 1px' }}>{fmt(c.spent)}</p>}
                          {c.txns.length>0&&<p style={{ fontSize:11, color:'#a08060', margin:0 }}>{c.txns.length} purchase{c.txns.length!==1?'s':''}</p>}
                          {c.eggs>0&&<p style={{ fontSize:11, color:'#f57f17', fontWeight:600, margin:'1px 0 0' }}>🥚 {c.eggs} dz</p>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                          <span style={{ color:'#c8b89a', fontSize:14, transition:'transform 0.2s', display:'block', transform:isOpen?'rotate(90deg)':'none' }}>›</span>
                        </div>
                      </div>

                      {/* Action buttons — always visible below the row */}
                      {!isOpen&&(
                        <div style={{ padding:'0 16px 12px', display:'flex', gap:8 }}>
                          <button onClick={e=>{ e.stopPropagation(); setEditingId(c.id) }} style={{ ...S.btn,...S.btnSecondary, padding:'5px 12px', fontSize:12 }}>Edit</button>
                          <button onClick={e=>{ e.stopPropagation(); handleDelete(c.id,c.name) }} style={{ ...S.btn,...S.btnDanger, padding:'5px 12px', fontSize:12 }}>Delete</button>
                        </div>
                      )}

                      {/* Expanded transactions */}
                      {isOpen&&(
                        <div style={{ borderTop:'1px solid #f0ebe4', background:'#fdfaf6' }}>
                          <div style={{ padding:'12px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <p style={{ fontSize:11, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Purchase History</p>
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={e=>{ e.stopPropagation(); setEditingId(c.id); setExpanded(null) }} style={{ ...S.btn,...S.btnSecondary, padding:'4px 10px', fontSize:11 }}>Edit</button>
                              <button onClick={e=>{ e.stopPropagation(); handleDelete(c.id,c.name) }} style={{ ...S.btn,...S.btnDanger, padding:'4px 10px', fontSize:11 }}>Delete</button>
                            </div>
                          </div>
                          {c.txns.length===0
                            ?<p style={{ fontSize:13, color:'#a08060', padding:'0 20px 16px' }}>No transactions yet.</p>
                            :c.txns.map(t=>(
                              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 20px', borderTop:'1px solid #f7f4ef' }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:13, fontWeight:600, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</p>
                                  <p style={{ fontSize:11, color:'#a08060', margin:0 }}>
                                    {t.income_type?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                    {t.quantity&&t.unit?` · ${t.quantity} ${t.unit}`:''} · {t.date}
                                  </p>
                                </div>
                                <span style={{ fontSize:14, fontWeight:700, color:'#2e7d32', flexShrink:0 }}>+{fmt(Number(t.amount))}</span>
                              </div>
                            ))
                          }
                          <div style={{ padding:'10px 20px 14px', borderTop:'1px solid #f0ebe4', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <p style={{ fontSize:12, color:'#a08060', margin:0, fontStyle:'italic' }}>
                              {c.txns.length} transaction{c.txns.length!==1?'s':''} · Total {fmt(c.spent)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
