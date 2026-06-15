import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const password = 'pap2026';
const hash = await bcrypt.hash(password, 10);

// Usar IPv6 directo (el único que resuelve)
const client = new Client({
  user: 'postgres',
  password: 'tRaGEotO9Hhkhj9q',
  database: 'postgres',
  host: 'db.jvrrafarudribgipglsq.supabase.co',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  family: 6,
});

try {
  await client.connect();
  console.log('✓ Conectado');

  const { rows: users } = await client.query(
    "SELECT id, email FROM auth.users WHERE email LIKE '%placona%'"
  );

  if (users.length === 0) {
    const { rows: pub } = await client.query("SELECT email FROM _public.users WHERE email LIKE '%placona%'");
    for (const u of pub) {
      const { rows: au } = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [u.email]);
      if (au.length) users.push(au[0]);
    }
  }

  if (users.length === 0) {
    console.log('❌ Usuario no encontrado');
    process.exit(1);
  }

  const user = users[0];
  console.log('✓ Usuario:', user.email);

  await client.query(`
    UPDATE auth.users
    SET encrypted_password = $1,
        updated_at = NOW(),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    is_sso_user = false
  WHERE id = $2
`, [hash, user.id]);

  console.log('✓ Contraseña: pap2026');
  await client.end();
} catch (err) {
  console.log('Error:', err.message);
  process.exit(1);
}
