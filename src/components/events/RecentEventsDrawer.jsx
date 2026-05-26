import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { S, AnimalAvatar, ANIMAL_META, animalDetailPath, formatDate, getEventMeta, getEventTypes } from '../ui/shared'

export function RecentEventsDrawer({ open, onClose, events, loading, error, animals, isMobile, initialAnimalId = 'all' }) {
  const navigate = useNavigate()
  const [animalFilter, setAnimalFilter] = useState(initialAnimalId)
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [rangeFilter, setRangeFilter] = useState('30')

  useEffect(() => {
    if (open) setAnimalFilter(initialAnimalId)
  }, [open, initialAnimalId])

  if (!open) return null

  const eventTypes = [...new Map(animals.flatMap(a => getEventTypes(a.species)).map(t => [t.value, t])).values()]
    .sort((a, b) => a.label.localeCompare(b.label))
  const cutoff = rangeFilter === 'all' ? null : new Date(Date.now() - Number(rangeFilter) * 24 * 60 * 60 * 1000)
  const filteredEvents = events.filter(ev => {
    if (animalFilter !== 'all' && ev.animal_id !== animalFilter) return false
    if (eventTypeFilter !== 'all' && ev.event_type !== eventTypeFilter) return false
    if (cutoff) {
      const rawDate = ev.event_date || ev.created_at || ''
      const eventDate = new Date(rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      if (Number.isNaN(eventDate.getTime()) || eventDate < cutoff) return false
    }
    return true
  })

  const openAnimal = (animal) => {
    if (!animal) return
    onClose()
    navigate(animalDetailPath(animal.species, animal.id))
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:5000, background:'rgba(44,36,22,0.42)', display:'flex', justifyContent:isMobile?'stretch':'flex-end', alignItems:'stretch' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0 }} />
      <div style={{ position:'relative', width:isMobile?'100%':560, maxWidth:'100%', background:'#f7f4ef', boxShadow:'-12px 0 36px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:isMobile?'16px 14px':'20px 22px', background:'#2c2416', color:'#f0e6cc', display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:24, fontWeight:700, margin:'0 0 4px' }}>Recent Events</p>
            <p style={{ fontSize:13, color:'#c8a878', margin:0, lineHeight:1.45 }}>Review recent health, care, breeding, and management activity across your animals.</p>
          </div>
          <button onClick={onClose} aria-label="Close recent events" style={{ background:'rgba(255,255,255,0.1)', color:'#f0e6cc', border:'1px solid rgba(255,255,255,0.18)', borderRadius:8, width:38, height:38, cursor:'pointer', fontSize:20, lineHeight:1 }}>x</button>
        </div>
        <div style={{ padding:isMobile?'12px 12px 8px':'14px 18px 10px', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 120px', gap:8, borderBottom:'1px solid #e8e0d0', background:'#fff' }}>
          <select value={animalFilter} onChange={e=>setAnimalFilter(e.target.value)} style={S.input}>
            <option value="all">All animals</option>
            {animals.map(a => {
              const meta = ANIMAL_META[a.species] || ANIMAL_META.sheep
              return <option key={a.id} value={a.id}>{meta.singular}: {a.name}</option>
            })}
          </select>
          <select value={eventTypeFilter} onChange={e=>setEventTypeFilter(e.target.value)} style={S.input}>
            <option value="all">All event types</option>
            {eventTypes.map(t => {
              const meta = getEventMeta(t.value, t.label)
              return <option key={t.value} value={t.value}>{meta.icon} {meta.label}</option>
            })}
          </select>
          <select value={rangeFilter} onChange={e=>setRangeFilter(e.target.value)} style={S.input}>
            <option value="7">Last 7d</option>
            <option value="30">Last 30d</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?12:18 }}>
          {loading ? (
            <p style={{ color:'#a08060', fontSize:14, textAlign:'center', padding:'36px 0' }}>Loading events...</p>
          ) : error ? (
            <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', color:'#c62828', borderRadius:10, padding:14, fontSize:13 }}>{error}</div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ ...S.card, padding:isMobile?24:40, textAlign:'center' }}>
              <div style={{ fontSize:38, marginBottom:10 }}>📋</div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, margin:'0 0 6px' }}>No recent events yet.</p>
              <p style={{ fontSize:13, color:'#a08060', margin:0 }}>Add events to start building your farm history.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filteredEvents.map(ev => {
                const animal = ev.animal
                const speciesMeta = ANIMAL_META[animal?.species] || ANIMAL_META.sheep
                const eventMeta = getEventMeta(ev.event_type)
                return (
                  <button key={ev.id} onClick={() => openAnimal(animal)}
                    style={{ ...S.card, padding:isMobile?'12px':'13px 14px', display:'grid', gridTemplateColumns:'42px minmax(0, 1fr) auto', gap:12, alignItems:'center', textAlign:'left', cursor:animal?'pointer':'default', fontFamily:"'Lato',sans-serif" }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', background:'#f0ebe4' }}>
                      <AnimalAvatar animal={animal || { species:'sheep', name:'Animal' }} size={42}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:2 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:eventMeta.color }}>{eventMeta.icon} {eventMeta.label}</span>
                        <span style={{ fontSize:10, fontWeight:800, color:'#7a6648', background:speciesMeta.light, border:`1px solid ${speciesMeta.color}22`, borderRadius:999, padding:'2px 7px' }}>{speciesMeta.singular}</span>
                      </div>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, margin:'0 0 2px', color:'#2c2416' }}>{animal?.name || 'Unknown animal'}</p>
                      {ev.notes && <p style={{ fontSize:12, color:'#7a6648', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.notes}</p>}
                    </div>
                    <span style={{ fontSize:11, color:'#a08060', whiteSpace:'nowrap' }}>{formatDate((ev.event_date || ev.created_at || '').slice(0,10))}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
