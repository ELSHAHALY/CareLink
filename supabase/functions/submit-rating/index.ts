// supabase/functions/submit-rating/index.ts
// Secure patient review submission. Runs with service_role (server-side only).
// The browser NEVER sees the service_role key and NEVER sends identity
// fields: patient_id, doctor_id, patient_name, source, status, and
// is_verified are all derived server-side from the verified appointment.
//
// Request: POST { appointment_id, score, bedside_manner?, communication?,
//                  wait_time?, comment }
// Rules: appointment must exist, belong to the caller, and be 'completed'.
//        One rating per appointment (409 on duplicate).
//        New ratings start as status='pending' (admin moderation required).
// Response: { success: true, rating_id, status: 'pending' }
//         Never returns patient_id / appointment_id.

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

function isValidScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  )
}

function isValidOptionalScore(value: unknown): boolean {
  return value === undefined || value === null || isValidScore(value)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

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

  let payload: {
    appointment_id?: unknown
    score?: unknown
    bedside_manner?: unknown
    communication?: unknown
    wait_time?: unknown
    comment?: unknown
  }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const appointmentId =
    typeof payload.appointment_id === 'string'
      ? payload.appointment_id.trim()
      : ''
  if (!appointmentId) {
    return json({ error: 'appointment_id is required' }, 400)
  }
  if (!isValidScore(payload.score)) {
    return json({ error: 'score must be an integer from 1 to 5' }, 400)
  }
  if (!isValidOptionalScore(payload.bedside_manner)) {
    return json({ error: 'bedside_manner must be an integer from 1 to 5' }, 400)
  }
  if (!isValidOptionalScore(payload.communication)) {
    return json({ error: 'communication must be an integer from 1 to 5' }, 400)
  }
  if (!isValidOptionalScore(payload.wait_time)) {
    return json({ error: 'wait_time must be an integer from 1 to 5' }, 400)
  }
  const comment =
    typeof payload.comment === 'string' ? payload.comment.trim() : ''
  if (!comment) {
    return json({ error: 'comment is required' }, 400)
  }
  if (comment.length > 2000) {
    return json({ error: 'comment must be at most 2000 characters' }, 400)
  }

  // Caller identity from JWT (respects auth, no trust in body fields).
  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // The appointment must exist and belong to the caller.
  const { data: appointment, error: aptError } = await adminClient
    .from('appointments')
    .select('id, doctor_id, patient_id, status')
    .eq('id', appointmentId)
    .single()
  if (aptError || !appointment) {
    return json({ error: 'Appointment not found' }, 404)
  }
  if (appointment.patient_id !== caller.id) {
    return json({ error: 'Forbidden: this appointment is not yours' }, 403)
  }
  if (appointment.status !== 'completed') {
    return json(
      { error: 'Only completed appointments can be rated' },
      400,
    )
  }

  // One rating per appointment.
  const { data: existing } = await adminClient
    .from('ratings')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()
  if (existing) {
    return json(
      { error: 'You have already submitted a review for this appointment' },
      409,
    )
  }

  // Display name comes from the profile, never from the request body.
  const { data: profile } = await adminClient
    .from('profiles')
    .select('name, email')
    .eq('id', caller.id)
    .single()
  const patientName = (
    profile?.name ||
    profile?.email?.split('@')[0] ||
    'Patient'
  ).slice(0, 120)

  const today = new Date().toISOString().slice(0, 10)

  const { data: inserted, error: insertError } = await adminClient
    .from('ratings')
    .insert({
      doctor_id: String(appointment.doctor_id),
      patient_id: caller.id,
      appointment_id: appointmentId,
      patient_name: patientName,
      score: payload.score,
      bedside_manner: payload.bedside_manner ?? null,
      communication: payload.communication ?? null,
      wait_time: payload.wait_time ?? null,
      comment,
      review_date: today,
      source: 'patient',
      status: 'pending',
      is_verified: true,
    })
    .select('id, status')
    .single()

  if (insertError || !inserted) {
    const msg = (insertError?.message || '').toLowerCase()
    const code = (insertError as { code?: string } | null)?.code
    if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
      return json(
        { error: 'You have already submitted a review for this appointment' },
        409,
      )
    }
    // Never leak database internals to the client.
    return json({ error: 'Failed to submit review' }, 400)
  }

  return json(
    { success: true, rating_id: inserted.id, status: inserted.status },
    200,
  )
})
