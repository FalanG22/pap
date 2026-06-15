import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:tRaGEotO9Hhkhj9q@db.jvrrafarudribgipglsq.supabase.co:5432/postgres';
const client = new Client({ connectionString });

await client.connect();

// List all tables
const { rows } = await client.query(`
  SELECT table_schema, table_name, table_type
  FROM information_schema.tables
  WHERE table_schema IN ('public', '_public')
  ORDER BY table_schema, table_name
`);

console.log('\nTablas creadas:');
console.log('─'.repeat(50));
for (const r of rows) {
  console.log(`  ${r.table_schema}.${r.table_name}  (${r.table_type})`);
}

// Count RLS policies
const { rows: policies } = await client.query(`
  SELECT tablename, count(*) as policies
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename
`);

console.log('\nPolíticas RLS:');
console.log('─'.repeat(50));
for (const p of policies) {
  console.log(`  ${p.tablename}: ${p.policies} política(s)`);
}

await client.end();
