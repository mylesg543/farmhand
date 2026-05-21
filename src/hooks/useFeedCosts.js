import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const EMULATION_KEY = 'fh_emulated_user'
function getEmulated() {
  try { return JSON.parse(localStorage.getItem(EMULATION_KEY)) } catch { return null }
}

export function useFeedCosts() {
  const { user } = useAuth()
  const [costs,   setCosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const emulated     = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const canWrite     = !emulated || emulated.writeMode

  const fetch = async () => {
    if (!effectiveUid) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('fh_feed_costs')
        .select('*').eq('user_id', effectiveUid).order('date', { ascending: false })
      if (error) throw error
      setCosts(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user?.id, effectiveUid])

  const addCost = async (payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    if (emulated) {
      const { data, error } = await supabase.rpc('add_cost_admin', {
        target_user_id: effectiveUid, payload
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setCosts(prev => [row, ...prev])
      return row
    }
    const { data, error } = await supabase.from('fh_feed_costs')
      .insert({ ...payload, user_id: effectiveUid }).select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setCosts(prev => [row, ...prev])
    return row
  }

  const updateCost = async (id, payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { data, error } = await supabase.from('fh_feed_costs')
      .update(payload).eq('id', id).eq('user_id', effectiveUid).select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setCosts(prev => prev.map(c => c.id === id ? row : c))
    return row
  }

  const deleteCost = async (id) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { error } = await supabase.from('fh_feed_costs')
      .delete().eq('id', id).eq('user_id', effectiveUid)
    if (error) throw error
    setCosts(prev => prev.filter(c => c.id !== id))
  }

  return { costs, loading, error, refetch: fetch, addCost, updateCost, deleteCost }
}
