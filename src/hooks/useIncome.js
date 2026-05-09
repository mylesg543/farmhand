import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useIncome() {
  const [income,  setIncome]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('fh_income')
      .select('*, customer:fh_customers(id, name)')
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setIncome(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addIncome = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('fh_income')
      .insert([{ ...values, user_id: user?.id }])
      .select('*, customer:fh_customers(id, name)')
      .single()
    if (error) throw error
    setIncome(prev => [data, ...prev])
    return data
  }

  const deleteIncome = async (id) => {
    const { error } = await supabase.from('fh_income').delete().eq('id', id)
    if (error) throw error
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  return { income, loading, error, refetch: fetch, addIncome, deleteIncome }
}
