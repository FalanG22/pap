"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type StampTemplate = "circle" | "oval" | "rectangle";
type BorderStyle = "double" | "single" | "dashed";

type StampSize = "sm" | "md" | "lg";

const TEMPLATE_NAMES: Record<StampTemplate, string> = {
  circle: "Circular",
  oval: "Óvalo",
  rectangle: "Rectangular",
};

const BORDER_NAMES: Record<BorderStyle, string> = {
  double: "Doble línea",
  single: "Línea simple",
  dashed: "Línea punteada",
};

const SIZE_NAMES: Record<StampSize, string> = {
  sm: "Pequeño",
  md: "Mediano",
  lg: "Grande",
};

/** Altura en puntos del PDF para cada tamaño */
const PDF_HEIGHTS: Record<StampSize, number> = { sm: 48, md: 64, lg: 80 };
/** Tamaño del canvas de diseño (px) */
const CANVAS_SIZE = 400;

export function StampDesigner({
  onSave,
  onCancel,
  initialData,
}: {
  onSave: (dataUrl: string, size: StampSize) => void;
  onCancel: () => void;
  initialData?: { labName?: string; city?: string; title?: string; regNumber?: string };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [template, setTemplate] = useState<StampTemplate>("oval");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("double");
  const [stampSize, setStampSize] = useState<StampSize>("md");
  const [labName, setLabName] = useState(initialData?.labName || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [title, setTitle] = useState(initialData?.title || "LABORATORIO DE CITOLOGÍA");
  const [regNumber, setRegNumber] = useState(initialData?.regNumber || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = CANVAS_SIZE;
    const scale = window.devicePixelRatio || 1;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(scale, scale);

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const rx = template === "circle" ? 160 : 180;
    const ry = template === "oval" ? 135 : template === "circle" ? 160 : 110;

    ctx.save();

    // Clip
    ctx.beginPath();
    if (template === "rectangle") {
      ctx.roundRect(cx - rx, cy - ry, rx * 2, ry * 2, 14);
    } else {
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.clip();

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    ctx.restore();

    // Borde exterior
    ctx.save();
    ctx.beginPath();
    if (template === "rectangle") {
      ctx.roundRect(cx - rx, cy - ry, rx * 2, ry * 2, 14);
    } else {
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }

    if (borderStyle === "double") {
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      if (template === "rectangle") {
        ctx.roundRect(cx - rx + 9, cy - ry + 9, rx * 2 - 18, ry * 2 - 18, 9);
      } else {
        ctx.ellipse(cx, cy, rx - 9, ry - 9, 0, 0, Math.PI * 2);
      }
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (borderStyle === "dashed") {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    // Texto superior
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleText = city || title;
    ctx.font = "bold 14px 'Arial', sans-serif";
    ctx.fillStyle = "#1e3a5f";
    if (template === "rectangle") {
      ctx.fillText(titleText, cx, cy - 56);
    } else {
      ctx.fillText(titleText, cx, cy - ry + 30);
    }

    // Línea separadora
    const lineY = template === "rectangle" ? cy - 34 : cy - ry + 50;
    ctx.beginPath();
    ctx.moveTo(cx - 60, lineY);
    ctx.lineTo(cx + 60, lineY);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nombre del laboratorio
    ctx.font = "bold 20px 'Arial', sans-serif";
    ctx.fillStyle = "#1e3a5f";
    ctx.fillText(labName || "MI LABORATORIO", cx, template === "rectangle" ? cy - 6 : cy - 4);

    // Línea separadora inferior
    const lineY2 = template === "rectangle" ? cy + 20 : cy + 26;
    ctx.beginPath();
    ctx.moveTo(cx - 50, lineY2);
    ctx.lineTo(cx + 50, lineY2);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Matrícula
    if (regNumber) {
      ctx.font = "13px 'Arial', sans-serif";
      ctx.fillStyle = "#1e3a5f";
      ctx.fillText(`Mat. ${regNumber}`, cx, template === "rectangle" ? cy + 48 : cy + 56);
    }

    // Texto inferior
    const bottomText = "CITOLOGÍA · PAP";
    ctx.font = "11px 'Arial', sans-serif";
    ctx.fillStyle = "#4a5568";
    if (template === "rectangle") {
      ctx.fillText(bottomText, cx, cy + 76);
    } else {
      ctx.fillText(bottomText, cx, cy + ry - 26);
    }

    ctx.restore();

    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [template, borderStyle, labName, city, title, regNumber]);

  useEffect(() => { draw(); }, [draw]);

  // Dibujar previsualización a escala real del PDF
  useEffect(() => {
    const pv = previewCanvasRef.current;
    if (!pv || !previewUrl) return;
    const pctx = pv.getContext("2d");
    if (!pctx) return;

    const pdfH = PDF_HEIGHTS[stampSize];
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      const w = pdfH * aspect;
      pv.width = w * 2;
      pv.height = pdfH * 2;
      pv.style.width = `${w}px`;
      pv.style.height = `${pdfH}px`;
      pctx.clearRect(0, 0, pv.width, pv.height);
      pctx.drawImage(img, 0, 0, w * 2, pdfH * 2);
    };
    img.src = previewUrl;
  }, [previewUrl, stampSize]);

  const handleSave = () => {
    if (previewUrl) onSave(previewUrl, stampSize);
  };

  return (
    <div className="space-y-5">
      {/* Diseñador principal */}
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="rounded-lg border border-border shadow-sm" />
      </div>

      {/* Previsualización a escala PDF */}
      {previewUrl && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Vista previa en el PDF (tamaño real)
          </p>
          <div className="bg-white rounded-lg border border-border inline-flex p-3 items-center justify-center min-h-[60px]">
            <canvas ref={previewCanvasRef} className="object-contain" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Tamaño ({SIZE_NAMES[stampSize].toLowerCase()}): {PDF_HEIGHTS[stampSize]}pt de alto en el PDF
          </p>
        </div>
      )}

      {/* Templates */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Modelo</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TEMPLATE_NAMES) as [StampTemplate, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTemplate(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                template === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Border style */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Borde</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(BORDER_NAMES) as [BorderStyle, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setBorderStyle(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                borderStyle === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stamp size */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tamaño en el PDF</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SIZE_NAMES) as [StampSize, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStampSize(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                stampSize === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label} ({PDF_HEIGHTS[key]}pt)
            </button>
          ))}
        </div>
      </div>

      {/* Campos de texto */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nombre del laboratorio *</label>
          <input
            value={labName}
            onChange={e => setLabName(e.target.value)}
            placeholder="MI LABORATORIO"
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ciudad / texto superior</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="LABORATORIO DE CITOLOGÍA"
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Matrícula / Registro</label>
          <input
            value={regNumber}
            onChange={e => setRegNumber(e.target.value)}
            placeholder="MP 12345"
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="LABORATORIO DE CITOLOGÍA"
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Guardar sello
        </button>
      </div>
    </div>
  );
}
