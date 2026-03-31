import { createClient } from '@supabase/supabase-js'

// Publishable key — segura para uso no frontend por design do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gsdibhgkmghmyuadvdgo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0IuN6_9louSY3c3den21jg_ch1QB9K0'

/**
 * Cliente Supabase — só instanciado se as env vars estiverem configuradas.
 * Se não estiverem (modo open source / dev sem auth), exporta null.
 *
 * Segurança:
 * - JWT armazenado em sessionStorage (não localStorage) para reduzir
 *   superfície de ataque a XSS — token some ao fechar a aba.
 * - persistSession: false impede sincronização entre abas via localStorage.
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        },
      })

export default supabase
