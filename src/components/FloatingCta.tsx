"use client";

import { useEffect, useState } from "react";
import { WHATSAPP_NUMERO } from "@/lib/lead";

const MSG = encodeURIComponent("Olá, Aridiego! Vim pelo site e quero saber mais sobre o empréstimo.");

/** Barra fixa no celular ("Simular agora") que some quando o formulário está visível + botão de WhatsApp. */
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
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        data-origem="botao-flutuante"
        className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/50 transition-all hover:scale-105 ${
          formVisivel ? "bottom-5" : "bottom-24 lg:bottom-5"
        }`}
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.5.7 4.8 2 6.8L3 29l6.8-2.2c1.9 1 4 1.6 6.2 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23c-2 0-3.9-.6-5.5-1.6l-.4-.2-4 1.3 1.3-3.9-.3-.4a10.3 10.3 0 0 1-1.6-5.6C5.5 9.9 10.2 5.3 16 5.3s10.5 4.6 10.5 10.3S21.8 26 16 26zm5.8-7.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.4 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z" />
        </svg>
      </a>

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
