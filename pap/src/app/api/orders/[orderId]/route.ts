import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: order, error: orderErr } = await supabase
    .from('order')
    .select('downloaded_at, status')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  if (order.downloaded_at) {
    return NextResponse.json({ error: 'No se puede eliminar: el diagnóstico ya fue descargado por el Doctor' }, { status: 403 })
  }

  const { error: deleteErr } = await supabase
    .from('order')
    .delete()
    .eq('id', orderId)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
