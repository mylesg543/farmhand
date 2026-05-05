import { useState } from 'react'
import { useAllUsers, useAdminUserData } from '../hooks/useAdmin'
import { S, Spinner, ErrorMsg, ANIMAL_META, AnimalIllustration, fmt, formatDate, calcAge, getSexLabel } from '../components/ui/shared'

function StatPill({ label, value, color = '#5a3e1b' }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 16px', background: '#f7f4ef', borderRadius: 8 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#a08060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function UserFarmView({ user, onBack }) {
  const { animals, costs, income, plants, loading } = useAdminUserData(user.id)
  const [tab, setTab] = useState('animals')

  const totalSpent  = costs.reduce((s, c) => s + Number(c.amount), 0)
  const totalEarned = income.reduce((s, i) => s + Number(i.amount), 0)
  const netPnL      = totalEarned - totalSpent

  const animalsBySpecies = {}
  animals.forEach(a => { animalsBySpecies[a.species] = (animalsBySpecies[a.species] || []).concat(a) })

  if (loading) return <div style={S.page}><Spinner /></div>

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ ...S.btn, ...S.btnSecondary, padding: '7px 14px' }}>← All Farms</button>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, margin: '0 0 2px' }}>
            {user.farm_name || user.email?.split('@')[0] + "'s Farm"}
          </h1>
          <p style={{ fontSize: 13, color: '#a08060', margin: 0 }}>{user.email} · Member since {formatDate(user.created_at?.slice(0,10))}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#e8f5e9', color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            👁 Read Only
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatPill label="Animals"  value={animals.length} />
        <StatPill label="Plants"   value={plants.length}  />
        <StatPill label="Income"   value={`+${fmt(totalEarned)}`} color="#2e7d32" />
        <StatPill label="Expenses" value={`-${fmt(totalSpent)}`}  color="#c62828" />
        <StatPill label="Net P&L"  value={`${netPnL >= 0 ? '+' : ''}${fmt(netPnL)}`} color={netPnL >= 0 ? '#2e7d32' : '#c62828'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['animals','Animals'],['plants','Plants'],['costs','Expenses'],['income','Income']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ ...S.btn, padding: '7px 18px', fontSize: 13, background: tab === key ? '#5a3e1b' : '#fff', color: tab === key ? '#fff' : '#7a6648', border: '1px solid #d0c4b0' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Animals tab */}
      {tab === 'animals' && (
        animals.length === 0
          ? <div style={{ ...S.card, padding: 40, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No animals recorded.</p></div>
          : Object.entries(animalsBySpecies).map(([species, list]) => {
              const meta = ANIMAL_META[species] || ANIMAL_META.sheep
              return (
                <div key={species} style={{ marginBottom: 24 }}>
                  <p style={{ ...S.sectionLabel, marginBottom: 12 }}>{meta.emoji} {meta.label} ({list.length})</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {list.map(a => {
                      const statusColors = { alive: { bg: '#e8f5e9', text: '#2e7d32' }, sold: { bg: '#f3e5f5', text: '#6a1b9a' }, deceased: { bg: '#fafafa', text: '#616161' } }
                      const st = statusColors[a.status] || statusColors.alive
                      return (
                        <div key={a.id} style={{ ...S.card, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0ebe4', border: '2px solid #e8e0d0' }}>
                            <AnimalIllustration animal={a} size={48} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                              <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: st.bg, color: st.text, textTransform: 'uppercase', flexShrink: 0 }}>{a.status}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#a08060', margin: '0 0 3px', fontFamily: 'monospace' }}>{a.tag_number}</p>
                            <p style={{ fontSize: 11, color: '#7a6648', margin: 0 }}>
                              {getSexLabel(a.sex)}{a.breed ? ` · ${a.breed}` : ''}{a.birth_date ? ` · ${calcAge(a.birth_date)}` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
      )}

      {/* Plants tab */}
      {tab === 'plants' && (
        plants.length === 0
          ? <div style={{ ...S.card, padding: 40, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No plants recorded.</p></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {plants.map(p => (
                <div key={p.id} style={{ ...S.card, padding: 16 }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, margin: '0 0 3px' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: '#a08060', margin: '0 0 3px' }}>
                    {p.plant_category}{p.plant_subtype ? ` › ${p.plant_subtype}` : ''}{p.plant_subspecies ? ` › ${p.plant_subspecies}` : ''}
                  </p>
                  {p.location    && <p style={{ fontSize: 11, color: '#7a6648', margin: '0 0 2px' }}>📍 {p.location}</p>}
                  {p.planted_date && <p style={{ fontSize: 11, color: '#5a3e1b', fontWeight: 600, margin: 0 }}>{calcAge(p.planted_date)}</p>}
                </div>
              ))}
            </div>
      )}

      {/* Expenses tab */}
      {tab === 'costs' && (
        costs.length === 0
          ? <div style={{ ...S.card, padding: 40, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No expenses recorded.</p></div>
          : <div style={{ ...S.card, padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {costs.map(c => {
                  const meta = ANIMAL_META[c.species] || ANIMAL_META.sheep
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#fdfaf6' }}>
                      <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>
                        <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · {c.category || 'other'} · {formatDate(c.date)}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#c62828', flexShrink: 0 }}>-{fmt(c.amount)}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0ebe4', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 700, color: '#c62828' }}>Total: -{fmt(totalSpent)}</span>
              </div>
            </div>
      )}

      {/* Income tab */}
      {tab === 'income' && (
        income.length === 0
          ? <div style={{ ...S.card, padding: 40, textAlign: 'center' }}><p style={{ color: '#a08060' }}>No income recorded.</p></div>
          : <div style={{ ...S.card, padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {income.map(i => {
                  const meta = ANIMAL_META[i.species] || ANIMAL_META.sheep
                  return (
                    <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#f1f8f1' }}>
                      <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</p>
                        <p style={{ fontSize: 11, color: '#a08060', margin: 0 }}>{meta.label} · {i.income_type?.replace(/_/g,' ')} · {formatDate(i.date)}</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#2e7d32', flexShrink: 0 }}>+{fmt(i.amount)}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0ebe4', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 700, color: '#2e7d32' }}>Total: +{fmt(totalEarned)}</span>
              </div>
            </div>
      )}
    </div>
  )
}

export function AdminPage() {
  const { users, loading, error } = useAllUsers()
  const [selectedUser, setSelectedUser] = useState(null)

  if (selectedUser) return <UserFarmView user={selectedUser} onBack={() => setSelectedUser(null)} />

  const totalAnimals = 0
  const totalPlants  = 0

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, margin: 0 }}>Admin Portal</h1>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3e0', color: '#e65100', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔒 Private</span>
        </div>
        <p style={{ fontSize: 14, color: '#a08060', margin: 0 }}>Overview of all registered farms — read only</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatPill label="Total Farms" value={users.length} />
        <StatPill label="Active Today" value="—" />
        <StatPill label="Total Users" value={users.length} />
      </div>

      {/* Farm list */}
      {loading ? <Spinner /> : error ? <ErrorMsg message={error} /> : (
        users.length === 0 ? (
          <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
            <p style={{ color: '#a08060', fontSize: 15 }}>No users registered yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(u => (
              <div key={u.id} onClick={() => setSelectedUser(u)}
                style={{ ...S.card, padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.12s, box-shadow 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,36,22,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#5a3e1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#f0e6cc', flexShrink: 0, fontFamily: "'Playfair Display',serif" }}>
                  {u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.farm_name || u.email?.split('@')[0] + "'s Farm"}
                  </p>
                  <p style={{ fontSize: 12, color: '#a08060', margin: 0 }}>{u.email} · Joined {formatDate(u.created_at?.slice(0,10))}</p>
                </div>
                {u.is_admin && (
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#fff3e0', color: '#e65100', textTransform: 'uppercase', flexShrink: 0 }}>Admin</span>
                )}
                <span style={{ fontSize: 20, color: '#c8b89a' }}>→</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
