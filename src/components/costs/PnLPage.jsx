import { useState } from 'react'
import { useFeedCosts } from '../../hooks/useFeedCosts'
import { useIncome } from '../../hooks/useIncome'
import { useCustomers } from '../../hooks/useCustomers'
import { S, Spinner, ErrorMsg, ANIMAL_META, formatDate, fmt } from '../ui/shared'

const INCOME_TYPES = [
  { value: 'sale_animal',  label: 'Animal Sale'  },
  { value: 'sale_produce', label: 'Produce Sale' },
  { value: 'sale_eggs',    label: 'Egg Sale'     },
  { value: 'sale_wool',    label: 'Wool Sale'    },
  { value: 'sale_meat',    label: 'Meat Sale'    },
  { value: 'breeding',     label: 'Breeding Fee' },
  { value: 'other',        label: 'Other Income' },
]

const EXPENSE_CATEGORIES = [
  { value: 'hay',           label: 'Hay',            emoji: '🌾', color: '#f57f17', bg: '#fff8e1' },
  { value: 'feed',          label: 'Feed',           emoji: '🪣', color: '#795548', bg: '#efebe9' },
  { value: 'medicine',      label: 'Medicine & Vet', emoji: '💊', color: '#c62828', bg: '#fff3f3' },
  { value: 'infrastructure',label: 'Infrastructure', emoji: '🔨', color: '#37474f', bg: '#eceff1' },
  { value: 'equipment',     label: 'Equipment',      emoji: '⚙️',  color: '#1565c0', bg: '#e3f2fd' },
  { value: 'bedding',       label: 'Bedding',        emoji: '🛏️',  color: '#558b2f', bg: '#f1f8e9' },
  { value: 'supplements',   label: 'Supplements',    emoji: '🧪', color: '#6a1b9a', bg: '#f3e5f5' },
  { value: 'labour',        label: 'Labour',         emoji: '👷', color: '#4a3c28', bg: '#fdf6ec' },
  { value: 'other',         label: 'Other',          emoji: '📋', color: '#616161', bg: '#fafafa' },
]

function fmtIncome(n)  { return `+${fmt(n)}` }
function fmtExpense(n) { return `-${fmt(n)}` }
function fmtNet(n)     { return `${n >= 0 ? '+' : ''}${fmt(n)}` }
function netColor(n)   { return n >= 0 ? '#2e7d32' : '#c62828' }
function netBg(n)      { return n >= 0 ? '#e8f5e9' : '#fff3f3' }

export function PnLPage() {
  const { costs,  loading: costsLoading,  error: costsError,  addCost,   deleteCost   } = useFeedCosts()
  const { income, loading: incomeLoading, error: incomeError, addIncome, deleteIncome } = useIncome()
  const { customers } = useCustomers()

  const [tab,            setTab]           = useState('overview')
  const [filterAnimal,   setFilterAnimal]  = useState('all')
  const [showCostForm,   setShowCostForm]  = useState(false)
  const [showIncomeForm, setShowIncomeForm]= useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [costForm,   setCostForm]   = useState({ species: 'sheep', category: 'hay', description: '', amount: '', date: today })
  const [incomeForm, setIncomeForm] = useState({ species: 'sheep', income_type: 'sale_animal', description: '', amount: '', date: today, customer_id: '' })
  const [costErr,    setCostErr]    = useState('')
  const [incomeErr,  setIncomeErr]  = useState('')
  const setC = (k, v) => setCostForm(f  => ({ ...f, [k]: v }))
  const setI = (k, v) => setIncomeForm(f => ({ ...f, [k]: v }))

  const loading = costsLoading || incomeLoading
  const error   = costsError   || incomeError

  const filteredCosts  = costs.filter(c  => filterAnimal === 'all' || c.species === filterAnimal)
  const filteredIncome = income.filter(i => filterAnimal === 'all' || i.species === filterAnimal)

  const totalCosts  = filteredCosts.reduce((s, c) => s + Number(c.amount), 0)
  const totalIncome = filteredIncome.reduce((s, i) => s + Number(i.amount), 0)
  const netPnL      = totalIncome - totalCosts

  const animalPnL = {}
  Object.keys(ANIMAL_META).forEach(k => {
    const spent  = costs.filter(c  => c.species === k).reduce((s, c) => s + Number(c.amount), 0)
    const earned = income.filter(i => i.species === k).reduce((s, i) => s + Number(i.amount), 0)
    animalPnL[k] = { spent, earned, net: earned - spent }
  })

  const allDates = [...filteredCosts.map(c => c.date), ...filteredIncome.map(i => i.date)]
  const months   = [...new Set(allDates.map(d => d.slice(0, 7)))].sort().reverse()
  const fmtMonth = m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) }

  const handleAddCost = async () => {
    if (!costForm.description.trim()) { setCostErr('Description required'); return }
    const amt = parseFloat(costForm.amount)
    if (!costForm.amount || isNaN(amt) || amt <= 0) { setCostErr('Enter a valid amount'); return }
    try {
      await addCost({ species: costForm.species, category: costForm.category, description: costForm.description, amount: amt, date: costForm.date })
      setCostForm({ species: 'sheep', category: 'hay', description: '', amount: '', date: today })
      setCostErr(''); setShowCostForm(false)
    } catch (err) { setCostErr(err.message) }
  }

  const handleAddIncome = async () => {
    if (!incomeForm.description.trim()) { setIncomeErr('Description required'); return }
    const amt = parseFloat(incomeForm.amount)
    if (!incomeForm.amount || isNaN(amt) || amt <= 0) { setIncomeErr('Enter a valid amount'); return }
    try {
      await addIncome({ species: incomeForm.species, income_type: incomeForm.income_type, description: incomeForm.description, amount: amt, date: incomeForm.date, customer_id: incomeForm.customer_id || null })
      setIncomeForm({ species: 'sheep', income_type: 'sale_animal', description: '', amount: '', date: today, customer_id: '' })
      setIncomeErr(''); setShowIncomeForm(false)
    } catch (err) { setIncomeErr(err.message) }
  }

  return (
    <div style={S.page}>
      <style>{`
        @media (max-width: 767px) {
          .pnl-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .pnl-header-btns { display: flex !important; gap: 8px !important; }
          .pnl-header-btns button { flex: 1 !important; }
          .pnl-income-grid { grid-template-columns: 1fr 1fr !important; }
          .pnl-expense-grid { grid-template-columns: 1fr !important; }
          .pnl-amount-row { grid-template-columns: 1fr !important; }
          .pnl-tabs-row { flex-direction: column !important; gap: 12px !important; }
          .pnl-tabs { width: 100% !important; }
          .pnl-tabs button { flex: 1 !important; }
          .pnl-summary-nums { display: flex !important; justify-content: space-between !important; width: 100% !important; }
          .pnl-animal-tiles { grid-template-columns: repeat(3, 1fr) !important; }
          .pnl-tile-label { font-size: 9px !important; }
          .pnl-tile-num { font-size: 13px !important; }
          .pnl-tile-sub { display: none !important; }
          .pnl-month-header { flex-wrap: wrap !important; gap: 6px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="pnl-header" style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>Profit & Loss</h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>Track what you spend and earn</p>
        </div>
        <div className="pnl-header-btns" style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={() => { setShowIncomeForm(v => !v); setShowCostForm(false) }}
            style={{ ...S.btn, background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
            {showIncomeForm ? '✕' : '+ Income'}
          </button>
          <button onClick={() => { setShowCostForm(v => !v); setShowIncomeForm(false) }}
            style={{ ...S.btn, ...S.btnPrimary }}>
            {showCostForm ? '✕' : '+ Expense'}
          </button>
        </div>
      </div>

      {/* Income form */}
      {showIncomeForm && (
        <div style={{ ...S.card, padding: 20, marginBottom: 18, border: '1px dashed #a5d6a7', background: '#f1f8f1' }}>
          <span style={{ ...S.sectionLabel, color: '#2e7d32' }}>Log Income</span>
          {incomeErr && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 10 }}>{incomeErr}</p>}
          <div className="pnl-income-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Animal</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={incomeForm.species} onChange={e => setI('species', e.target.value)}>
                {Object.entries(ANIMAL_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={incomeForm.income_type} onChange={e => setI('income_type', e.target.value)}>
                {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Description</label>
              <input style={S.input} value={incomeForm.description} onChange={e => setI('description', e.target.value)} placeholder="e.g. Sold 3 lambs" />
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={incomeForm.date} onChange={e => setI('date', e.target.value)} />
            </div>
          </div>
          {/* Customer + amount row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={S.label}>Customer / Buyer</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={incomeForm.customer_id} onChange={e => setI('customer_id', e.target.value)}>
                <option value="">— No customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Amount ($)</label>
              <input type="number" min="0" step="0.01" style={S.input} value={incomeForm.amount} onChange={e => setI('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
              <button onClick={handleAddIncome} style={{ ...S.btn, background: '#4caf50', color: '#fff' }}>Save</button>
              <button onClick={() => { setShowIncomeForm(false); setIncomeErr('') }} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense form */}
      {showCostForm && (
        <div style={{ ...S.card, padding: 20, marginBottom: 18, border: '1px dashed #c8b89a', background: '#fdfaf6' }}>
          <span style={S.sectionLabel}>Log Expense</span>
          {costErr && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 10 }}>{costErr}</p>}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Category</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXPENSE_CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setC('category', cat.value)}
                  style={{ ...S.btn, padding: '6px 10px', fontSize: 12, gap: 4,
                    background: costForm.category === cat.value ? cat.color : '#fff',
                    color: costForm.category === cat.value ? '#fff' : '#7a6648',
                    border: `1px solid ${costForm.category === cat.value ? cat.color : '#d0c4b0'}`,
                  }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pnl-expense-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Animal</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={costForm.species} onChange={e => setC('species', e.target.value)}>
                {Object.entries(ANIMAL_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Description</label>
              <input style={S.input} value={costForm.description} onChange={e => setC('description', e.target.value)} placeholder="e.g. Hay bale x10" />
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={costForm.date} onChange={e => setC('date', e.target.value)} />
            </div>
          </div>
          <div className="pnl-amount-row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={S.label}>Amount ($)</label>
              <input type="number" min="0" step="0.01" style={S.input} value={costForm.amount} onChange={e => setC('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAddCost} style={{ ...S.btn, ...S.btnPrimary }}>Save</button>
              <button onClick={() => { setShowCostForm(false); setCostErr('') }} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Animal filter tiles */}
      <div className="pnl-animal-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 20 }}>
        {[{ key: 'all', label: 'All Animals', emoji: '🌾' }, ...Object.entries(ANIMAL_META).map(([k, v]) => ({ key: k, label: v.label, emoji: v.emoji }))].map(a => {
          const p = a.key === 'all'
            ? { net: netPnL, spent: totalCosts, earned: totalIncome }
            : animalPnL[a.key] || { net: 0, spent: 0, earned: 0 }
          const isActive = filterAnimal === a.key
          return (
            <div key={a.key} onClick={() => setFilterAnimal(a.key)}
              style={{ ...S.card, padding: '12px 8px', cursor: 'pointer', textAlign: 'center', border: isActive ? `2px solid ${netColor(p.net)}` : '1px solid #e8e0d0', background: isActive ? netBg(p.net) : '#fff', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{a.emoji}</div>
              <div className="pnl-tile-label" style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{a.label}</div>
              <div className="pnl-tile-num" style={{ fontSize: 14, fontWeight: 700, color: netColor(p.net), fontFamily: "'Playfair Display',serif" }}>{fmtNet(p.net)}</div>
              <div className="pnl-tile-sub" style={{ fontSize: 10, color: '#a08060', marginTop: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
                <span style={{ color: '#2e7d32', fontWeight: 600 }}>+{fmt(p.earned)}</span>
                <span style={{ color: '#bbb' }}>·</span>
                <span style={{ color: '#c62828', fontWeight: 600 }}>-{fmt(p.spent)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs + summary nums */}
      <div className="pnl-tabs-row" style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
        <div className="pnl-tabs" style={{ display: 'flex', gap: 6 }}>
          {[['overview','Overview'],['income','Income'],['expenses','Expenses']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...S.btn, padding: '7px 16px', fontSize: 13, background: tab === key ? '#5a3e1b' : '#fff', color: tab === key ? '#fff' : '#7a6648', border: '1px solid #d0c4b0' }}>
              {label}
            </button>
          ))}
        </div>
        <div className="pnl-summary-nums" style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>In</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32', margin: 0 }}>+{fmt(totalIncome)}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#c62828', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>Out</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#c62828', margin: 0 }}>-{fmt(totalCosts)}</p>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #e8e0d0', paddingLeft: 14 }}>
            <p style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>Net</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: netColor(netPnL), fontFamily: "'Playfair Display',serif", margin: 0 }}>{fmtNet(netPnL)}</p>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            months.length === 0
              ? <div style={{ ...S.card, padding: 48, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No entries yet. Log your first income or expense above.</p></div>
              : months.map(mo => {
                  const moCosts  = filteredCosts.filter(c  => c.date.startsWith(mo))
                  const moIncome = filteredIncome.filter(i => i.date.startsWith(mo))
                  const moSpent  = moCosts.reduce((s, c)  => s + Number(c.amount), 0)
                  const moEarned = moIncome.reduce((s, i) => s + Number(i.amount), 0)
                  const moNet    = moEarned - moSpent
                  return (
                    <div key={mo} style={{ ...S.card, padding: 18, marginBottom: 12 }}>
                      <div className="pnl-month-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f0ebe4' }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700 }}>{fmtMonth(mo)}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>+{fmt(moEarned)}</span>
                          <span style={{ fontSize: 12, color: '#c62828', fontWeight: 600 }}>-{fmt(moSpent)}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: netColor(moNet), borderLeft: '1px solid #e8e0d0', paddingLeft: 10 }}>{fmtNet(moNet)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[...moIncome.map(i => ({ ...i, _type: 'income' })), ...moCosts.map(c => ({ ...c, _type: 'expense' }))]
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(entry => {
                            const meta     = ANIMAL_META[entry.species] || ANIMAL_META.sheep
                            const isIncome = entry._type === 'income'
                            const catMeta  = !isIncome ? (EXPENSE_CATEGORIES.find(c => c.value === entry.category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length-1]) : null
                            const iType    = isIncome ? (INCOME_TYPES.find(t => t.value === entry.income_type)?.label || 'Income') : catMeta?.label
                            return (
                              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: isIncome ? '#f1f8f1' : (catMeta?.bg || '#fdfaf6') }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{isIncome ? meta.emoji : catMeta?.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</p>
                                  <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · {iType}{entry.customer?.name ? ` · 👤 ${entry.customer.name}` : ''} · {formatDate(entry.date)}</p>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 13, color: isIncome ? '#2e7d32' : '#c62828', flexShrink: 0 }}>
                                  {isIncome ? fmtIncome(entry.amount) : fmtExpense(entry.amount)}
                                </span>
                                <button onClick={() => isIncome ? deleteIncome(entry.id) : deleteCost(entry.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })
          )}

          {/* Income tab */}
          {tab === 'income' && (
            filteredIncome.length === 0
              ? <div style={{ ...S.card, padding: 48, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No income recorded yet.</p></div>
              : months.filter(mo => filteredIncome.some(i => i.date.startsWith(mo))).map(mo => {
                  const entries = filteredIncome.filter(i => i.date.startsWith(mo)).sort((a, b) => b.date.localeCompare(a.date))
                  const total   = entries.reduce((s, i) => s + Number(i.amount), 0)
                  return (
                    <div key={mo} style={{ ...S.card, padding: 18, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f0ebe4' }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700 }}>{fmtMonth(mo)}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: '#2e7d32' }}>+{fmt(total)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {entries.map(i => {
                          const meta  = ANIMAL_META[i.species] || ANIMAL_META.sheep
                          const iType = INCOME_TYPES.find(t => t.value === i.income_type)?.label || 'Income'
                          return (
                            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: '#f1f8f1' }}>
                              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</p>
                                <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · {iType}{i.customer?.name ? ` · 👤 ${i.customer.name}` : ''} · {formatDate(i.date)}</p>
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 13, color: '#2e7d32', flexShrink: 0 }}>+{fmt(i.amount)}</span>
                              <button onClick={() => deleteIncome(i.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
          )}

          {/* Expenses tab */}
          {tab === 'expenses' && (
            filteredCosts.length === 0
              ? <div style={{ ...S.card, padding: 48, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No expenses recorded yet.</p></div>
              : months.filter(mo => filteredCosts.some(c => c.date.startsWith(mo))).map(mo => {
                  const entries = filteredCosts.filter(c => c.date.startsWith(mo)).sort((a, b) => b.date.localeCompare(a.date))
                  const total   = entries.reduce((s, c) => s + Number(c.amount), 0)
                  return (
                    <div key={mo} style={{ ...S.card, padding: 18, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f0ebe4' }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700 }}>{fmtMonth(mo)}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: '#c62828' }}>-{fmt(total)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {entries.map(c => {
                          const meta    = ANIMAL_META[c.species] || ANIMAL_META.sheep
                          const catMeta = EXPENSE_CATEGORIES.find(ec => ec.value === c.category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length-1]
                          return (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: catMeta.bg }}>
                              <span style={{ fontSize: 18 }}>{catMeta.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>
                                <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · <span style={{ color: catMeta.color, fontWeight: 600 }}>{catMeta.label}</span> · {formatDate(c.date)}</p>
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 13, color: '#c62828', flexShrink: 0 }}>-{fmt(c.amount)}</span>
                              <button onClick={() => deleteCost(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
          )}
        </>
      )}
    </div>
  )
}
