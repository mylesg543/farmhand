import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminStatus() {
  const [isAdmin,  setIsAdmin]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('fh_user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.is_admin === true)
          setLoading(false)
        })
    })
  }, [])

  return { isAdmin, loading }
}

export function useAllUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    supabase
      .from('fh_user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUsers(data || [])
        setLoading(false)
      })
  }, [])

  return { users, loading, error }
}

export function useAdminUserData(userId) {
  const [animals,   setAnimals]   = useState([])
  const [costs,     setCosts]     = useState([])
  const [income,    setIncome]    = useState([])
  const [plants,    setPlants]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      supabase.from('fh_animals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('fh_feed_costs').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('fh_income').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('fh_plants').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]).then(([a, c, i, p]) => {
      setAnimals(a.data  || [])
      setCosts(c.data    || [])
      setIncome(i.data   || [])
      setPlants(p.data   || [])
      setLoading(false)
    })
  }, [userId])

  return { animals, costs, income, plants, loading }
}
