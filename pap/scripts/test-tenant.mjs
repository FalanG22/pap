import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:tRaGEotO9Hhkhj9q@db.jvrrafarudribgipglsq.supabase.co:5432/postgres';
const client = new Client({ connectionString });

await client.connect();

// Test create_tenant
const { rows: tenants } = await client.query("SELECT _public.create_tenant('Mi Laboratorio', 'mi-lab') as id");
console.log('✓ Tenant creado:', tenants[0].id);

// Verify
const { rows: check } = await client.query('SELECT * FROM _public.tenants');
console.log('Tenants en DB:', check.length, '→', check.map(t => t.name).join(', '));

const { rows: macros } = await client.query('SELECT shortcode, full_text FROM public.macros_template LIMIT 3');
console.log('Macros creadas:', macros.map(m => m.shortcode).join(', '));

await client.end();
