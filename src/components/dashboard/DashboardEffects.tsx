"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface Props {
  /** Whether this is the very first sync (count just went from 0 → N) */
  isFirstSync: boolean;
  totalSynced: number;
  streak: number;
}

export function FirstSyncCelebration({ isFirstSync, totalSynced, streak }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    // Only fire if first sync, has submissions, and hasn't fired yet this session
    if (!isFirstSync || totalSynced === 0 || firedRef.current) return;
    const sessionKey = "leetpush-first-sync-celebrated";
    if (sessionStorage.getItem(sessionKey)) return;

    firedRef.current = true;
    sessionStorage.setItem(sessionKey, "1");

    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 65,
        origin: { x: 0 },
        colors: ["#0d9488", "#34d399", "#a7f3d0", "#ffffff"],
      });
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 65,
        origin: { x: 1 },
        colors: ["#0d9488", "#34d399", "#a7f3d0", "#ffffff"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [isFirstSync, totalSynced, streak]);

  return null; // purely side-effect component
}

// ============================================================
// Animated counter that counts up from 0
// ============================================================
export function AnimatedCounter({
  value,
  duration = 1200,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) { requestAnimationFrame(() => setDisplay(0)); return; }

    startRef.current = null;

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}

// ============================================================
// 3D Tilt Card wrapper — adds subtle parallax on hover
// ============================================================
export function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  disableOnMobile = true,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  disableOnMobile?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (disableOnMobile && window.innerWidth < 768) return;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    const rotateX = ((y - cy) / cy) * -maxTilt;
    const rotateY = ((x - cx) / cx) * maxTilt;
    card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-card transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
