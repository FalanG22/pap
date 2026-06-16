import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: user } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  return NextResponse.json({ exists: !!user })
}
