"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) router.replace(`/auth/callback?code=${code}`);
  }, [searchParams, router]);
  return null;
}

const PROBLEMS = [
  { title: "Informes inconsistentes", desc: "Cada citólogo escribe a su manera. Sin estandarización, los informes pierden calidad y claridad.", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" },
  { title: "Pérdida de tiempo escribiendo", desc: "Tipear cada diagnóstico desde cero lleva minutos preciosos que podrías dedicar al análisis.", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Resultados extraviados", desc: "Entregar resultados a los pacientes requiere coordinación, llamadas y seguimiento constante.", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
];

const SOLUTIONS = [
  { number: "01", title: "Macros Bethesda", desc: "Escribí .lsil y obtené el texto completo del diagnóstico. Más de 110 macros basadas en el Sistema Bethesda.", tag: "110+ macros", accent: "rgba(122,46,58,0.08)" },
  { number: "02", title: "Órdenes inteligentes", desc: "Cada muestra con su orden y seguimiento de estado. Trazabilidad completa desde el ingreso hasta la entrega.", tag: "trazabilidad", accent: "rgba(180,140,80,0.1)" },
  { number: "03", title: "Portal del paciente", desc: "Resultados seguros vía token único. Sin registro, sin contraseñas. Acceso directo desde cualquier dispositivo.", tag: "sin fricción", accent: "rgba(122,46,58,0.06)" },
  { number: "04", title: "Firma y sello digital", desc: "Firma electrónica con respaldo SHA-256. PDF con sello personalizado del laboratorio. Validez y trazabilidad garantizada.", tag: "criptografía", accent: "rgba(180,140,80,0.08)" },
  { number: "05", title: "Notificaciones automáticas", desc: "Configurá el envío de resultados por email. Programá envíos inmediatos o diferidos según tu flujo.", tag: "automático", accent: "rgba(122,46,58,0.07)" },
  { number: "06", title: "Multi-laboratorio", desc: "Varios laboratorios desde una cuenta. Cada uno con su configuración, usuarios y estadísticas independientes.", tag: "escalable", accent: "rgba(180,140,80,0.09)" },
];

const STEPS = [
  { num: "I", title: "Cargar la orden", desc: "Registrá el paciente, seleccioná el laboratorio y el tipo de estudio. El sistema genera el identificador único de la muestra.", detail: "15 segundos" },
  { num: "II", title: "Procesar con macros", desc: "Redactá el diagnóstico usando las macros Bethesda. Completá informes precisos en segundos, no en minutos.", detail: "2 minutos" },
  { num: "III", title: "Firmar y enviar", desc: "Revisá, firmá digitalmente y el resultado se envía automáticamente al paciente por email. Todo queda registrado.", detail: "1 clic" },
];

const PRICING = [
  {
    title: "Laboratorio",
    price: "Gratis",
    period: "",
    desc: "Para un solo laboratorio. Todo lo necesario para empezar.",
    features: ["Usuarios ilimitados", "Macros Bethesda", "Órdenes y pacientes", "Portal del paciente", "Firma digital"],
    cta: "Comenzar",
    featured: false,
  },
  {
    title: "Multi-lab",
    price: "A consultar",
    period: "",
    desc: "Para cadenas y redes de laboratorios. Configuración independiente por sede.",
    features: ["Todo el plan Laboratorio", "Múltiples sedes", "Configuración por lab", "Estadísticas globales", "Sellos personalizados", "Soporte prioritario"],
    cta: "Contactar",
    featured: true,
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const burgundy = "#7a2e3a";
  const gold = "#b48c50";
  const cream = "#faf8f5";
  const ink = "#1a1816";

  const btnPrimary = {
    backgroundColor: burgundy,
    color: cream,
    boxShadow: "0 8px 24px rgba(122,46,58,0.2)",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0 1.75rem",
    height: "3rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const btnSecondary = {
    color: "#6b6560",
    border: "1px solid rgba(26,24,22,0.08)",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0 1.5rem",
    height: "3rem",
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: cream, color: ink }}>
      <Suspense fallback={null}>
        <AuthCallbackHandler />
      </Suspense>

      {/* ===== HEADER ===== */}
      <header
        style={{
          position: "fixed",
          top: 0,
          insetInline: 0,
          zIndex: 50,
          transition: "all 0.3s",
          backgroundColor: scrolled ? "rgba(250,248,245,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(26,24,22,0.06)" : "1px solid transparent",
        }}
      >
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", height: "4rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: burgundy, color: cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: "0.875rem" }}>
              P
            </div>
            <span style={{ fontSize: "1rem", fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "-0.02em", color: ink }}>
              PAP <span style={{ color: burgundy }}>Diagnóstico</span>
            </span>
          </Link>
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: "0.25rem" }}>
            {[
              { label: "Cómo funciona", href: "#proceso" },
              { label: "Planes", href: "#planes" },
              { label: "Pacientes", href: "/portal/paciente" },
            ].map((l) => (
              <Link key={l.label} href={l.href} style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem", color: "#6b6560", borderRadius: "0.5rem", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6560")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/login">
              <button className="hidden sm:inline-flex" style={{ height: "2.25rem", padding: "0 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", color: "#6b6560", border: "1px solid rgba(26,24,22,0.1)", backgroundColor: "transparent", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = ink; e.currentTarget.style.borderColor = "rgba(26,24,22,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6560"; e.currentTarget.style.borderColor = "rgba(26,24,22,0.1)"; }}
              >
                Iniciar sesión
              </button>
            </Link>
            <Link href="/login">
              <button style={{ height: "2.25rem", padding: "0 1.25rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: burgundy, color: cream, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", transition: "all 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#8a3a47")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = burgundy)}
              >
                Comenzar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", border: "1px solid rgba(26,24,22,0.1)", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="16" style={{ color: ink }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        <div className="md:hidden" style={{ overflow: "hidden", transition: "max-height 0.3s", maxHeight: menuOpen ? "300px" : "0px", borderBottom: menuOpen ? "1px solid rgba(26,24,22,0.06)" : "none", backgroundColor: cream }}>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {["Cómo funciona", "Planes", "Pacientes"].map((l) => (
              <Link key={l} href={l === "Pacientes" ? "/portal/paciente" : `#${l === "Cómo funciona" ? "proceso" : "planes"}`} onClick={() => setMenuOpen(false)}
                style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: "#6b6560", borderRadius: "0.5rem", textDecoration: "none" }}>
                {l}
              </Link>
            ))}
            <hr style={{ borderColor: "rgba(26,24,22,0.06)", margin: "0.25rem 0" }} />
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", fontWeight: 500, color: burgundy, textDecoration: "none" }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section style={{ position: "relative", paddingTop: "8rem", paddingBottom: "5rem", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(122,46,58,0.03) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", top: "4rem", right: "10%", width: "20rem", height: "20rem", borderRadius: "50%", background: "radial-gradient(circle, rgba(122,46,58,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "4rem", left: "5%", width: "16rem", height: "16rem", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,140,80,0.04) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ maxWidth: "52rem", margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, backgroundColor: "rgba(180,140,80,0.1)", color: gold, border: "1px solid rgba(180,140,80,0.15)", marginBottom: "2rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.113.443-.276.934-.535 1.361" />
              </svg>
              Para laboratorios de citología
            </div>
            <h1 style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)", fontFamily: "var(--font-fraunces)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: ink, marginBottom: "1.25rem" }}>
              Gestioná tu laboratorio de citología{" "}
              <span style={{ color: burgundy, position: "relative" }}>
                de principio a fin
                <svg style={{ position: "absolute", bottom: "-0.125rem", left: 0, right: 0, width: "100%", height: "0.375rem" }} viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,8 Q25,2 50,8 T100,8" fill="none" stroke={gold} strokeWidth="2" opacity="0.4" />
                </svg>
              </span>
            </h1>
            <p style={{ fontSize: "1.125rem", lineHeight: 1.7, color: "#6b6560", maxWidth: "36rem", margin: "0 auto 2rem" }}>
              Una plataforma pensada para el flujo de trabajo real del laboratorio de citología.
              Desde el ingreso de la muestra hasta la entrega del resultado al paciente.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <Link href="/login">
                <button
                  style={btnPrimary}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#8a3a47"; e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = burgundy; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  Probar gratis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <Link href="#proceso">
                <button
                  style={btnSecondary}
                  onMouseEnter={(e) => { e.currentTarget.style.color = ink; e.currentTarget.style.borderColor = "rgba(26,24,22,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6560"; e.currentTarget.style.borderColor = "rgba(26,24,22,0.08)"; }}
                >
                  Cómo funciona
                </button>
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", marginTop: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ display: "flex" }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(122,46,58,0.08), rgba(122,46,58,0.03))", border: "2px solid " + cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 700, color: "rgba(122,46,58,0.3)", marginLeft: i > 0 ? "-0.375rem" : 0 }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", backgroundColor: "rgba(122,46,58,0.12)", border: "2px solid " + cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 700, color: burgundy, marginLeft: "-0.375rem" }}>
                    8+
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#8a8580" }}>laboratorios activos</span>
              </div>
              <div style={{ width: "1px", height: "2rem", backgroundColor: "rgba(26,24,22,0.06)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" style={{ color: gold }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span style={{ fontSize: "0.75rem", color: "#8a8580", marginLeft: "0.25rem" }}>4.9</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM → SOLUTION ===== */}
      <section style={{ padding: "5rem 1.25rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {PROBLEMS.map((p) => (
              <div key={p.title} style={{ padding: "0", border: "none", backgroundColor: "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(122,46,58,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" style={{ color: burgundy }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#8a8580", fontWeight: 600 }}>Problema</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontFamily: "var(--font-fraunces)", fontWeight: 600, color: ink, marginBottom: "0.375rem" }}>{p.title}</h3>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#8a8580" }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1.25rem", borderRadius: "9999px", backgroundColor: "rgba(122,46,58,0.04)", border: "1px solid rgba(122,46,58,0.08)" }}>
              <svg width="16" height="16" style={{ color: burgundy }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              <span style={{ fontSize: "0.75rem", color: "#6b6560" }}>PAP Diagnóstico resuelve estos problemas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="proceso" style={{ padding: "5rem 1.25rem", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: gold, fontWeight: 500 }}>Proceso</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "-0.02em", color: ink, marginTop: "0.75rem", lineHeight: 1.1 }}>
              Del laboratorio al paciente en tres pasos
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", backgroundColor: i === 1 ? burgundy : "rgba(26,24,22,0.04)", color: i === 1 ? "#ffffff" : "#8a8580", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-fraunces)" }}>
                    {s.num}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(26,24,22,0.08), transparent)" }} className="hidden sm:block" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontFamily: "var(--font-fraunces)", fontWeight: 600, color: ink }}>{s.title}</h3>
                  <span style={{ fontSize: "0.625rem", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", backgroundColor: "rgba(180,140,80,0.1)", color: gold, fontWeight: 500 }}>{s.detail}</span>
                </div>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "#8a8580" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTIONS GRID ===== */}
      <section style={{ padding: "5rem 1.25rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: gold, fontWeight: 500 }}>Capacidades</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "-0.02em", color: ink, marginTop: "0.75rem", lineHeight: 1.1 }}>
              Todo lo que necesita un laboratorio
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {SOLUTIONS.map((s) => (
              <div
                key={s.number}
                style={{
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(26,24,22,0.06)",
                  transition: "all 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,24,22,0.06)";
                  e.currentTarget.style.borderColor = "rgba(122,46,58,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "rgba(26,24,22,0.06)";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2rem", fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "rgba(26,24,22,0.04)", lineHeight: 1 }}>{s.number}</span>
                  <span style={{ fontSize: "0.625rem", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", backgroundColor: s.accent, color: burgundy, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.tag}</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontFamily: "var(--font-fraunces)", fontWeight: 600, color: ink, marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.7, color: "#8a8580" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUOTE ===== */}
      <section style={{ padding: "5rem 1.25rem", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>
          <div style={{ position: "relative" }}>
            <svg width="40" height="40" style={{ position: "absolute", top: "-1.5rem", left: 0, opacity: 0.15, color: burgundy }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179z" />
            </svg>
            <blockquote>
              <p style={{ fontSize: "1.5rem", fontFamily: "var(--font-fraunces)", fontWeight: 600, lineHeight: 1.5, color: ink }}>
                "Antes tardábamos 20 minutos por informe. Ahora, con las macros Bethesda, redujimos el tiempo a la mitad. Los pacientes reciben sus resultados el mismo día."
              </p>
            </blockquote>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "2rem" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", backgroundColor: "rgba(122,46,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: burgundy, fontFamily: "var(--font-fraunces)" }}>L</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: ink }}>Dra. Laura Spalcona</p>
              <p style={{ fontSize: "0.75rem", color: "#8a8580" }}>Directora · Mi Laboratorio</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="planes" style={{ padding: "5rem 1.25rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: gold, fontWeight: 500 }}>Planes</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "-0.02em", color: ink, marginTop: "0.75rem" }}>
              Empezá gratis. Escalá cuando lo necesites.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
            {PRICING.map((p) => (
              <div
                key={p.title}
                style={{
                  padding: "2rem",
                  borderRadius: "1.25rem",
                  backgroundColor: p.featured ? burgundy : "#ffffff",
                  border: p.featured ? "none" : "1px solid rgba(26,24,22,0.06)",
                  position: "relative",
                }}
              >
                {p.featured && <div style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "0.625rem", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Recomendado</div>}
                <h3 style={{ fontSize: "1.125rem", fontFamily: "var(--font-fraunces)", fontWeight: 600, color: p.featured ? "#ffffff" : ink, marginBottom: "0.25rem" }}>{p.title}</h3>
                <p style={{ fontSize: "0.8125rem", color: p.featured ? "rgba(255,255,255,0.7)" : "#8a8580", marginBottom: "1.5rem" }}>{p.desc}</p>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "2rem", fontFamily: "var(--font-fraunces)", fontWeight: 700, color: p.featured ? "#ffffff" : ink }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: "0.875rem", color: p.featured ? "rgba(255,255,255,0.6)" : "#8a8580", marginLeft: "0.25rem" }}>{p.period}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: p.featured ? "rgba(255,255,255,0.8)" : "#6b6560" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "rgba(255,255,255,0.6)" : burgundy} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <button
                    style={{
                      width: "100%",
                      padding: "0 1.5rem",
                      height: "2.75rem",
                      borderRadius: "0.75rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor: p.featured ? "#ffffff" : "rgba(122,46,58,0.08)",
                      color: p.featured ? burgundy : burgundy,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {p.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ padding: "5rem 1.25rem", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, backgroundColor: "rgba(180,140,80,0.1)", color: gold, marginBottom: "1.5rem" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Comenzá hoy
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "-0.02em", color: ink, lineHeight: 1.1, marginBottom: "1rem" }}>
            Optimizá el flujo de trabajo de tu laboratorio
          </h2>
          <p style={{ fontSize: "1rem", color: "#8a8580", maxWidth: "30rem", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            Sin configuración compleja, sin inversión inicial. Empezá a usar PAP Diagnóstico en minutos.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <Link href="/login">
              <button
                style={btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#8a3a47"; e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = burgundy; e.currentTarget.style.transform = "scale(1)"; }}
              >
                Probar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Link>
            <Link href="/portal/paciente">
              <button
                style={btnSecondary}
                onMouseEnter={(e) => { e.currentTarget.style.color = ink; e.currentTarget.style.borderColor = "rgba(26,24,22,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6560"; e.currentTarget.style.borderColor = "rgba(26,24,22,0.08)"; }}
              >
                Acceso paciente
              </button>
            </Link>
          </div>
          <p style={{ fontSize: "0.75rem", color: "rgba(26,24,22,0.3)", marginTop: "1.5rem" }}>Sin tarjeta de crédito · Configuración en 5 minutos</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ padding: "4rem 1.25rem", borderTop: "1px solid rgba(26,24,22,0.06)", backgroundColor: cream }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem", textDecoration: "none" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: burgundy, color: cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: "0.875rem" }}>
                  P
                </div>
                <span style={{ fontSize: "1rem", fontFamily: "var(--font-fraunces)", fontWeight: 700, color: ink }}>PAP Diagnóstico</span>
              </Link>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#8a8580", maxWidth: "20rem" }}>
                Plataforma SaaS para laboratorios de citología. Rápida, segura y pensada para el flujo de trabajo real.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
                {["X", "LI", "GH"].map((s) => (
                  <Link key={s} href="#" style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", border: "1px solid rgba(26,24,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", color: "#8a8580", textDecoration: "none", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = ink; e.currentTarget.style.borderColor = "rgba(26,24,22,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8a8580"; e.currentTarget.style.borderColor = "rgba(26,24,22,0.08)"; }}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            {[
              { title: "Producto", items: ["Funcionalidades", "Precios", "Laboratorios", "Portal paciente"] },
              { title: "Recursos", items: ["Documentación", "API", "Estado", "Blog"] },
              { title: "Legal", items: ["Términos", "Privacidad", "Soporte", "Contacto"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, color: "#8a8580", marginBottom: "1.25rem" }}>{col.title}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {col.items.map((item) => (
                    <li key={item}>
                      <Link href="#" style={{ fontSize: "0.8125rem", color: "#6b6560", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = ink)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6560")}
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(26,24,22,0.06)", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.75rem", color: "rgba(26,24,22,0.3)" }}>&copy; {new Date().getFullYear()} PAP Diagnóstico. Todos los derechos reservados.</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(26,24,22,0.15)" }}>Hecho para citólogos, por citólogos</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
