"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Macro, DEFAULT_MACROS, searchMacros } from "@/lib/macros";
import { cn } from "@/lib/utils";

export function MacroInput({
  value,
  onChange,
  disabled,
  macros = DEFAULT_MACROS,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  macros?: Macro[];
}) {
  const [suggestions, setSuggestions] = useState<Macro[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [macroPos, setMacroPos] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getMacroAtCursor = useCallback((text: string, cursorPos: number) => {
    // Buscar hacia atrás desde el cursor hasta encontrar un espacio o inicio
    let start = cursorPos - 1;
    while (start >= 0 && text[start] !== ' ' && text[start] !== '\n') start--;
    start++; // posición del primer carácter de la palabra

    const word = text.slice(start, cursorPos);
    if (word.startsWith('.')) {
      return { word, start, end: cursorPos };
    }
    return null;
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const found = getMacroAtCursor(text, cursor);
    if (found) {
      const results = searchMacros(found.word, macros);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(0);
      setMacroPos(found);
    } else {
      setShowSuggestions(false);
      setMacroPos(null);
    }
  }

  function handleSelect(macro: Macro) {
    if (!macroPos) return;
    const before = value.slice(0, macroPos.start);
    const after = value.slice(macroPos.end);
    const newText = before + macro.full_text + after;
    onChange(newText);
    setShowSuggestions(false);
    setMacroPos(null);

    // Poner cursor después del texto insertado
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        const pos = before.length + macro.full_text.length;
        ta.setSelectionRange(pos, pos);
        ta.focus();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Escribí . + código de macro (ej: .b2) en cualquier parte del texto..."
        className="w-full min-h-[160px] rounded-xl border border-border bg-card px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-10 max-h-[200px] overflow-y-auto"
        >
          {suggestions.map((macro, i) => (
            <button
              key={macro.shortcode}
              onClick={() => handleSelect(macro)}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3",
                i === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
              )}
            >
              <code className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                {macro.shortcode}
              </code>
              <span className="line-clamp-1 text-muted-foreground">{macro.full_text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
