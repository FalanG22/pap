"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Microscope,
  ShieldCheck,
  FileSearch,
  Dna,
  FlaskConical,
  Syringe,
  ArrowRight,
  Lock,
  User,
  Building2,
  Fingerprint,
  FileText,
  CheckCircle2,
  ScrollText,
  Activity,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Servicios", href: "#servicios" },
  { label: "Sobre mí", href: "#sobre-mi" },
]

const SERVICES = [
  {
    icon: Microscope,
    title: "Citología Cervicovaginal",
    desc: "Detección temprana de lesiones intraepiteliales y cáncer de cuello uterino mediante técnica de Papanicolaou convencional y en base líquida.",
    size: "md",
  },
  {
    icon: FlaskConical,
    title: "Citología en Base Líquida",
    desc: "Procesamiento con tecnología ThinPrep® y SurePath®. Mayor sensibilidad diagnóstica y muestra apta para estudio molecular de VPH.",
    size: "sm",
  },
  {
    icon: Dna,
    title: "Citología No Ginecológica",
    desc: "Análisis de muestras de tracto respiratorio, urinario, derrames cavitarios y LCR. Diagnóstico diferencial oncológico e inflamatorio.",
    size: "sm",
  },
  {
    icon: Syringe,
    title: "PAAF (Punción Aspirativa)",
    desc: "Evaluación on-site (ROSE) y diagnóstico diferencial de nódulos tiroideos, lesiones mamarias, adenopatías y masas de partes blandas.",
    size: "md",
  },
  {
    icon: FileSearch,
    title: "Citología de Orina",
    desc: "Detección de células uroteliales atípicas en orina fresca y fijada. Seguimiento de neoplasias vesicales y cribado en poblaciones de riesgo.",
    size: "sm",
  },
  {
    icon: ScrollText,
    title: "Informes Bethesda",
    desc: "Estructuración diagnóstica bajo el Sistema Bethesda 2024 con nomenclatura estandarizada, evaluación de calidad muestral y correlación histológica.",
    size: "sm",
  },
  {
    icon: Activity,
    title: "Estudios Inmunocitoquímicos",
    desc: "Panel de marcadores oncológicos sobre extendido citológico. Apoyo diagnóstico en neoplasias de origen primario desconocido.",
    size: "full",
  },
]

const TRUST_FEATURES = [
  {
    icon: Lock,
    title: "Cifrado de extremo a extremo",
    desc: "Todos los resultados se transmiten con cifrado AES-256. Los datos del paciente permanecen protegidos en todo momento.",
  },
  {
    icon: Fingerprint,
    title: "Autenticación biométrica",
    desc: "Acceso mediante credenciales únicas y tokens temporales. Cada descarga queda registrada en la bitácora de auditoría.",
  },
  {
    icon: ShieldCheck,
    title: "Cumplimiento normativo",
    desc: "Conforme a la Ley de Datos Personales (Ley 25.326), RGPD y estándares HIPAA para información sensible de salud.",
  },
  {
    icon: FileText,
    title: "Respaldo de firma digital",
    desc: "Cada informe se emite con firma digital respaldada por SHA-256 y sello profesional, garantizando integridad y no repudio.",
  },
]

const BentoCard = ({
  className,
  children,
  hover = true,
}: {
  className?: string
  children: React.ReactNode
  hover?: boolean
}) => (
  <div
    className={cn(
      "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl md:p-8",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
      hover &&
        "transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:before:opacity-100",
      className,
    )}
  >
    {children}
  </div>
)

function GlowOrb({
  className,
  color = "emerald",
}: {
  className?: string
  color?: "emerald" | "cyan" | "teal"
}) {
  const colors = {
    emerald: "rgba(52,211,153,0.12)",
    cyan: "rgba(6,182,212,0.10)",
    teal: "rgba(20,184,166,0.10)",
  }
  return (
    <div
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ backgroundColor: colors[color] }}
    />
  )
}

export default function CitologoPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <GlowOrb className="-top-40 right-0 h-[600px] w-[600px]" color="emerald" />
      <GlowOrb className="-bottom-60 left-0 h-[500px] w-[500px]" color="cyan" />

      {/* ===== NAVBAR ===== */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-slate-950/80 shadow-[0_1px_30px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/citologo" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
              D
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-base font-semibold tracking-tight text-white">
                Dra. Marina Rivas
              </span>
              <span className="text-[11px] font-medium tracking-wider text-emerald-400/70">
                CITÓLOGA CLÍNICA
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 no-underline transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="relative hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/30 sm:inline-flex">
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

        {/* Mobile menu */}
        <div
          className={cn(
            "overflow-hidden border-b border-white/[0.06] bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 md:hidden",
            menuOpen ? "max-h-80" : "max-h-0",
          )}
        >
          <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-400 no-underline transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/[0.06]" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-sm font-semibold text-white no-underline"
            >
              <Lock className="size-3.5" />
              Portal de Resultados
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ===== HERO ===== */}
        <section className="relative px-4 pb-20 pt-36 sm:px-6 sm:pt-44">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-4 py-1.5 text-xs font-medium text-emerald-400">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                Diagnóstico Citológico de Precisión
              </div>

              <h1 className="font-heading text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white">
                Resultados{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  precisos
                </span>
                , portal{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-400 bg-clip-text text-transparent">
                  digital seguro
                </span>
              </h1>

              <p className="text-balance mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
                Acceda a sus informes citológicos con la confianza del diagnóstico
                especializado. Un servicio integral para pacientes y doctores, con
                la seguridad que exige la medicina moderna.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/login">
                  <button className="group relative inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/40">
                    <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    Ingresar al Portal de Resultados
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </Link>
                <Link href="#servicios">
                  <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white">
                    Nuestros Servicios
                  </button>
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Resultados en 48-72 h</span>
                </div>
                <div className="hidden h-4 w-px bg-white/[0.08] sm:block" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Portal seguro 24/7</span>
                </div>
                <div className="hidden h-4 w-px bg-white/[0.08] md:block" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Informes con firma digital</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== DUAL PORTAL ACCESS WIDGET ===== */}
        <section className="relative px-4 pb-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Patient Portal */}
              <BentoCard className="relative overflow-hidden">
                <GlowOrb className="-right-20 -top-20 h-64 w-64" color="emerald" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                      <User className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-white">
                        Para Pacientes
                      </h3>
                      <p className="text-xs text-slate-400">
                        Descargue sus resultados en segundos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Documento de identidad
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                        <Fingerprint className="size-4 text-slate-500" />
                        <span className="text-slate-500">Ingrese su DNI</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Código de acceso
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                        <Lock className="size-4 text-slate-500" />
                        <span className="text-slate-500">••••••••</span>
                      </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition-all duration-300 hover:bg-emerald-400">
                      Consultar resultados
                      <ArrowRight className="size-4" />
                    </button>
                    <p className="text-center text-[11px] text-slate-500">
                      Sin registro. Solo su DNI y el código entregado por el
                      Doctor.
                    </p>
                  </div>
                </div>
              </BentoCard>

              {/* Lab Portal */}
              <BentoCard className="relative overflow-hidden">
                <GlowOrb className="-bottom-20 -left-20 h-64 w-64" color="cyan" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-white">
                        Para Doctores
                      </h3>
                      <p className="text-xs text-slate-400">
                        Acceso profesional para instituciones
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Correo institucional
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                        <Building2 className="size-4 text-slate-500" />
                        <span className="text-slate-500">lab@ejemplo.com</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Contraseña
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                        <Lock className="size-4 text-slate-500" />
                        <span className="text-slate-500">••••••••</span>
                      </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-semibold text-cyan-300 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:bg-cyan-500/20 hover:text-cyan-200">
                      Iniciar sesión como Doctor
                      <ArrowRight className="size-4" />
                    </button>
                    <p className="text-center text-[11px] text-slate-500">
                      ¿No tiene cuenta?{" "}
                      <Link href="/register" className="text-cyan-400 underline underline-offset-2">
                        Solicite su alta
                      </Link>
                    </p>
                  </div>
                </div>
              </BentoCard>
            </div>
          </div>
        </section>

        {/* ===== SERVICES BENTO GRID ===== */}
        <section id="servicios" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Servicios
              </span>
              <h2 className="font-heading text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-white">
                Diagnóstico citológico con estándares internacionales
              </h2>
              <p className="mt-4 text-slate-400">
                Cada estudio es analizado bajo los más altos criterios de calidad
                diagnóstica, con trazabilidad total desde la recepción de la muestra
                hasta la entrega del informe final.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {SERVICES.map((svc, i) => {
                const Icon = svc.icon
                const spans: Record<string, string> = {
                  md: "md:col-span-2",
                  sm: "md:col-span-1",
                  full: "md:col-span-4",
                }
                return (
                  <BentoCard
                    key={i}
                    className={cn(
                      spans[svc.size] || "md:col-span-1",
                      "group/card",
                    )}
                  >
                    <div className="flex h-full flex-col">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 transition-all duration-500 group-hover/card:bg-emerald-500/15 group-hover/card:ring-emerald-500/30">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="font-heading mb-2 text-base font-semibold text-white">
                        {svc.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {svc.desc}
                      </p>
                    </div>
                  </BentoCard>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== ABOUT / QUOTE ===== */}
        <section id="sobre-mi" className="relative px-4 py-24 sm:px-6">
          <GlowOrb className="-top-40 right-0 h-[400px] w-[400px]" color="teal" />
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-5">
              <BentoCard className="relative md:col-span-2 md:row-span-2">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 ring-1 ring-white/[0.08]">
                    <span className="font-heading text-4xl font-bold text-white">
                      MR
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-white">
                    Dra. Marina Rivas
                  </h3>
                  <p className="mt-1 text-sm text-emerald-400">
                    Citóloga Clínica · MN 128.403
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {["Citopatología", "Citología Ginecológica", "PAAF", "Docencia"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </BentoCard>

              <BentoCard className="md:col-span-3">
                <div className="flex h-full flex-col justify-center">
                  <p className="font-heading text-balance text-lg leading-relaxed text-slate-200 md:text-xl">
                    "Cada muestra citológica cuenta una historia. Mi compromiso es
                    leerla con precisión, empatía y el respaldo de la evidencia
                    científica más actualizada."
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-xs text-slate-500">
                      Dra. Marina Rivas
                    </span>
                  </div>
                </div>
              </BentoCard>

              <BentoCard className="md:col-span-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { value: "15+", label: "Años de experiencia" },
                    { value: "12K+", label: "Informes emitidos" },
                    { value: "98.7%", label: "Precisión diagnóstica" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="font-heading text-2xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>
          </div>
        </section>

        {/* ===== TRUST & SECURITY ===== */}
        <section className="relative px-4 py-24 sm:px-6">
          <GlowOrb className="-bottom-60 right-0 h-[500px] w-[500px]" color="emerald" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Seguridad y Confianza
              </span>
              <h2 className="font-heading text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-white">
                Sus datos protegidos en cada etapa
              </h2>
              <p className="mt-4 text-slate-400">
                La confidencialidad de la información clínica es la base de nuestro
                servicio. Implementamos los más altos estándares de seguridad digital
                para la protección de sus resultados.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {TRUST_FEATURES.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <BentoCard key={i}>
                    <div className="flex h-full flex-col">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="font-heading mb-2 text-base font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {feature.desc}
                      </p>
                    </div>
                  </BentoCard>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="px-4 pb-32 pt-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <BentoCard className="relative overflow-hidden text-center">
              <GlowOrb className="-right-40 -top-40 h-[500px] w-[500px]" color="emerald" />
              <GlowOrb className="-bottom-40 -left-40 h-[400px] w-[400px]" color="cyan" />
              <div className="relative z-10 mx-auto max-w-2xl py-8">
                <h2 className="font-heading text-balance text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-white">
                  ¿Es doctor o profesional de la salud?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-slate-400">
                  Solicite su alta como institución derivante y acceda al panel de
                  gestión de resultados, estadísticas y descarga masiva de informes.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register">
                    <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/30">
                      Solicitar alta institucional
                      <ArrowRight className="size-4" />
                    </button>
                  </Link>
                  <Link href="/contacto">
                    <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white">
                      Contacto directo
                    </button>
                  </Link>
                </div>
              </div>
            </BentoCard>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/citologo" className="mb-4 flex items-center gap-2.5 no-underline">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
                  D
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-heading text-sm font-semibold text-white">
                    Dra. Marina Rivas
                  </span>
                  <span className="text-[10px] font-medium tracking-wider text-emerald-400/60">
                    CITÓLOGA CLÍNICA
                  </span>
                </div>
              </Link>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-slate-500">
                Consultorio privado de citopatología con más de 15 años de trayectoria.
                Diagnóstico de precisión, informes estandarizados y portal digital
                seguro para pacientes y doctores.
              </p>
              <div className="flex gap-3">
                {["LinkedIn", "Email", "WhatsApp"].map((s) => (
                  <Link
                    key={s}
                    href="#"
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500 no-underline transition-colors hover:border-white/[0.12] hover:text-slate-300"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Servicios
              </h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Citología Cervicovaginal",
                  "Base Líquida",
                  "No Ginecológica",
                  "PAAF",
                  "Inmunocitoquímica",
                ].map((item) => (
                  <li key={item}>
                    <Link
                      href="#servicios"
                      className="text-sm text-slate-500 no-underline transition-colors hover:text-slate-300"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Enlaces
              </h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "Portal Pacientes", href: "/portal/paciente" },
                  { label: "Portal Doctores", href: "/portal/lab" },
                  { label: "Aviso de Privacidad", href: "#" },
                  { label: "Términos de Uso", href: "#" },
                  { label: "Contacto", href: "/contacto" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 no-underline transition-colors hover:text-slate-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-600 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Dra. Marina Rivas. Todos los derechos reservados.</p>
            <p className="text-slate-700">MN 128.403 · Citopatología Clínica</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
