import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalAvatar, AnimalIllustration, STATUS_STYLES, calcAge, ANIMAL_META, animalEditPath, animalDetailPath, hasBreedingRestriction, DoNotBreedBadge } from '../ui/shared'

// ─── Build ancestor tree ───────────────────────────────────────────────────────
function buildTree(animalId, allAnimals, depth=4, visited=new Set()) {
  if (!animalId || depth===0 || visited.has(animalId)) return null
  visited.add(animalId)
  const animal = allAnimals.find(a=>a.id===animalId)
  if (!animal) return null
  return {
    animal,
    sire: buildTree(animal.sire_id, allAnimals, depth-1, new Set(visited)),
    dam:  buildTree(animal.dam_id,  allAnimals, depth-1, new Set(visited)),
  }
}

// ─── Inbreeding checker ────────────────────────────────────────────────────────
function collectIds(node, depth=3, ids=new Set()) {
  if (!node || depth===0) return ids
  if (node.animal) ids.add(node.animal.id)
  collectIds(node.sire, depth-1, ids)
  collectIds(node.dam,  depth-1, ids)
  return ids
}

function collectAnimals(node, animals=new Map()) {
  if (!node?.animal) return animals
  animals.set(node.animal.id, node.animal)
  collectAnimals(node.sire, animals)
  collectAnimals(node.dam, animals)
  return animals
}

// ─── Animal chip for selector ──────────────────────────────────────────────────
function WarningBadge({ compact=false, prominent=false }) {
  const size = prominent ? 24 : compact ? 16 : 18
  return (
    <span title="Shared ancestor warning" aria-label="Shared ancestor warning"
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:size, height:size, borderRadius:'50%',
        background:'#fff3e0', border:'1px solid #ffcc80', color:'#e65100',
        fontSize:prominent?15:compact?10:12, fontWeight:800, lineHeight:1, flexShrink:0,
        boxShadow:prominent?'0 1px 4px rgba(230,81,0,0.18)':'none' }}>
      ⚠
    </span>
  )
}

function BreedingWarningIcon({ compact=false, prominent=false, reason }) {
  const size = prominent ? 24 : compact ? 16 : 18
  return (
    <span title={reason ? `Do Not Breed: ${reason}` : 'Do Not Breed'}
      aria-label={reason ? `Do Not Breed: ${reason}` : 'Do Not Breed'}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:size, height:size, borderRadius:'50%',
        background:'#c62828', border:'1px solid #b71c1c', color:'#fff',
        fontSize:prominent?14:compact?10:12, fontWeight:800, lineHeight:1, flexShrink:0,
        boxShadow:prominent?'0 1px 4px rgba(198,40,40,0.24)':'none' }}>
      !
    </span>
  )
}

function AnimalChip({ a, selectedId, onSelect, hasLineageWarning=false }) {
  const isSel = a.id===selectedId
  const st    = STATUS_STYLES[a.status]||STATUS_STYLES.alive
  const hasBreedingWarning = hasBreedingRestriction(a)
  return (
    <button onClick={()=>onSelect(a.id)}
      style={{ display:'grid', gridTemplateColumns:'34px minmax(0, 1fr) auto', alignItems:'center', gap:9,
        width:'100%', minHeight:60, padding:'10px 11px', borderRadius:10, cursor:'pointer',
        border:isSel?'2px solid #c8a060':'1px solid #e8e0d0',
        background:isSel?'#fdfaf0':'#fff',
        boxShadow:isSel?'0 0 0 3px rgba(200,160,96,0.15)':'none',
        transition:'all 0.15s', fontFamily:"'Lato',sans-serif", textAlign:'left' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', flexShrink:0, background:'#f0ebe4' }}>
        <AnimalAvatar animal={a} size={32}/>
      </div>
      <div style={{ minWidth:0 }}>
        <p style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, margin:'0 0 1px', whiteSpace:'nowrap' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</span>
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
          <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:6, background:st.bg, color:st.text, textTransform:'uppercase' }}>{a.status}</span>
          {hasBreedingRestriction(a) && <DoNotBreedBadge compact reason={a.breeding_restriction_reason}/>}
        </div>
      </div>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'flex-end',
        gap:4, minWidth:18, justifySelf:'end' }}>
        {hasBreedingWarning && <BreedingWarningIcon prominent reason={a.breeding_restriction_reason}/>}
        {hasLineageWarning && <WarningBadge prominent />}
        {!hasBreedingWarning && !hasLineageWarning && (
          <span style={{ color:isSel?'#c8a060':'#d8ccb8', fontSize:14 }}>{isSel ? '✓' : '›'}</span>
        )}
      </span>
    </button>
  )
}

// ─── Node card ─────────────────────────────────────────────────────────────────
function NodeCard({ animal, isRoot=false, size, onClick, hasWarning=false }) {
  if (!animal) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:0.3 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', border:'2px dashed #c8b89a', background:'#f7f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>?</div>
      <span style={{ fontSize:8, color:'#a08060', fontStyle:'italic' }}>Unknown</span>
    </div>
  )
  const st = STATUS_STYLES[animal.status]||STATUS_STYLES.alive
  const sb = animal.sex==='ram'||animal.sex==='rooster' ? '#5d4037' : animal.sex==='ewe'||animal.sex==='hen' ? '#a1887f' : '#d7ccc8'
  return (
    <div onClick={()=>onClick&&onClick(animal)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:onClick?'pointer':'default', transition:'transform 0.15s' }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform='scale(1.05)' }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='' }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', background:'#f0ebe4',
          border: isRoot ? '3px solid #c8a060' : '2px solid #e8e0d0',
          boxShadow: isRoot ? '0 0 0 4px rgba(200,160,96,0.2)' : 'none',
          filter: animal.status==='deceased'?'grayscale(0.6)':'none',
          opacity: animal.status==='deceased'?0.75:1 }}>
          <AnimalAvatar animal={animal} size={size}/>
        </div>
        <div style={{ width:9, height:9, borderRadius:'50%', background:sb, position:'absolute', bottom:1, right:1, border:'2px solid #fff' }}/>
        {hasWarning && (
          <span style={{ position:'absolute', top:-5, right:-7 }}>
            <WarningBadge compact={size < 50}/>
          </span>
        )}
        {hasBreedingRestriction(animal) && (
          <span style={{ position:'absolute', top:-5, left:-7 }}>
            <BreedingWarningIcon compact={size < 50} reason={animal.breeding_restriction_reason}/>
          </span>
        )}
      </div>
      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isRoot?13:10, margin:0,
        whiteSpace:'nowrap', maxWidth:isRoot?100:80, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
        {animal.name}
      </p>
      {animal.breed && (
        <p style={{ fontSize:8, color:'#a08060', margin:0, whiteSpace:'nowrap', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
          {animal.breed}
        </p>
      )}
      <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:5,
        background:st.bg, color:st.text, textTransform:'uppercase' }}>
        {animal.status}
      </span>
    </div>
  )
}

// ─── Horizontal pedigree — top=great-grandparents, bottom=animal ───────────────
// Icons sit ABOVE their connecting lines - each avatar floats over its branch
function PedigreeChart({ root, isMobile, onAnimalClick, warningIds=new Set() }) {
  const nodeSize = isMobile ? 38 : 52
  const rootSize = isMobile ? 52 : 66
  const gapX     = isMobile ? 4  : 8
  const connH    = isMobile ? 28 : 40  // height of connector zone between rows

  function getRow(node, depth, maxDepth) {
    if (depth===maxDepth) return [node?.animal||null]
    if (!node) return Array(Math.pow(2, maxDepth-depth)).fill(null)
    return [...getRow(node.sire, depth+1, maxDepth), ...getRow(node.dam, depth+1, maxDepth)]
  }

  const rows = [
    { label:'Great-Grandparents', nodes: getRow(root, 0, 3) }, // 8
    { label:'Grandparents',       nodes: getRow(root, 0, 2) }, // 4
    { label:'Parents',            nodes: getRow(root, 0, 1) }, // 2
    { label:'Animal',             nodes: [root.animal] },       // 1
  ]

  const totalW = 8 * nodeSize + 7 * gapX
  const minW   = Math.max(totalW, isMobile ? 320 : 480)

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      <div style={{ minWidth:minW, padding:'0 4px' }}>
        {rows.map((row, rowIdx) => {
          const count   = row.nodes.length
          const isRoot  = rowIdx === 3
          const sz      = isRoot ? rootSize : nodeSize
          const slotW   = totalW / count
          // Next row info for drawing connectors below this row
          const nextRow      = rows[rowIdx + 1]
          const nextCount    = nextRow?.nodes.length || 0
          const nextSlotW    = nextCount ? totalW / nextCount : 0

          return (
            <div key={rowIdx}>
              {/* Row label */}
              <div style={{ display:'flex', alignItems:'center', gap:8,
                marginBottom:6, marginTop:rowIdx===0 ? 0 : 2 }}>
                <span style={{ fontSize:isMobile?8:10, fontWeight:700, color:'#a08060',
                  textTransform:'uppercase', letterSpacing:'0.07em',
                  background:'#f7f4ef', padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                  {row.label}
                </span>
                <div style={{ flex:1, height:1, background:'#f0ebe4' }}/>
              </div>

              {/* ── NODE ROW — icons sit here, above their lines ── */}
              <div style={{ display:'flex', width:'100%', marginBottom:0 }}>
                {row.nodes.map((animal, ni) => (
                  <div key={ni} style={{ flex:1, display:'flex', justifyContent:'center',
                    padding:`0 ${gapX/2}px` }}>
                    <NodeCard
                      animal={animal}
                      isRoot={isRoot}
                      size={sz}
                      onClick={animal ? onAnimalClick : null}
                      hasWarning={animal ? warningIds.has(animal.id) : false}
                    />
                  </div>
                ))}
              </div>

              {/* ── CONNECTOR SVG — lines drop DOWN from each node to converge below ── */}
              {rowIdx < 3 && (
                <svg
                  width="100%"
                  viewBox={`0 0 ${totalW} ${connH}`}
                  style={{ display:'block', marginBottom:4 }}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {nextRow.nodes.map((_, childIdx) => {
                    // The two parent slots that converge to this child
                    const par0X  = slotW  * (childIdx * 2)     + slotW  / 2
                    const par1X  = slotW  * (childIdx * 2 + 1) + slotW  / 2
                    const midX   = (par0X + par1X) / 2
                    const childX = nextSlotW * childIdx + nextSlotW / 2
                    const juncY  = connH * 0.55  // junction point — horizontal bar

                    return (
                      <g key={childIdx}>
                        {/* Drop lines down from each parent */}
                        <line x1={par0X} y1={0}     x2={par0X} y2={juncY} stroke="#d0c4b0" strokeWidth={1.5}/>
                        <line x1={par1X} y1={0}     x2={par1X} y2={juncY} stroke="#d0c4b0" strokeWidth={1.5}/>
                        {/* Horizontal bar connecting the two */}
                        <line x1={par0X} y1={juncY} x2={par1X} y2={juncY} stroke="#d0c4b0" strokeWidth={1.5}/>
                        {/* Single line down from midpoint to child */}
                        <line x1={midX}  y1={juncY} x2={childX} y2={connH} stroke="#d0c4b0" strokeWidth={1.5}/>
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Lineage Page ─────────────────────────────────────────────────────────
export function LineagePage() {
  const isMobile  = useIsMobile()
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const [species,    setSpecies]    = useState(searchParams.get('species') || 'sheep')
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || null)
  const [search,     setSearch]     = useState('')
  const [lineageFilter, setLineageFilter] = useState('all')

  const { animals, loading } = useAnimals(species)

  // When species changes, clear selection
  const handleSpecies = (s) => { setSpecies(s); setSelectedId(null); setSearch(''); setLineageFilter('all') }

  useEffect(() => {
    const id = searchParams.get('id')
    const sp = searchParams.get('species')
    if (sp) setSpecies(sp)
    if (id) setSelectedId(id)
  }, [searchParams])

  const tree     = selectedId ? buildTree(selectedId, animals, 4) : null
  const selected = selectedId ? animals.find(a=>a.id===selectedId) : null
  const hasLineage = selected && (selected.sire_id || selected.dam_id)

  // Inbreeding check
  const sharedAncestors = tree ? (() => {
    const sireIds = collectIds(tree.sire)
    const damIds  = collectIds(tree.dam)
    return [...sireIds].filter(id=>damIds.has(id)).map(id=>animals.find(a=>a.id===id)).filter(Boolean)
  })() : []
  const sharedAncestorIds = new Set(sharedAncestors.map(a=>a.id))
  const restrictedTreeAnimals = tree
    ? [...collectAnimals(tree).values()].filter(hasBreedingRestriction)
    : []
  const animalsWithSharedAncestorWarnings = new Set(animals
    .filter(a => {
      const t = buildTree(a.id, animals, 4)
      if (!t?.sire || !t?.dam) return false
      const sireIds = collectIds(t.sire)
      const damIds  = collectIds(t.dam)
      return [...sireIds].some(id => damIds.has(id))
    })
    .map(a => a.id))
  const animalsWithWarnings = new Set([
    ...animalsWithSharedAncestorWarnings,
    ...animals.filter(hasBreedingRestriction).map(a => a.id),
  ])
  const hasRecordedLineage = (a) => Boolean(a.sire_id || a.dam_id)
  const searchFiltered = animals.filter(a => !search || (a.name||'').toLowerCase().includes(search.toLowerCase()))
  const filterOptions = [
    { key:'all', label:'All', count:animals.length },
    { key:'warnings', label:'Warnings', count:animalsWithWarnings.size },
    { key:'with_lineage', label:'With lineage', count:animals.filter(hasRecordedLineage).length },
    { key:'missing', label:'Missing parents', count:animals.filter(a => !hasRecordedLineage(a)).length },
  ]
  const filtered = searchFiltered.filter(a => {
    if (lineageFilter === 'warnings') return animalsWithWarnings.has(a.id)
    if (lineageFilter === 'with_lineage') return hasRecordedLineage(a)
    if (lineageFilter === 'missing') return !hasRecordedLineage(a)
    return true
  })

  const meta   = ANIMAL_META[species] || ANIMAL_META.sheep
  const emoji  = meta.emoji

  return (
    <div style={{ ...S.page, padding:isMobile?'14px 12px':'32px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:32, fontWeight:700, margin:'0 0 4px' }}>
            🌳 Lineage & Bloodlines
          </h1>
          <p style={{ fontSize:13, color:'#a08060', margin:0 }}>
            4-generation family tree · Great-grandparents at top, your animal at bottom
          </p>
        </div>
        {/* Species toggle */}
        <div style={{ display:'flex', background:'#f0e8d8', borderRadius:10, padding:3, gap:2,
          width:isMobile?'100%':undefined }}>
          {[['sheep','🐑 Sheep'],['chickens','🐔 Chickens'],['horses','🐴 Horses']].map(([k,l])=>(
            <button key={k} onClick={()=>handleSpecies(k)}
              style={{ ...S.btn, padding:isMobile?'7px 5px':'6px 14px', fontSize:isMobile?11:13,
                flex:isMobile?1:undefined, justifyContent:'center', borderRadius:8,
                background:species===k?'#5a3e1b':'transparent',
                color:species===k?'#fff':'#7a6648', border:'none', transition:'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Why this matters - sheep only since inbreeding is the main concern */}
      {!selectedId && !loading && animals.length>0 && (
        <div style={{ ...S.card, padding:isMobile?'14px 16px':'16px 20px', marginBottom:20, background:'#fdfaf0', border:'1px solid #e8d8a0', display:'flex', gap:14, alignItems:'flex-start' }}>
          <span style={{ fontSize:22, flexShrink:0 }}>💡</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#5a3e1b', margin:'0 0 3px' }}>Why track bloodlines?</p>
            <p style={{ fontSize:13, color:'#7a6648', margin:0, lineHeight:1.55 }}>
              {species==='sheep'
                ? 'Before breeding season, check here to make sure your ram and ewe don\'t share a grandparent. Accidental inbreeding weakens fleece, reduces lamb survival, and builds genetic defects over generations.'
                : species==='horses'
                  ? 'Track sire and dam lines, avoid risky close crosses, and keep pedigrees clear.'
                  : 'Record the rooster (sire) for each batch of chicks and FarmHand builds the family tree automatically. Useful for tracking bloodlines across breeding flocks.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Selector */}
      <div style={{ ...S.card, padding:isMobile?14:22, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={S.sectionLabel}>Select an Animal</span>
            {!loading && (
              <span style={{ fontSize:11, fontWeight:800, color:'#a08060', background:'#f7f4ef',
                border:'1px solid #e8e0d0', borderRadius:999, padding:'3px 8px' }}>
                {filtered.length} shown
              </span>
            )}
          </div>
          {selectedId && (
            <button onClick={()=>setSelectedId(null)} style={{ ...S.btn, ...S.btnSecondary, padding:'5px 12px', fontSize:12 }}>✕ Clear</button>
          )}
        </div>
        <input style={{ ...S.input, marginBottom:14 }} placeholder="Search by name…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        {!loading && (
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:14 }}>
            {filterOptions.map(opt => {
              const active = lineageFilter === opt.key
              const disabled = opt.key !== 'all' && opt.count === 0
              return (
                <button key={opt.key} onClick={()=>!disabled && setLineageFilter(opt.key)}
                  disabled={disabled}
                  style={{ ...S.btn, borderRadius:999, padding:isMobile?'6px 9px':'7px 11px',
                    fontSize:isMobile?11:12, fontWeight:800,
                    background:active?'#5a3e1b':'#fff', color:active?'#fff':disabled?'#c8b89a':'#5a3e1b',
                    border:active?'1px solid #5a3e1b':'1px solid #e8e0d0',
                    opacity:disabled?0.55:1, cursor:disabled?'default':'pointer' }}>
                  {opt.label} <span style={{ color:active?'#f0e6cc':'#a08060', marginLeft:3 }}>{opt.count}</span>
                </button>
              )
            })}
          </div>
        )}
        {loading
          ? <p style={{ color:'#a08060', fontSize:13 }}>Loading your flock…</p>
          : filtered.length === 0 ? (
            <div style={{ background:'#fdfaf6', border:'1px dashed #d8ccb8', borderRadius:10,
              padding:isMobile?'18px 14px':'22px', textAlign:'center' }}>
              <p style={{ fontSize:14, fontWeight:800, color:'#5a3e1b', margin:'0 0 5px' }}>No animals match this view.</p>
              <p style={{ fontSize:12, color:'#a08060', margin:'0 0 12px' }}>Clear the search or switch the lineage filter.</p>
              <button onClick={()=>{ setSearch(''); setLineageFilter('all') }}
                style={{ ...S.btn, ...S.btnSecondary, padding:'7px 14px', fontSize:12 }}>
                Show all animals
              </button>
            </div>
          ) : <div style={{ display:'grid',
              gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill, minmax(190px, 1fr))',
              gap:isMobile?8:10, alignItems:'stretch' }}>
              {filtered.map(a=><AnimalChip key={a.id} a={a} selectedId={selectedId}
                onSelect={setSelectedId} hasLineageWarning={animalsWithSharedAncestorWarnings.has(a.id)}/>)}
            </div>
        }
      </div>

      {!selectedId && (
        <div style={{ ...S.card, padding:isMobile?'28px 18px':60, textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>{emoji}</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, marginBottom:8 }}>
            Select {species==='sheep'?'a sheep':species==='horses'?'a horse':'a chicken'} to see their family tree
          </p>
          <p style={{ fontSize:14, color:'#a08060', maxWidth:360, margin:'0 auto' }}>
            Build the tree over time by recording sires and dams when animals are born.
          </p>
        </div>
      )}

      {selectedId && !hasLineage && (
        <div style={{ ...S.card, padding:isMobile?'26px 18px':48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>{emoji}</div>
          {hasBreedingRestriction(selected) && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
              gap:7, flexWrap:'wrap', marginBottom:12 }}>
              <BreedingWarningIcon reason={selected?.breeding_restriction_reason}/>
              <DoNotBreedBadge reason={selected?.breeding_restriction_reason}/>
              {selected?.breeding_restriction_reason && (
                <span style={{ fontSize:12, color:'#a51d1d', fontWeight:700 }}>
                  {selected.breeding_restriction_reason}
                </span>
              )}
            </div>
          )}
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:8 }}>No lineage recorded for {selected?.name}</p>
          <p style={{ fontSize:14, color:'#a08060', marginBottom:20 }}>Edit this animal and select a Sire and Dam to start building their tree.</p>
          <button onClick={()=>navigate(animalEditPath(species, selectedId))} style={{ ...S.btn, ...S.btnPrimary, padding:'10px 24px' }}>
            ✎ Edit {selected?.name} — Add Parents
          </button>
        </div>
      )}

      {/* Pedigree chart */}
      {tree && selected && hasLineage && (
        <div style={{ ...S.card, padding:isMobile?14:28 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid #f0ebe4', flexWrap:'wrap', gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', border:'2px solid #c8a060', background:'#f0ebe4', flexShrink:0 }}>
              <AnimalIllustration animal={selected} size={44}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:2 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isMobile?17:20, margin:0 }}>{selected.name}'s Family Tree</p>
                {hasBreedingRestriction(selected) && (
                  <>
                    <BreedingWarningIcon reason={selected.breeding_restriction_reason}/>
                    <DoNotBreedBadge compact reason={selected.breeding_restriction_reason}/>
                  </>
                )}
              </div>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>
                {selected.breed||'Unknown breed'} · {calcAge(selected.birth_date)||'Unknown age'} · Tap an animal to view their profile
              </p>
            </div>
            <button onClick={()=>navigate(animalDetailPath(species, selectedId))} style={{ ...S.btn, ...S.btnSecondary, padding:'7px 14px', fontSize:13, flexShrink:0 }}>
              View Profile →
            </button>
          </div>

          <PedigreeChart
            root={tree}
            isMobile={isMobile}
            onAnimalClick={(animal)=>navigate(animalDetailPath(animal.species || species, animal.id))}
            warningIds={sharedAncestorIds}
          />

          {/* Inbreeding result */}
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
            {restrictedTreeAnimals.length > 0 && (
              <div style={{ background:'#fff3f3', border:'1px solid #ef9a9a', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <BreedingWarningIcon />
                  <div>
                    <p style={{ fontSize:13, color:'#a51d1d', fontWeight:800, margin:'0 0 4px' }}>
                      Do Not Breed warning in this family tree
                    </p>
                    <p style={{ fontSize:12, color:'#7a3030', margin:'0 0 7px' }}>
                      Review these active restrictions before making any breeding decision.
                    </p>
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                      {restrictedTreeAnimals.map(a => (
                        <button key={a.id} onClick={()=>navigate(animalDetailPath(a.species || species, a.id))}
                          style={{ ...S.btn, padding:'4px 8px', fontSize:11, fontWeight:800,
                            background:'#fff', color:'#a51d1d', border:'1px solid #ef9a9a' }}>
                          {a.name}{a.breeding_restriction_reason ? ` · ${a.breeding_restriction_reason}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sharedAncestors.length===0 ? (
              <div style={{ background:'#f1f8f1', border:'1px solid #a5d6a7', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:18 }}>✓</span>
                <p style={{ fontSize:13, color:'#2e7d32', fontWeight:600, margin:0 }}>
                  No shared ancestors detected in the recorded lineage.
                </p>
              </div>
            ) : (
              <div style={{ background:'#fff3f3', border:'1px solid #f5c6c6', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize:13, color:'#c62828', fontWeight:700, margin:'0 0 4px' }}>Shared ancestor detected</p>
                    <p style={{ fontSize:13, color:'#7a3030', margin:'0 0 6px' }}>These animals appear on both sides of the tree:</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {sharedAncestors.map(a=>(
                        <span key={a.id} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:8, background:'#fff3f3', border:'1px solid #f5c6c6', color:'#c62828' }}>
                          <WarningBadge compact />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f0ebe4', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#a08060', fontWeight:700 }}>Sex dot:</span>
            {[['#5d4037','Ram'],['#a1887f','Ewe'],['#d7ccc8','Wether/Neuter']].map(([c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/>
                <span style={{ fontSize:11, color:'#7a6648' }}>{l}</span>
              </div>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, opacity:0.5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', border:'1px dashed #c8b89a', background:'#f7f4ef' }}/>
              <span style={{ fontSize:11, color:'#a08060' }}>Unknown</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
