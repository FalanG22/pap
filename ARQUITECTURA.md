# PAP - Sistema de Gestión de Diagnósticos Citológicos (LIMS SaaS)

## Arquitectura Técnica, Modelo de Datos y Flujo de Usuario

---

# MI RECOMENDACIÓN: SUPABASE (TODO EN UNO, 100% FREE)

Después de evaluar todas las opciones gratis, mi recomendación es **una sola plataforma** que resuelve DB + Auth + Storage + Realtime sin configurar 4 servicios distintos.

## Por qué Supabase es la mejor opción para este proyecto:

| Problema | Solución con Supabase |
|----------|---------------------|
| Necesito PostgreSQL gratis | **500MB PostgreSQL** incluido |
| Necesito login de usuarios | **Supabase Auth** (50k usuarios, magic links, OAuth) gratis |
| Necesito guardar PDFs y logos | **Supabase Storage** (1GB gratis) |
| Necesito multi-tenancy | **Row Level Security (RLS)** — una tabla, políticas por tenant_id |
| Necesito notificaciones en vivo | **Supabase Realtime** — escuchar cambios sin servidor |
| Necesito auditarlo todo | **RLS + audit triggers** automáticos |

**Una cuenta, una SDK, cero configuración entre servicios.**

---

## Alternativa: Turso (SQLite puro) — incluso más simple

Si preferís la máxima simplicidad posible:

| Aspecto | Turso (SQLite) |
|---------|---------------|
| **Modelo** | Una base de datos SQLite por tenant. 9GB c/u. Hasta 500 bases. |
| **Multi-tenancy** | Aislamiento TOTAL — cada lab es un archivo .db distinto. |
| **Conexión** | Edge HTTP API. No necesita pool. |
| **Auth** | Hay que agregarlo aparte (Supabase Auth o Auth.js). |
| **Storage** | Hay que agregarlo aparte (Cloudflare R2). |
| **Vs Supabase** | Más simple a nivel BD, pero necesitás 2-3 servicios en vez de 1. |

**Mi voto va por Supabase** — tenés todo integrado, menos fricción, misma facilidad.

---

# 1. STACK FINAL RECOMENDADO

| Capa | Tecnología | Free Tier | Por qué |
|------|-----------|-----------|---------|
| **Hosting** | **Vercel** (Hobby) | 100GB ancho de banda, SSL gratis | Un solo deploy para web + API. |
| **Framework** | Next.js 14+ (App Router) | — | SSR + API Routes en uno. |
| **Base de Datos** | **Supabase PostgreSQL** | 500MB almacenamiento | RLS para multi-tenant, sin schemas complejos. |
| **Auth** | **Supabase Auth** (built-in) | 50,000 usuarios, magic links, OAuth | Ya viene con Supabase. Nada extra que configurar. |
| **Storage** | **Supabase Storage** | 1GB, imágenes y PDFs | Misma SDK que la DB. Políticas RLS también. |
| **Realtime** | **Supabase Realtime** | 2 millones de mensajes/mes | Para notificaciones en vivo al lab. |
| **PDF Engine** | **@react-pdf/renderer** | Gratuito, JS puro | Corre en serverless de Vercel. Sin Chrome. |
| **Email** | **Resend** | 100 emails/día gratis | API simple, templates React. |

## Lo que eliminamos (y por qué):

| Eliminado | Motivo |
|-----------|--------|
| Neon | Supabase ya incluye PostgreSQL. Un servicio menos. |
| Cloudflare R2 | Supabase Storage alcanza para empezar. |
| Redis / Vercel KV | Con Supabase Realtime + RLS, no hace falta para sesiones. |
| Auth.js / Lucia | Supabase Auth tiene magic links, OAuth, MFA. |
| Docker / Coolify | Vercel + Supabase son serverless, cero servidores. |

**Costo mensual: $0 USD.** Cuando crezcas, Supabase escala a $25/mes (8GB DB, 100GB storage, 100k usuarios).

---

# 2. ESTRATEGIA MULTI-TENANT: RLS (Row Level Security)

En lugar de un schema por tenant (complejo), usamos **una sola tabla con tenant_id** y políticas RLS:

```sql
-- Ejemplo: la tabla patient tiene tenant_id
-- Cada fila sabe a qué laboratorio pertenece

CREATE TABLE patient (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    dni         VARCHAR(20) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    birth_date  DATE,
    sex         VARCHAR(10),
    email       VARCHAR(255),
    phone       VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, dni)  -- DNI único DENTRO del mismo lab
);

-- Política RLS: el usuario solo ve pacientes de su laboratorio
CREATE POLICY tenant_isolation ON patient
    FOR ALL
    USING (tenant_id = (SELECT current_setting('app.tenant_id')::UUID));
```

**El flujo es:**
1. El usuario hace login en Supabase Auth.
2. La sesión incluye `app.tenant_id` (seteado al autenticarse).
3. **Cada query automáticamente** filtra por tenant. No hay forma de leak.

**Vs schema-per-tenant:** RLS es más simple de configurar, más fácil de hacer backup (una sola BD), y no tiene límite de schemas. El aislamiento es matemático (las políticas RLS se evalúan por cada fila).

---

# 3. MODELO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                    UNA SOLA BASE DE DATOS                    │
│                                                             │
│  _public.tenants                                            │
│  _public.users                                              │
│                                                             │
│  public.patient        (RLS: tenant_id)                     │
│  public.order          (RLS: tenant_id)                     │
│  public.diagnosis      (RLS: tenant_id → vía order)        │
│  public.macros_template (RLS: tenant_id)                    │
│  public.notification   (RLS: tenant_id → vía order)        │
│  public.audit_log      (RLS: tenant_id)                     │
└─────────────────────────────────────────────────────────────┘
```

## SQL Completo

```sql
-- ============================================
-- TABLAS DE ORQUESTACIÓN (sin RLS, son públicas)
-- ============================================

CREATE TABLE _public.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    config      JSONB DEFAULT '{}'::jsonb,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE _public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    -- El rol se saca de la relación tenant_users (cada usuario puede tener
    -- distinto rol en cada tenant)
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE _public.tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES _public.users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'lab_admin', 'viewer')),
    UNIQUE(tenant_id, user_id)
);

-- ============================================
-- TABLAS DE NEGOCIO (con tenant_id + RLS)
-- ============================================

CREATE TABLE patient (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    dni         VARCHAR(20) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    birth_date  DATE,
    sex         VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    email       VARCHAR(255),
    phone       VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, dni)
);

CREATE INDEX idx_patient_tenant ON patient(tenant_id);
CREATE INDEX idx_patient_dni ON patient(tenant_id, dni);

CREATE TABLE "order" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    patient_id      UUID NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','delivered')),
    pdf_token       UUID DEFAULT gen_random_uuid() UNIQUE,
    pdf_url         TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_tenant ON "order"(tenant_id);
CREATE INDEX idx_order_status ON "order"(tenant_id, status);
CREATE INDEX idx_order_patient ON "order"(patient_id);

CREATE TABLE diagnosis (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES _public.tenants(id),
    order_id          UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    specialist_id     UUID NOT NULL,
    sample_quality    VARCHAR(20) NOT NULL CHECK (sample_quality IN ('adequate', 'inadequate')),
    general_category  VARCHAR(100) NOT NULL,
    descriptive_dx    TEXT NOT NULL,
    macros_used       JSONB DEFAULT '[]'::jsonb,
    is_signed         BOOLEAN DEFAULT false,
    signed_at         TIMESTAMPTZ,
    digital_signature TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX idx_diagnosis_tenant ON diagnosis(tenant_id);

CREATE TABLE macros_template (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    shortcode   VARCHAR(20) NOT NULL,
    full_text   TEXT NOT NULL,
    category    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, shortcode)
);

CREATE INDEX idx_macros_tenant ON macros_template(tenant_id);

CREATE TABLE notification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES _public.tenants(id),
    order_id        UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    recipient_role  VARCHAR(20) NOT NULL CHECK (recipient_role IN ('lab', 'patient')),
    recipient       VARCHAR(255) NOT NULL,  -- email o teléfono
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','failed','delivered')),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_tenant ON notification(tenant_id);

CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES _public.tenants(id),
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID NOT NULL,
    performed_by UUID NOT NULL,
    metadata    JSONB DEFAULT '{}'::jsonb,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_created ON audit_log(tenant_id, created_at DESC);

-- ============================================
-- POLÍTICAS RLS
-- ============================================

ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE macros_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política genérica: cada usuario ve solo su tenant
CREATE POLICY tenant_access ON patient
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY tenant_access ON "order"
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- ... misma política para diagnosis, macros_template, notification, audit_log

-- Trigger: cada INSERT/UPDATE registra automáticamente en audit_log
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (tenant_id, action, entity_type, entity_id, performed_by, metadata)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        current_setting('app.user_id')::UUID,
        jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Así de simple.** Una base, tablas planas, RLS protegiendo cada fila. No hay schemas por tenant, no hay `SET search_path`, no hay magia.

---

# 4. CÓMO SE CONECTA TODO (Next.js + Supabase)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Al hacer login, seteamos el tenant_id en la sesión
// (guardado en app_metadata del JWT)
```

```typescript
// app/dashboard/page.tsx
'use client';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { data: patients } = await supabase
    .from('patient')
    .select('*')
    .order('created_at', { ascending: false });

  // RLS filtra automáticamente por tenant_id = current_setting('app.tenant_id')
  // El usuario de Lab Norte SOLO ve pacientes de Lab Norte
}
```

**El secreto:** Cuando el usuario se loguea, seteamos `app.tenant_id` en su JWT via `supabase.auth.updateUser()`. Todas las queries posteriores heredan ese tenant. RLS hace el filtro automáticamente.

---

# 5. WIREFRAMES

Los mismos que ya definimos. La UI no cambia.

---

# 6. PLAN DE IMPLEMENTACIÓN

| Fase | Duración | Qué se hace |
|------|----------|-------------|
| **1. Setup** | 1 día | Crear proyecto Supabase + Vercel. Correr SQL de migración. |
| **2. Auth + RLS** | 2 días | Login con magic links, registro de tenant, JWT con tenant_id. |
| **3. Pacientes** | 2 días | CRUD pacientes con RLS, formulario por teclado (Tab). |
| **4. Órdenes** | 2 días | Alta de órdenes vinculadas a pacientes. |
| **5. Diagnóstico** | 5 días | Editor con macros, historial lateral, guardado de borrador. |
| **6. PDF** | 2 días | Generar PDF con @react-pdf/renderer, subir a Supabase Storage. |
| **7. Firmar** | 1 día | Botón de firma → genera PDF + lo sube + cambia estado. |
| **8. Portales** | 3 días | Portal lab (lista + descarga), portal paciente (token + DNI). |
| **9. Notificaciones** | 2 días | Resend + Supabase Realtime para alertas. |

**Total: ~20 días hábiles (4 semanas). Con un dev. Sin costo de infraestructura.**

---

# 7. RESUMEN: POR QUÉ ESTA ES LA MEJOR OPCIÓN

1. **Un solo proveedor:** Supabase reemplaza Neon + Cloudflare R2 + Redis + Auth0 + Realtime.
2. **Cero config:** No hay que conectar servicios entre sí. Todo usa la misma SDK.
3. **RLS > schemas:** El aislamiento multi-tenant es tan seguro pero 10x más simple de implementar.
4. **Vercel + Supabase:** El stack más probado del ecosistema Next.js. Documentación infinita.
5. **Escala sin reescribir:** Cuando necesites más, pasás Supabase a Pro ($25/mes) sin cambiar una línea de código.
6. **Costo real: $0.** No hay letra chica. 500MB DB, 1GB storage, 50k usuarios, 100 emails/día.

---

*Documento generado como propuesta técnica. Mi recomendación firme es Supabase como plataforma única.*
