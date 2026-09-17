// supabase/functions/admin-create-doctor/index.ts
// Secure admin-only doctor creation. Runs with service_role (server-side only).
// The browser NEVER sees the service_role key.
//
// Request: POST { email, password, name, doctor_id } with caller JWT.
// Flow: verify caller is admin -> auth.admin.createUser (email confirmed)
//   -> update profiles to role=doctor. Does NOT change the caller's session
//   (unlike client-side signUp, which would log the admin out).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  // New key format exposes SUPABASE_SECRET_KEY; legacy projects expose
  // SUPABASE_SERVICE_ROLE_KEY. Both are privileged server-side secrets —
  // never send either to the browser.
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SECRET_KEY')
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ||
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    ''
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: { email?: string; password?: string; name?: string; doctor_id?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const email = (payload.email ?? '').trim().toLowerCase()
  const password = payload.password ?? ''
  const name = (payload.name ?? '').trim()
  const doctorId = (payload.doctor_id ?? '').trim()

  if (!isValidEmail(email)) return json({ error: 'Please enter a valid email address' }, 400)
  if (!password || password.length < 6)
    return json({ error: 'Password must be at least 6 characters' }, 400)
  if (!name || name.length < 2)
    return json({ error: 'Name must be at least 2 characters' }, 400)
  if (!doctorId) return json({ error: 'Please select a doctor profile' }, 400)

  // Caller client (respects RLS) to identify the caller.
  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  // Privileged client for admin check + user creation.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Forbidden: admins only' }, 403)
  }

  const { data: doctor } = await adminClient
    .from('doctors')
    .select('id')
    .eq('id', doctorId)
    .single()
  if (!doctor) return json({ error: 'Unknown doctor profile' }, 400)

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'doctor', doctor_id: doctorId },
    })
  if (createError) {
    const msg = createError.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return json({ error: 'An account with this email already exists.' }, 409)
    }
    return json({ error: createError.message }, 400)
  }
  const newUserId = created?.user?.id
  if (!newUserId) return json({ error: 'User creation failed' }, 500)

  // The handle_new_user trigger creates a patient profile; promote it.
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role: 'doctor', doctor_id: doctorId, name })
    .eq('id', newUserId)
  if (profileError) {
    // Roll back the auth user so we never leave an orphan login.
    await adminClient.auth.admin.deleteUser(newUserId)
    return json(
      { error: `Profile assignment failed: ${profileError.message}` },
      500,
    )
  }

  return json({ success: true, user_id: newUserId, email }, 200)
})
