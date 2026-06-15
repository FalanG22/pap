"use client"

import { useEffect, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Lock,
  User,
  Building2,
  Fingerprint,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Menu,
  X,
  Microscope,
} from "lucide-react"
import { cn } from "@/lib/utils"

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) router.replace(`/auth/callback?code=${code}`)
  }, [searchParams, router])
  return null
}

function GlowOrb({
  className,
  color = "sky",
}: {
  className?: string
  color?: "sky" | "indigo"
}) {
  const colors = {
    sky: "rgba(56,189,248,0.10)",
    indigo: "rgba(99,102,241,0.08)",
  }
  return (
    <div
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ backgroundColor: colors[color] }}
    />
  )
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <Suspense fallback={null}>
        <AuthCallbackHandler />
      </Suspense>

      <GlowOrb className="-top-40 right-0 h-[600px] w-[600px]" color="sky" />

      {/* ===== NAVBAR ===== */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-2xl"
            : "bg-slate-950",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-[10px] font-bold text-white shadow-sm">
              LP
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-semibold tracking-tight text-white">
                Laboratorio de Citopatología
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-500">
                Dra. Liliana M. Placon&aacute;
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="relative hidden h-9 items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-sky-400 sm:inline-flex">
                <Lock className="size-3.5" />
                Portal de Resultados
                <ArrowRight className="size-3.5" />
              </button>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] md:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 md:hidden",
            menuOpen ? "max-h-80" : "max-h-0",
          )}
        >
          <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
            <div className="my-2 h-px bg-white/[0.06]" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-medium text-white no-underline"
            >
              <Lock className="size-3.5" />
              Portal de Resultados
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <GlowOrb className="-bottom-60 left-0 h-[500px] w-[500px]" color="indigo" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/[0.07] px-3.5 py-1 text-xs font-medium text-sky-400">
                <Microscope className="size-3.5" />
                Consultorio de Citopatolog&iacute;a
              </div>

              <h1 className="font-heading text-balance text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight text-white">
                Descargue sus resultados
                <br />
                <span className="text-slate-400">citológicos desde el portal</span>
              </h1>

              <p className="text-balance mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
                Ingrese con su DNI y c&oacute;digo de acceso para obtener sus informes.
                R&aacute;pido, seguro, sin registro.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login">
                  <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-sky-400">
                    Ingresar al Portal
                    <ArrowRight className="size-4" />
                  </button>
                </Link>
                <Link href="/portal/paciente">
                  <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm text-slate-300 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white">
                    Consultar como paciente
                  </button>
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-2">
              {/* PACIENTE */}
              <Link href="/portal/paciente" className="group no-underline">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                      <User className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-white">
                        Pacientes
                      </h2>
                      <p className="text-xs text-slate-500">
                        Descargue sus resultados
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">Documento de identidad</label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-500">
                        <Fingerprint className="size-4 shrink-0 text-slate-600" />
                        <span>Ingrese su DNI</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">C&oacute;digo de acceso</label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-500">
                        <Lock className="size-4 shrink-0 text-slate-600" />
                        <span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-medium text-white transition-all duration-300 group-hover:bg-sky-400">
                      Consultar resultados
                      <ArrowRight className="size-4" />
                    </div>
                    <p className="text-center text-[11px] text-slate-600">
                      Sin registro. Solo su DNI y el c&oacute;digo del laboratorio.
                    </p>
                  </div>
                </div>
              </Link>

              {/* LABORATORIO */}
              <Link href="/portal/lab" className="group no-underline">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-white">
                        Laboratorios
                      </h2>
                      <p className="text-xs text-slate-500">
                        Acceso profesional
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">Correo institucional</label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-500">
                        <Building2 className="size-4 shrink-0 text-slate-600" />
                        <span>lab@institucion.com</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">Contrase&ntilde;a</label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-500">
                        <Lock className="size-4 shrink-0 text-slate-600" />
                        <span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-sm font-medium text-indigo-300 transition-all duration-300 hover:bg-indigo-500/20 hover:text-indigo-200">
                      Iniciar sesi&oacute;n
                      <ArrowRight className="size-4" />
                    </div>
                    <p className="text-center text-[11px] text-slate-600">
                      <span className="text-indigo-400 underline underline-offset-2">Solicite su alta</span> como instituci&oacute;n derivante
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== LAB INFO ===== */}
        <section className="relative px-4 py-20 sm:px-6">
          <GlowOrb className="-top-40 right-0 h-[400px] w-[400px]" color="sky" />
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl md:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                <Microscope className="size-5" />
              </div>
              <h2 className="font-heading mb-2 text-base font-semibold text-white">
                Sobre el laboratorio
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                M&aacute;s de 15 a&ntilde;os dedicados al diagn&oacute;stico citol&oacute;gico.
                Procesamos y analizamos muestras ginecol&oacute;gicas y no ginecol&oacute;gicas
                bajo est&aacute;ndares internacionales de calidad.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Citopatolog&iacute;a", "PAAF", "Base L&iacute;quida", "Bethesda 2024"].map((t) => (
                  <span key={t} className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-500">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SEGURIDAD ===== */}
        <section className="relative px-4 pb-24 pt-4 sm:px-6">
          <GlowOrb className="-bottom-60 right-0 h-[500px] w-[500px]" color="indigo" />
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-balance text-[clamp(1.25rem,3vw,2rem)] font-bold leading-tight tracking-tight text-white">
                Protecci&oacute;n de datos cl&iacute;nicos
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                La confidencialidad de su informaci&oacute;n es prioridad. Cumplimos con
                los est&aacute;ndares de seguridad y privacidad vigentes.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { icon: Lock, title: "Cifrado AES-256", desc: "Datos protegidos durante la transmisi&oacute;n y el almacenamiento." },
                { icon: Fingerprint, title: "Acceso por token", desc: "Cada descarga requiere credenciales &uacute;nicas e intransferibles." },
                { icon: ShieldCheck, title: "Cumplimiento legal", desc: "Conforme a Ley 25.326, RGPD y est&aacute;ndares HIPAA." },
                { icon: FileText, title: "Firma digital", desc: "Informes respaldados con firma SHA-256 y sello profesional." },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="font-heading mb-1 text-sm font-semibold text-white">{f.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <Link href="/" className="mb-3 flex items-center gap-2 no-underline">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-blue-700 text-[8px] font-bold text-white">
                  LP
                </div>
                <span className="font-heading text-xs font-semibold text-white">
                  Citopatolog&iacute;a Placon&aacute;
                </span>
              </Link>
              <p className="text-xs leading-relaxed text-slate-600">
                Diagn&oacute;stico citol&oacute;gico de precisi&oacute;n. Portal digital
                para descarga de resultados.
              </p>
            </div>

            <div className="md:col-span-1">
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                Accesos directos
              </h4>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "Portal del paciente", href: "/portal/paciente" },
                  { label: "Portal laboratorios", href: "/portal/lab" },
                  { label: "Iniciar sesi&oacute;n", href: "/login" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-xs text-slate-500 no-underline transition-colors hover:text-slate-300">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Dra. Liliana M. Placon&aacute;. Todos los derechos reservados.</p>
            <p>MN 128.403 &middot; Citopatolog&iacute;a Cl&iacute;nica</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
