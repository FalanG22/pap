import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:tRaGEotO9Hhkhj9q@db.jvrrafarudribgipglsq.supabase.co:5432/postgres';
const client = new Client({ connectionString });

await client.connect();
console.log('Conectado');

// Drop ALL old functions in ALL schemas
await client.query("DROP FUNCTION IF EXISTS public.create_tenant(VARCHAR, VARCHAR) CASCADE");
await client.query("DROP FUNCTION IF EXISTS _public.create_tenant(VARCHAR, VARCHAR) CASCADE");
await client.query("DROP FUNCTION IF EXISTS public.fn_audit_trigger() CASCADE");
await client.query("DROP FUNCTION IF EXISTS _public.create_tenant_bucket() CASCADE");
console.log('Viejas funciones eliminadas');

// Drop all tables with CASCADE
await client.query('DROP TABLE IF EXISTS public.audit_log CASCADE');
await client.query('DROP TABLE IF EXISTS public.notification CASCADE');
await client.query('DROP TABLE IF EXISTS public.diagnosis CASCADE');
await client.query('DROP TABLE IF EXISTS public.macros_template CASCADE');
await client.query('DROP TABLE IF EXISTS public."order" CASCADE');
await client.query('DROP TABLE IF EXISTS public.patient CASCADE');
await client.query('DROP TABLE IF EXISTS _public.tenant_users CASCADE');
await client.query('DROP TABLE IF EXISTS _public.users CASCADE');
await client.query('DROP TABLE IF EXISTS _public.tenants CASCADE');
console.log('Tablas eliminadas');

// Run fresh schema
import { readFileSync } from 'fs';
const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf-8');
await client.query(sql);
console.log('✓ Migración completada');

// Verify
const { rows } = await client.query(`
  SELECT table_schema, table_name FROM information_schema.tables
  WHERE table_schema IN ('public', '_public') AND table_type = 'BASE TABLE'
  ORDER BY table_schema, table_name
`);
for (const r of rows) console.log(`  ${r.table_schema}.${r.table_name}`);

await client.end();
