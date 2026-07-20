"use client";

import { useEffect, useState, useRef } from "react";
import { Palette, Check } from "lucide-react";

// 8 beautiful distinct hues
const PRESETS = [
  { name: "Teal", hue: 172 },
  { name: "Yellow", hue: 45 },
  { name: "Indigo", hue: 220 },
  { name: "Purple", hue: 275 },
  { name: "Pink", hue: 320 },
  { name: "Rose", hue: 345 },
  { name: "Orange", hue: 25 },
  { name: "Emerald", hue: 145 },
];

export function ThemeColorToggle() {
  const [hue, setHue] = useState<number>(172);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Load from local storage
    const savedHue = localStorage.getItem("leetgit-theme-hue");
    if (savedHue) {
      const parsed = parseInt(savedHue, 10);
      setHue(parsed);
      document.documentElement.style.setProperty("--hue", savedHue);
    }

    // Handle clicks outside the popover
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateHue = (newHue: number) => {
    setHue(newHue);
    document.documentElement.style.setProperty("--hue", newHue.toString());
  };

  const commitHue = (newHue: number) => {
    localStorage.setItem("leetgit-theme-hue", newHue.toString());
  };

  if (!mounted) return (
    <div className="w-[34px] h-[34px] p-2 rounded-full" />
  );

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[36px] h-[36px] flex items-center justify-center transition-all duration-300 rounded-full hover:scale-105 ${isOpen ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30" : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
          }`}
        title="Theme Colors"
      >
        <Palette className="w-4.5 h-4.5" style={{ color: isOpen ? 'white' : `hsl(${hue}, 85%, 50%)` }} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-3 w-72 p-6 rounded-3xl z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl bg-[var(--color-surface)]/90 border border-white/10"
          style={{ boxShadow: `0 20px 40px -10px hsla(${hue}, 70%, 50%, 0.15), 0 0 0 1px hsla(${hue}, 70%, 50%, 0.1)` }}
        >

          <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-[0.2em] mb-4 text-center">Presets</h4>
          <div className="grid grid-cols-4 gap-4 px-2 mb-8">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  updateHue(preset.hue);
                  commitHue(preset.hue);
                }}
                className={`group relative aspect-square rounded-full transition-all duration-300 focus:outline-none hover:scale-110
                  ${hue === preset.hue ? "scale-110 shadow-[0_0_20px_var(--color-text-primary)]" : "hover:shadow-md ring-1 ring-white/10"}
                `}
                style={{
                  backgroundColor: `hsl(${preset.hue}, 85%, 50%)`,
                  boxShadow: hue === preset.hue ? `0 0 20px hsla(${preset.hue}, 85%, 50%, 0.6), inset 0 2px 4px rgba(255,255,255,0.3)` : 'inset 0 2px 4px rgba(255,255,255,0.3)'
                }}
                title={preset.name}
              >
                {hue === preset.hue && (
                  <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md animate-in zoom-in duration-300" strokeWidth={4} />
                )}
              </button>
            ))}
          </div>

          <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-[0.2em] mb-4 text-center mt-2">Custom Hue</h4>
          <div className="space-y-4 px-1">
            <div
              className="w-full h-3 rounded-full relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-white/5"
              style={{
                background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
              }}
            >
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => updateHue(parseInt(e.target.value, 10))}
                onPointerUp={() => commitHue(hue)}
                onTouchEnd={() => commitHue(hue)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-4 border-white pointer-events-none transition-transform"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  backgroundColor: `hsl(${hue}, 85%, 50%)`,
                  boxShadow: `0 4px 12px hsla(${hue}, 85%, 50%, 0.6), 0 0 0 1px rgba(0,0,0,0.1)`
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] font-medium font-mono pt-1">
              <span className="opacity-40">0°</span>
              <span
                className="px-3 py-1 rounded-full text-white font-bold tracking-wider"
                style={{ backgroundColor: `hsl(${hue}, 85%, 40%)`, boxShadow: `0 2px 10px hsla(${hue}, 85%, 50%, 0.3), inset 0 1px 2px rgba(255,255,255,0.2)` }}
              >
                {hue}°
              </span>
              <span className="opacity-40">360°</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
