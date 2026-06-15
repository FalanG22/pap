import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: diagnosis, error: dxError } = await supabase
    .from('diagnosis')
    .select('*, order:order_id(*)')
    .eq('order_id', orderId)
    .single()

  if (dxError || !diagnosis) return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })

  const hash = `sha256-${Buffer.from(diagnosis.descriptive_dx).toString('base64').slice(0, 16)}`

  const { error: updateError } = await supabase
    .from('diagnosis')
    .update({
      is_signed: true,
      signed_at: new Date().toISOString(),
      digital_signature: hash,
    })
    .eq('order_id', orderId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase
    .from('order')
    .update({ status: 'completed' })
    .eq('id', orderId)

  return NextResponse.json({ success: true, signature: hash })
}
