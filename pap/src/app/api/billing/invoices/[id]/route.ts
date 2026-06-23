import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('invoice')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tenant.role !== 'super_admin' && data.tenant_id !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin' && tenant.role !== 'lab_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { data: existing } = await supabase
    .from('invoice')
    .select('tenant_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (tenant.role !== 'super_admin' && existing.tenant_id !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const allowed: Record<string, unknown> = {}
  if (body.status !== undefined) allowed.status = body.status
  if (body.notes !== undefined) allowed.notes = body.notes
  if (body.status === 'sent') allowed.sent_at = new Date().toISOString()
  if (body.status === 'paid') allowed.paid_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('invoice')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se cancela, desvincular los diagnósticos para que puedan re-facturarse
  if (body.status === 'cancelled') {
    await supabase
      .from('diagnosis')
      .update({ invoice_id: null })
      .eq('invoice_id', id)
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })
  }

  const { id } = await params

  // Desvincular diagnósticos antes de eliminar
  await supabase
    .from('diagnosis')
    .update({ invoice_id: null })
    .eq('invoice_id', id)

  const { error } = await supabase
    .from('invoice')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
