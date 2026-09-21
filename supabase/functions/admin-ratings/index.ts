// supabase/functions/admin-ratings/index.ts
// Admin-only ratings moderation. Runs with service_role (server-side only).
// The browser NEVER sees the service_role key.
//
// GET  ?status=pending|published|hidden|all  -> list ratings for moderation.
// PATCH { id, action: 'publish'|'hide', note? } -> change status only.
//
// The admin may ONLY change: status, moderation_note, moderated_by,
// moderated_at. doctor_id / patient_id / appointment_id / patient_name /
// score / is_verified are never writable here. patient_id and
// appointment_id are never returned (moderation does not need them).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const LIST_COLUMNS =
  'id,doctor_id,patient_name,score,bedside_manner,communication,wait_time,comment,review_date,source,status,is_verified,created_at,moderated_at,moderation_note'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function requireAdmin(
  supabaseUrl: string,
  publishableKey: string,
  serviceRoleKey: string,
  authHeader: string,
) {
  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return { error: json({ error: 'Unauthorized' }, 401) }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (profile?.role !== 'admin') {
    return { error: json({ error: 'Forbidden: admins only' }, 403) }
  }
  return { adminClient, caller }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
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

  const gate = await requireAdmin(
    supabaseUrl,
    publishableKey,
    serviceRoleKey,
    authHeader,
  )
  if (gate.error || !gate.adminClient || !gate.caller) {
    return gate.error ?? json({ error: 'Unauthorized' }, 401)
  }
  const { adminClient, caller } = gate

  async function listRatings(status: string) {
    const normalized = (status || 'pending').toLowerCase()
    let query = adminClient
      .from('ratings')
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(200)
    if (
      normalized === 'pending' ||
      normalized === 'published' ||
      normalized === 'hidden'
    ) {
      query = query.eq('status', normalized)
    } else if (normalized !== 'all') {
      return json({ error: 'Invalid status filter' }, 400)
    }
    const { data, error } = await query
    if (error) return json({ error: 'Failed to load ratings' }, 500)

    // Doctor display names are resolved client-side from the public catalog
    // (useDoctorsCatalog), so they are not fetched here.
    return json({ ratings: data ?? [] }, 200)
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    return listRatings(url.searchParams.get('status') || 'pending')
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    let payload: { id?: unknown; action?: unknown; note?: unknown; status?: unknown }
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }
    // POST without an action is a list request (JS client convenience).
    if (payload.action === undefined || payload.action === null) {
      return listRatings(
        typeof payload.status === 'string' ? payload.status : 'pending',
      )
    }
    const id = typeof payload.id === 'string' ? payload.id.trim() : ''
    const action =
      typeof payload.action === 'string' ? payload.action.trim().toLowerCase() : ''
    if (!id) return json({ error: 'id is required' }, 400)
    if (action !== 'publish' && action !== 'hide') {
      return json({ error: "action must be 'publish' or 'hide'" }, 400)
    }
    const note =
      typeof payload.note === 'string' ? payload.note.trim().slice(0, 1000) : null

    const { data: existing, error: fetchError } = await adminClient
      .from('ratings')
      .select('id,status,doctor_id')
      .eq('id', id)
      .single()
    if (fetchError || !existing) {
      return json({ error: 'Rating not found' }, 404)
    }
    // Publishing requires a resolvable doctor (mirrors the DB trigger).
    if (action === 'publish' && !existing.doctor_id) {
      return json({ error: 'Cannot publish a rating without doctor_id' }, 400)
    }

    const { data: updated, error: updateError } = await adminClient
      .from('ratings')
      .update({
        status: action === 'publish' ? 'published' : 'hidden',
        moderation_note: note,
        moderated_by: caller.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id,status')
      .single()
    if (updateError || !updated) {
      return json({ error: 'Failed to update rating' }, 500)
    }
    return json({ success: true, rating: updated }, 200)
  }

  return json({ error: 'Method not allowed' }, 405)
})
