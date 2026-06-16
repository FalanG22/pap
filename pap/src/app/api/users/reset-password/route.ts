import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function getSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!internalUser) return null

  const { data: roles } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('role')
    .eq('user_id', internalUser.id)

  return roles?.some(r => r.role === 'super_admin') ? internalUser : null
}

function generatePassword(length = 10): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  let pw = ''
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 3; i < length; i++) {
    pw += all[Math.floor(Math.random() * all.length)]
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { email, password: customPassword } = body
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const newPassword = (customPassword && customPassword.length >= 6) ? customPassword : generatePassword()

  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(u => u.email === email)

  if (authUser) {
    const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(authUser.id, { password: newPassword })
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  } else {
    const { error: createErr } = await adminSupabase.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
  }

  return NextResponse.json({ new_password: newPassword, email })
}
