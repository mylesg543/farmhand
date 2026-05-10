import { useState } from 'react'
import { useAnimals } from '../../hooks/useAnimals'
import { useIsMobile } from '../../hooks/useIsMobile'
import { S, AnimalIllustration, STATUS_STYLES, calcAge } from '../ui/shared'

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

function AnimalNode({ animal, isRoot=false, isMobile, onClick }) {
  const [err, setErr] = useState(false)
  const st   = STATUS_STYLES[animal.status] || STATUS_STYLES.alive
  const size = isRoot ? (isMobile?56:72) : (isMobile?40:52)
  return (
    <div onClick={()=>onClick&&onClick(animal)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:onClick?'pointer':'default', maxWidth:isMobile?88:108 }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='' }}>
      <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:isRoot?'3px solid #c8a060':'2px solid #e8e0d0', background:'#f0ebe4', boxShadow:isRoot?'0 0 0 4px rgba(200,160,96,0.2)':'none' }}>
        {animal.photo_url && !err
          ? <img src={animal.photo_url} alt={animal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=>setErr(true)}/>
          : <AnimalIllustration animal={animal} size={size}/>
        }
      </div>
      <div style={{ textAlign:'center', maxWidth:'100%' }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:isRoot?(isMobile?13:15):(isMobile?11:13), margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{animal.name}</p>
        {animal.breed && <p style={{ fontSize:isMobile?9:10, color:'#a08060', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{animal.breed}</p>}
        <span style={{ fontSize:isMobile?9:10, fontWeight:700, padding:'1px 6px', borderRadius:8, background:st.bg, color:st.text, textTransform:'uppercase' }}>{animal.status}</span>
      </div>
    </div>
  )
}

function UnknownNode({ isMobile }) {
  const size = isMobile?40:52
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, maxWidth:isMobile?88:108, opacity:0.4 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', border:'2px dashed #c8b89a', background:'#f7f4ef', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:isMobile?16:20 }}>?</span>
      </div>
      <p style={{ fontSize:isMobile?9:10, color:'#a08060', margin:0, fontStyle:'italic' }}>Unknown</p>
    </div>
  )
}

function PedigreeChart({ root, isMobile, onAnimalClick }) {
  const nodeW  = isMobile?80:100
  const nodeH  = isMobile?100:122
  const gapY   = isMobile?14:20

  function getRow(node, depth, maxDepth) {
    if (depth===maxDepth) return [node?.animal||null]
    return [...getRow(node?.sire||null, depth+1, maxDepth), ...getRow(node?.dam||null, depth+1, maxDepth)]
  }

  // 4 columns: great-grandparents (8 slots) → grandparents (4) → parents (2) → root (1)
  const gens   = [3,2,1,0].map(g=>getRow(root,0,g))
  const totalR = 8
  const rowH   = nodeH + gapY
  const colW   = nodeW + (isMobile?10:18)
  const svgW   = 4*colW
  const svgH   = totalR * rowH

  function getY(slotIdx, totalSlots) {
    const step = totalR / totalSlots
    return (slotIdx + 0.5) * step * rowH - nodeH/2
  }

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:8 }}>
      <div style={{ position:'relative', width:svgW, height:svgH, minWidth:svgW }}>
        <svg style={{ position:'absolute', inset:0, pointerEvents:'none' }} width={svgW} height={svgH}>
          {gens.slice(0,3).map((genNodes, gi) => {
            const nextGen = gens[gi+1]
            return genNodes.map((_, ni) => {
              if (ni%2!==0) return null
              const parentIdx = Math.floor(ni/2)
              const thisX  = gi*colW + nodeW/2
              const nextX  = (gi+1)*colW + nodeW/2
              const y1     = getY(ni,   genNodes.length) + nodeH/2
              const y2     = getY(ni+1, genNodes.length) + nodeH/2
              const nextY  = getY(parentIdx, nextGen.length) + nodeH/2
              const midX   = thisX + (nextX-thisX)/2
              return (
                <g key={`${gi}-${ni}`}>
                  <line x1={thisX} y1={y1} x2={thisX} y2={y2} stroke="#d0c4b0" strokeWidth={1.5}/>
                  <line x1={thisX} y1={(y1+y2)/2} x2={midX} y2={(y1+y2)/2} stroke="#d0c4b0" strokeWidth={1.5}/>
                  <line x1={midX} y1={(y1+y2)/2} x2={nextX} y2={nextY} stroke="#d0c4b0" strokeWidth={1.5}/>
                </g>
              )
            })
          })}
        </svg>

        {gens.map((genNodes, gi) => genNodes.map((animal, ni) => {
          const y      = getY(ni, genNodes.length)
          const isRoot = gi===3 && ni===0
          return (
            <div key={`${gi}-${ni}`} style={{ position:'absolute', left:gi*colW, top:y, width:nodeW, height:nodeH, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {animal
                ? <AnimalNode animal={animal} isRoot={isRoot} isMobile={isMobile} onClick={onAnimalClick}/>
                : <UnknownNode isMobile={isMobile}/>
              }
            </div>
          )
        }))}
      </div>
    </div>
  )
}

export function LineagePage() {
  const { animals, loading } = useAnimals('sheep')
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState(null)
  const [search,     setSearch]     = useState(null)

  const tree     = selectedId ? buildTree(selectedId, animals, 4) : null
  const selected = selectedId ? animals.find(a=>a.id===selectedId) : null
  const filtered = animals.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ ...S.page, padding:isMobile?'14px 12px':'32px 24px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:32, fontWeight:700, margin:'0 0 4px' }}>🌳 Lineage</h1>
        <p style={{ fontSize:13, color:'#a08060', margin:0 }}>4-generation family tree for your sheep</p>
      </div>

      {/* Animal selector */}
      <div style={{ ...S.card, padding:isMobile?14:22, marginBottom:20 }}>
        <span style={S.sectionLabel}>Select an Animal</span>
        <input style={{ ...S.input, marginBottom:14 }} placeholder="Search by name…" onChange={e=>setSearch(e.target.value)}/>
        {loading
          ? <p style={{ color:'#a08060', fontSize:13 }}>Loading…</p>
          : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {filtered.map(a=>{
                const isSel = a.id===selectedId
                const st    = STATUS_STYLES[a.status]||STATUS_STYLES.alive
                const [err, setErr] = useState(false)
                return (
                  <div key={a.id} onClick={()=>setSelectedId(isSel?null:a.id)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', borderRadius:10, cursor:'pointer',
                      border:isSel?'2px solid #c8a060':'1px solid #e8e0d0',
                      background:isSel?'#fdfaf0':'#fff',
                      boxShadow:isSel?'0 0 0 3px rgba(200,160,96,0.15)':'none',
                      transition:'all 0.15s' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'2px solid #e8e0d0', flexShrink:0, background:'#f0ebe4' }}>
                      {a.photo_url&&!err
                        ? <img src={a.photo_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=>setErr(true)}/>
                        : <AnimalIllustration animal={a} size={32}/>
                      }
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, margin:'0 0 1px', whiteSpace:'nowrap' }}>{a.name}</p>
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:6, background:st.bg, color:st.text, textTransform:'uppercase' }}>{a.status}</span>
                    </div>
                    {isSel && <span style={{ color:'#c8a060', fontSize:14 }}>✓</span>}
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {!selectedId && (
        <div style={{ ...S.card, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🌳</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, marginBottom:8 }}>Select an animal above</p>
          <p style={{ fontSize:14, color:'#a08060', maxWidth:320, margin:'0 auto' }}>Choose any sheep to see their 4-generation family tree.</p>
        </div>
      )}

      {tree && selected && (
        <div style={{ ...S.card, padding:isMobile?14:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:16, borderBottom:'1px solid #f0ebe4' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', border:'2px solid #c8a060', background:'#f0ebe4', flexShrink:0 }}>
              <AnimalIllustration animal={selected} size={40}/>
            </div>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, margin:'0 0 2px' }}>{selected.name}'s Family Tree</p>
              <p style={{ fontSize:12, color:'#a08060', margin:0 }}>{selected.breed||'Unknown breed'} · {calcAge(selected.birth_date)||'Unknown age'} · Tap any animal to view their tree</p>
            </div>
          </div>

          {/* Generation labels */}
          <div style={{ display:'flex', marginBottom:12 }}>
            {['Great-Grandparents','Grandparents','Parents','Animal'].map(l=>(
              <div key={l} style={{ flex:1, textAlign:'center' }}>
                <span style={{ fontSize:9, fontWeight:700, color:'#a08060', textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</span>
              </div>
            ))}
          </div>

          <PedigreeChart root={tree} isMobile={isMobile} onAnimalClick={a=>{ if(a.id!==selectedId) setSelectedId(a.id) }}/>

          {/* Legend */}
          <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid #f0ebe4', display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
            {[['#e8f5e9','#2e7d32','Alive'],['#f3e5f5','#6a1b9a','Sold'],['#fafafa','#616161','Deceased'],['#fff9e6','#f57f17','Rented']].map(([bg,c,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:bg, border:`1px solid ${c}` }}/>
                <span style={{ fontSize:11, color:'#7a6648' }}>{l}</span>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#f7f4ef', border:'1px dashed #c8b89a' }}/>
              <span style={{ fontSize:11, color:'#7a6648' }}>Unknown</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
