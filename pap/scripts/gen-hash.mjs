import bcrypt from 'bcryptjs';

// Fuerza $2a$ (compatible con Supabase GoTrue)
const salt = bcrypt.genSaltSync(10);
// Replace $2b$ with $2a$ if present (bcryptjs may use $2b$)
const hash = bcrypt.hashSync('pap2026', salt).replace(/^\$2b\$/, '$2a$');
console.log('Hash:', hash);
