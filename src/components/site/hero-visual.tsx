"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

export default function HeroVisual({
  image,
  logo = false,
}: {
  image: string;
  logo?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const subject = logo ? "logo" : "foto";
  const label = paused
    ? `Ativar animação da ${subject}`
    : `Pausar animação da ${subject}`;

  return (
    <>
      <div
        className={`hero-visual${logo ? " hero-visual-logo" : ""}${paused ? " is-paused" : ""}`}
      >
        <img
          className={`hero-photo${logo ? " hero-logo" : image === "/images/barbearia/hero-degrade.webp" ? " hero-photo-original" : ""}`}
          src={image}
          alt={
            logo
              ? "Imperial Barber — brasão dourado com J"
              : "Cuidado e precisão no corte em uma barbearia premium"
          }
          fetchPriority="high"
        />
      </div>
      <button
        type="button"
        className="hero-motion-toggle"
        aria-label={label}
        aria-pressed={paused}
        title={label}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <Play size={15} /> : <Pause size={15} />}
      </button>
    </>
  );
}
