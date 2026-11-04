"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

export default function HeroVisual({ image }: { image: string }) {
  const [paused, setPaused] = useState(false);
  const label = paused ? "Ativar animação da foto" : "Pausar animação da foto";

  return (
    <>
      <div className={`hero-visual${paused ? " is-paused" : ""}`}>
        <img
          className="hero-photo"
          src={image}
          alt="Cuidado e precisão no corte em uma barbearia premium"
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
