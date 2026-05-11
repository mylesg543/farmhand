import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useIncome() {
  const { user } = useAuth()
  const [income,  setIncome]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('fh_income')
        .select('*, customer:fh_customers(id,name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error
      setIncome(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user])

  const addIncome = async (payload) => {
    const { data, error } = await supabase.from('fh_income')
      .insert({ ...payload, user_id: user.id }).select('*, customer:fh_customers(id,name)').single()
    if (error) throw error
    setIncome(prev => [data, ...prev])
    return data
  }

  const updateIncome = async (id, payload) => {
    const { data, error } = await supabase.from('fh_income')
      .update(payload).eq('id', id).eq('user_id', user.id)
      .select('*, customer:fh_customers(id,name)').single()
    if (error) throw error
    setIncome(prev => prev.map(i => i.id===id ? data : i))
    return data
  }

  const deleteIncome = async (id) => {
    const { error } = await supabase.from('fh_income')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  return { income, loading, error, refetch: fetch, addIncome, updateIncome, deleteIncome }
}
