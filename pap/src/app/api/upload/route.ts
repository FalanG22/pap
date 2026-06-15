import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserTenant } from '@/lib/get-tenant'

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string

  if (!file || !type) {
    return NextResponse.json({ error: 'file y type son requeridos' }, { status: 400 })
  }

  if (!['signature', 'stamp'].includes(type)) {
    return NextResponse.json({ error: 'type debe ser signature o stamp' }, { status: 400 })
  }

  // Usar service role para operaciones de storage (listar/crear bucket)
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: buckets } = await serviceSupabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === 'signatures')) {
    const { error: createErr } = await serviceSupabase.storage.createBucket('signatures', { public: true })
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
  }

  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${tenant.tenant_id}/${type}.${ext}`

  const { error: uploadErr } = await serviceSupabase.storage
    .from('signatures')
    .upload(fileName, file, { upsert: true })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('signatures')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl })
}
