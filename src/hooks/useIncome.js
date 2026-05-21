import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const EMULATION_KEY = 'fh_emulated_user'
function getEmulated() {
  try { return JSON.parse(localStorage.getItem(EMULATION_KEY)) } catch { return null }
}

export function useIncome() {
  const { user } = useAuth()
  const [income,  setIncome]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const emulated     = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const canWrite     = !emulated || emulated.writeMode

  const fetch = async () => {
    if (!effectiveUid) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('fh_income')
        .select('*, customer:fh_customers(id,name)')
        .eq('user_id', effectiveUid).order('date', { ascending: false })
      if (error) throw error
      setIncome(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user?.id, effectiveUid])

  const addIncome = async (payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    if (emulated) {
      const { data, error } = await supabase.rpc('add_income_admin', {
        target_user_id: effectiveUid, payload
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setIncome(prev => [row, ...prev])
      return row
    }
    const { data, error } = await supabase.from('fh_income')
      .insert({ ...payload, user_id: effectiveUid })
      .select('*, customer:fh_customers(id,name)')
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setIncome(prev => [row, ...prev])
    return row
  }

  const updateIncome = async (id, payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { data, error } = await supabase.from('fh_income')
      .update(payload).eq('id', id).eq('user_id', effectiveUid)
      .select('*, customer:fh_customers(id,name)')
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setIncome(prev => prev.map(i => i.id === id ? row : i))
    return row
  }

  const deleteIncome = async (id) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { error } = await supabase.from('fh_income')
      .delete().eq('id', id).eq('user_id', effectiveUid)
    if (error) throw error
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  return { income, loading, error, refetch: fetch, addIncome, updateIncome, deleteIncome }
}
