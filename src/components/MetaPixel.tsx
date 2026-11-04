"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getOrigem, META_PIXEL_ID, track } from "@/lib/tracking";

export default function MetaPixel() {
  useEffect(() => {
    // guarda UTMs/fbclid da chegada
    getOrigem();

    // ViewContent quando o formulário aparece na tela (1x)
    const alvo = document.getElementById("simular");
    let disparado = false;
    const obs = alvo
      ? new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting && !disparado) {
              disparado = true;
              track("ViewContent", { content_name: "Empréstimo pessoal", content_category: "emprestimo" });
              obs?.disconnect();
            }
          },
          { threshold: 0.3 },
        )
      : null;
    if (alvo) obs?.observe(alvo);

    // Contact em qualquer link de WhatsApp
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest?.("a[href*='wa.me']");
      if (a) track("Contact", { content_name: a.getAttribute("data-origem") || "whatsapp" });
    };
    document.addEventListener("click", onClick);

    return () => {
      obs?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
