import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCustomers() {
  const { user }    = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const fetch = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('fh_customers')
        .select('*').eq('user_id', user.id).order('name')
      if (error) throw error
      setCustomers(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user])

  const addCustomer = async (payload) => {
    const { data, error } = await supabase.from('fh_customers')
      .insert({ ...payload, user_id: user.id }).select().single()
    if (error) throw error
    setCustomers(prev => [...prev, data].sort((a,b)=>a.name.localeCompare(b.name)))
    return data
  }

  const updateCustomer = async (id, payload) => {
    const { data, error } = await supabase.from('fh_customers')
      .update(payload).eq('id', id).eq('user_id', user.id).select().single()
    if (error) throw error
    setCustomers(prev => prev.map(c => c.id===id ? data : c))
    return data
  }

  const deleteCustomer = async (id) => {
    const { error } = await supabase.from('fh_customers')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  return { customers, loading, error, refetch: fetch, addCustomer, updateCustomer, deleteCustomer }
}
