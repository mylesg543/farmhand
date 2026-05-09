import { useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, Spinner, ErrorMsg } from '../ui/shared'

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
  const isMobile   = useIsMobile()
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search,    setSearch]    = useState('')

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const handleAdd    = async (data) => { await addCustomer(data); setShowForm(false) }
  const handleUpdate = async (data) => { await updateCustomer(editingId, data); setEditingId(null) }
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? They will be removed from all sales.`)) return
    try { await deleteCustomer(id) } catch (err) { alert(err.message) }
  }

  return (
    <div style={{ ...S.page, padding: isMobile ? '16px 12px' : '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>👥 Customers</h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>Manage your buyers and tag them on sales</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditingId(null) }}
          style={{ ...S.btn, ...S.btnPrimary, marginLeft: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && <CustomerForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {/* Search */}
      <input style={{ ...S.input, marginBottom: 16 }} placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> :
        filtered.length === 0 ? (
          <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p style={{ color: '#a08060', fontSize: 15, marginBottom: 16 }}>
              {search ? 'No customers match your search.' : 'No customers yet. Add your first buyer!'}
            </p>
            {!search && <button onClick={() => setShowForm(true)} style={{ ...S.btn, ...S.btnPrimary }}>+ Add Customer</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => (
              <div key={c.id}>
                {editingId === c.id
                  ? <CustomerForm existing={c} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                  : (
                    <div style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Avatar */}
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#5a3e1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#f0e6cc', flexShrink: 0, fontFamily: "'Playfair Display',serif" }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>{c.name}</p>
                        <p style={{ fontSize: 12, color: '#a08060', margin: 0 }}>
                          {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                        </p>
                        {c.notes && <p style={{ fontSize: 12, color: '#7a6648', margin: '2px 0 0', fontStyle: 'italic' }}>{c.notes}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setEditingId(c.id)} style={{ ...S.btn, ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                        <button onClick={() => handleDelete(c.id, c.name)} style={{ ...S.btn, ...S.btnDanger, padding: '6px 12px', fontSize: 12 }}>Delete</button>
                      </div>
                    </div>
                  )
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
