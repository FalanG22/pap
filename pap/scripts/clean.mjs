import pkg from 'pg';
const { Client } = pkg;
const c = new Client({ connectionString: 'postgresql://postgres:tRaGEotO9Hhkhj9q@db.jvrrafarudribgipglsq.supabase.co:5432/postgres' });
await c.connect();
await c.query('DROP TABLE IF EXISTS public.tenants CASCADE');
await c.query('DROP TABLE IF EXISTS public.users CASCADE');
await c.query('DROP TABLE IF EXISTS public.tenant_users CASCADE');
console.log('✓ Duplicados eliminados');
await c.end();
