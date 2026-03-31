import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente Supabase — só instanciado se as env vars estiverem configuradas.
 * Se não estiverem (modo open source / dev sem auth), exporta null.
 *
 * Segurança:
 * - JWT armazenado em sessionStorage (não localStorage) para reduzir
 *   superfície de ataque a XSS — token some ao fechar a aba.
 * - persistSession: false impede sincronização entre abas via localStorage.
 */
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        },
      })
    : null

export default supabase
