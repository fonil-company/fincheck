"use client";

import { useEffect, useState } from "react";

/** Barra fixa no celular ("Simular agora") que some quando o formulário está visível. */
export default function FloatingCta() {
  const [formVisivel, setFormVisivel] = useState(true);

  useEffect(() => {
    const alvo = document.getElementById("simular");
    if (!alvo) return;
    const obs = new IntersectionObserver(([e]) => setFormVisivel(e.isIntersecting), { threshold: 0.15 });
    obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  return (
    <>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-bg/95 px-4 py-3 backdrop-blur transition-transform lg:hidden ${
          formVisivel ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <a
          href="#simular"
          className="btn-gold flex h-12 items-center justify-center rounded-xl text-sm font-bold uppercase tracking-wider"
        >
          Simular grátis agora ›
        </a>
      </div>
    </>
  );
}
