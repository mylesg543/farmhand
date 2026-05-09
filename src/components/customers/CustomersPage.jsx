import { useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { useIncome } from '../../hooks/useIncome'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, Spinner, ErrorMsg, fmt } from '../ui/shared'

function CustomerForm({ existing, onSave, onCancel }) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({
    name:  existing?.name  || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    notes: existing?.notes || '',
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try { await onSave(form); }
    catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <div style={{ ...S.card, padding: 22, marginBottom: 16, border: '1px dashed #c8b89a', background: '#fdfaf6' }}>
      <span style={S.sectionLabel}>{existing ? 'Edit Customer' : 'New Customer'}</span>
      {error && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={S.label}>Name *</label>
          <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Smith" autoFocus />
        </div>
        <div>
          <label style={S.label}>Phone</label>
          <input style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label style={S.label}>Email</label>
          <input type="email" style={S.input} value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label style={S.label}>Notes</label>
          <input style={S.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Buys eggs weekly" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btn, ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Customer'}
        </button>
        <button onClick={onCancel} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
      </div>
    </div>
  )
}

export function CustomersPage() {
  const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const { income } = useIncome()
  const isMobile   = useIsMobile()
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search,    setSearch]    = useState('')

  // Build per-customer summary from income data
  const customerStats = {}
  income.forEach(i => {
    if (!i.customer_id) return
    if (!customerStats[i.customer_id]) {
      customerStats[i.customer_id] = { totalSpent: 0, eggDozens: 0, transactions: 0 }
    }
    customerStats[i.customer_id].totalSpent    += Number(i.amount)
    customerStats[i.customer_id].transactions  += 1
    if (i.income_type === 'sale_eggs' && i.quantity) {
      customerStats[i.customer_id].eggDozens += Number(i.quantity)
    }
  })

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  // Sort by total spent descending
  const sorted = [...filtered].sort((a, b) => (customerStats[b.id]?.totalSpent || 0) - (customerStats[a.id]?.totalSpent || 0))

  const handleAdd    = async (data) => { await addCustomer(data); setShowForm(false) }
  const handleUpdate = async (data) => { await updateCustomer(editingId, data); setEditingId(null) }
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? They will be removed from all sales.`)) return
    try { await deleteCustomer(id) } catch (err) { alert(err.message) }
  }

  const totalRevenue = Object.values(customerStats).reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div style={{ ...S.page, padding: isMobile ? '16px 12px' : '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: '0 0 4px' }}>👥 Customers</h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>
            {customers.length} customers · {fmt(totalRevenue)} total revenue
          </p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditingId(null) }}
          style={{ ...S.btn, ...S.btnPrimary, marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && <CustomerForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {/* Search */}
      <input style={{ ...S.input, marginBottom: 16 }} placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
        sorted.length === 0 ? (
          <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p style={{ color: '#a08060', fontSize: 15, marginBottom: 16 }}>
              {search ? 'No customers match your search.' : 'No customers yet. Add your first buyer!'}
            </p>
            {!search && <button onClick={() => setShowForm(true)} style={{ ...S.btn, ...S.btnPrimary }}>+ Add Customer</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(c => {
              const stats = customerStats[c.id] || { totalSpent: 0, eggDozens: 0, transactions: 0 }
              return (
                <div key={c.id}>
                  {editingId === c.id
                    ? <CustomerForm existing={c} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                    : (
                      <div style={{ ...S.card, padding: isMobile ? '14px 14px' : '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Avatar */}
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#5a3e1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#f0e6cc', flexShrink: 0, fontFamily: "'Playfair Display',serif" }}>
                            {c.name[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>{c.name}</p>
                            <p style={{ fontSize: 12, color: '#a08060', margin: 0 }}>
                              {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                            </p>
                            {c.notes && <p style={{ fontSize: 11, color: '#7a6648', margin: '2px 0 0', fontStyle: 'italic' }}>{c.notes}</p>}
                          </div>
                          {!isMobile && (
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => setEditingId(c.id)} style={{ ...S.btn, ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                              <button onClick={() => handleDelete(c.id, c.name)} style={{ ...S.btn, ...S.btnDanger, padding: '6px 12px', fontSize: 12 }}>Delete</button>
                            </div>
                          )}
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          <div style={{ background: '#f1f8f1', borderRadius: 8, padding: '8px 14px', textAlign: 'center', flex: 1, minWidth: 80 }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32', margin: 0, fontFamily: "'Playfair Display',serif" }}>{fmt(stats.totalSpent)}</p>
                            <p style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0' }}>Total Spent</p>
                          </div>
                          {stats.eggDozens > 0 && (
                            <div style={{ background: '#fff9e6', borderRadius: 8, padding: '8px 14px', textAlign: 'center', flex: 1, minWidth: 80 }}>
                              <p style={{ fontSize: 16, fontWeight: 700, color: '#f57f17', margin: 0, fontFamily: "'Playfair Display',serif" }}>{stats.eggDozens}</p>
                              <p style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0' }}>Dozens of Eggs</p>
                            </div>
                          )}
                          <div style={{ background: '#f7f4ef', borderRadius: 8, padding: '8px 14px', textAlign: 'center', flex: 1, minWidth: 80 }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#5a3e1b', margin: 0, fontFamily: "'Playfair Display',serif" }}>{stats.transactions}</p>
                            <p style={{ fontSize: 10, color: '#a08060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0' }}>Transactions</p>
                          </div>
                        </div>

                        {/* Mobile edit/delete */}
                        {isMobile && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={() => setEditingId(c.id)} style={{ ...S.btn, ...S.btnSecondary, flex: 1, justifyContent: 'center', padding: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(c.id, c.name)} style={{ ...S.btn, ...S.btnDanger, flex: 1, justifyContent: 'center', padding: '8px' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    )
                  }
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
