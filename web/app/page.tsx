"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  House,
  MessageCircle,
  MousePointerClick,
  ShieldCheck,
  Truck,
  Wallet
} from "lucide-react";

const WHATSAPP_NUMBER = "5531999999999";

const products = [
  {
    emoji: "🏠",
    name: "Botijao P13 (13kg)",
    description: "O botijao residencial mais popular do Brasil",
    price: "R$ 120,00",
    featured: true,
    imageSrc: "/images/landing/p13-cooking-gas.jpg",
    imageAlt: "Botijao residencial azul em ambiente urbano.",
    message: "Olá! Quero pedir um botijão P13 (13kg). Pode me ajudar?"
  },
  {
    emoji: "🏢",
    name: "Botijao P45 (45kg)",
    description: "Ideal para restaurantes, padarias e comercios",
    price: "R$ 380,00",
    featured: false,
    imageSrc: "/images/landing/p45-lpg-cylinders.jpg",
    imageAlt: "Dois cilindros de GLP em area externa.",
    message: "Olá! Quero pedir um botijão P45 (45kg). Pode me ajudar?"
  },
  {
    emoji: "🏕️",
    name: "Botijao P2 (2kg)",
    description: "Pratico e portatil para camping e churrasqueiras",
    price: "R$ 45,00",
    featured: false,
    imageSrc: "/images/landing/p2-camping-gas.jpg",
    imageAlt: "Cartucho de gas portatil para uso externo.",
    message: "Olá! Quero pedir um botijão P2 (2kg). Pode me ajudar?"
  }
];

const steps = [
  {
    number: "1",
    title: "Clique no botao",
    description: "Escolha seu botijao e clique em pedir",
    icon: MousePointerClick
  },
  {
    number: "2",
    title: "Confirme pelo WhatsApp",
    description: "Nosso atendimento confirma seu pedido em segundos",
    icon: MessageCircle
  },
  {
    number: "3",
    title: "Receba em casa",
    description: "Entrega rapida e segura na sua porta",
    icon: House
  }
];

const benefits = [
  {
    title: "Entrega rapida",
    description: "Em ate 45 minutos apos a confirmacao",
    icon: Truck
  },
  {
    title: "Produto original",
    description: "Lacrado, certificado pelo INMETRO e ANP",
    icon: ShieldCheck
  },
  {
    title: "Pague na entrega",
    description: "PIX, dinheiro ou cartao — voce escolhe",
    icon: Wallet
  }
];

const trustBadges = [
  "✓ Produto original",
  "✓ Pagamento na entrega",
  "✓ Entrega rapida"
];

const sourceCredits = [
  {
    label: "Cooking gas cylinder",
    href: "https://commons.wikimedia.org/wiki/File:Cooking_gas_cylinder.jpg"
  },
  {
    label: "LPG cylinders",
    href: "https://commons.wikimedia.org/wiki/File:LPG_cylinders.JPG"
  },
  {
    label: "Butane gas cylinder",
    href: "https://commons.wikimedia.org/wiki/File:Butane_gas_cylinder.JPG"
  }
];

function openWhatsApp(message: string): void {
  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-black/65 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffaf5] text-ink">
      <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,92,0,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(37,211,102,0.12),_transparent_30%),linear-gradient(180deg,#fff7ef_0%,#fffaf5_45%,#fffaf5_100%)]" />

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-transparent bg-white/88 backdrop-blur-xl transition-all duration-200 ${
          scrolled ? "shadow-[0_14px_40px_rgba(23,23,23,0.10)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_28px_rgba(255,92,0,0.28)]">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-ink">GásFácil</div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                GLP com entrega local
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openWhatsApp("Olá! Quero pedir gás.")}
            className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(37,211,102,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#21bf5d]"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Pedir agora</span>
            <span className="sm:hidden">Pedir</span>
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm">
            <Clock3 className="h-4 w-4" />
            <span>⚡ Entrega em ate 45 minutos</span>
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Gás na sua porta, rapido e seguro
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/68 sm:text-xl">
            Peça pelo WhatsApp e receba em casa. Sem complicacao. Sem
            cadastro demorado. Atendimento humano e entrega local.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => openWhatsApp("Olá! Quero pedir gás.")}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-whatsapp px-7 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,211,102,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#21bf5d]"
            >
              <MessageCircle className="h-5 w-5" />
              Pedir agora pelo WhatsApp
            </button>
            <a
              href="#catalogo"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-7 py-4 text-base font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand"
            >
              Ver produtos
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-black/72 shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-sm">
              <div className="text-2xl font-black text-brand">45 min</div>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Janela media de entrega apos confirmacao.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-sm">
              <div className="text-2xl font-black text-brand">3 opcoes</div>
              <p className="mt-2 text-sm leading-6 text-black/60">
                P13, P45 e P2 para casa, comercio e lazer.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-sm">
              <div className="text-2xl font-black text-brand">100%</div>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Atendimento pelo WhatsApp, simples para fechar.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,92,0,0.18),rgba(255,255,255,0.55)_50%,rgba(37,211,102,0.15))] blur-3xl" />

          <div className="grid gap-4 rounded-[2.5rem] border border-white/70 bg-white/75 p-4 shadow-[0_30px_90px_rgba(33,33,33,0.16)] backdrop-blur sm:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] bg-[#121212] sm:min-h-[34rem]">
              <Image
                src="/images/landing/p13-cooking-gas.jpg"
                alt="Botijao residencial fotografado para a landing da GasFacil."
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
                  Operacao local
                </div>
                <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                  Atendimento rapido com pedido direto no celular
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  Experiencia direta, sem friccao, com foco total em conversao.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative min-h-[12rem] overflow-hidden rounded-[1.8rem] border border-black/8 bg-[#f7f7f7]">
                <Image
                  src="/images/landing/p45-lpg-cylinders.jpg"
                  alt="Cilindros de GLP maiores para uso comercial."
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 22vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00),rgba(0,0,0,0.46))]" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
                  P45 para comercio
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/8 bg-[#111111] p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand p-3 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                      Confianca
                    </div>
                    <div className="text-xl font-bold">Pagamento na entrega</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  PIX, dinheiro ou cartao com confirmacao no WhatsApp e entrega
                  monitorada.
                </p>
              </div>

              <div className="relative min-h-[12rem] overflow-hidden rounded-[1.8rem] border border-black/8 bg-[#f7f7f7]">
                <Image
                  src="/images/landing/p2-camping-gas.jpg"
                  alt="Cartucho de gas portatil para camping e churrasqueira."
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 22vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00),rgba(0,0,0,0.5))]" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
                  P2 para lazer
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalogo"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <SectionHeading
          eyebrow="Catalogo"
          title="Escolha seu botijao"
          description="Visual forte, informacao direta e CTA imediato. Cada opcao abaixo ja entra no WhatsApp com a mensagem certa."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.name}
              className="group relative overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_40px_rgba(23,23,23,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(23,23,23,0.14)]"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  fill
                  className="object-cover transition-all duration-200 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.55))]" />
                <div className="absolute left-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/92 text-2xl shadow-sm">
                  {product.emoji}
                </div>
                {product.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg">
                    Mais vendido
                  </span>
                ) : null}
              </div>

              <div className="p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  {product.name}
                </div>
                <p className="mt-4 text-base leading-7 text-black/68">
                  {product.description}
                </p>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-black/45">Preco sugerido</div>
                    <div className="mt-1 text-3xl font-black text-ink">
                      {product.price}
                    </div>
                  </div>
                  <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                    Pedido rapido
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openWhatsApp(product.message)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#21bf5d]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Pedir pelo WhatsApp
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Processo"
          title="Como funciona?"
          description="Fluxo curto, facil de entender e ainda mais facil de converter no mobile."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white p-6 shadow-sm"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand/8 blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white">
                    {step.number}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e7] text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-7 text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-3 leading-7 text-black/66">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Beneficios"
          title="Motivos para pedir com a GásFácil"
          description="A pagina agora comunica rapidez, seguranca e conveniencia com mais peso visual."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,92,0,0.12),rgba(37,211,102,0.10))] text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-ink">{benefit.title}</h3>
                <p className="mt-3 leading-7 text-black/66">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-4 rounded-[2.5rem] bg-[linear-gradient(135deg,#ff5c00_0%,#ff7b2f_52%,#ff5c00_100%)] px-6 py-14 text-white shadow-[0_24px_80px_rgba(255,92,0,0.24)] sm:mx-6 lg:mx-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
              Atendimento imediato
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Acabou o gás? A gente resolve agora.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/80">
              Clique, confirme e receba. A pagina foi reforcada para deixar essa
              promessa clara logo na primeira dobra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openWhatsApp("Olá! Quero pedir gás.")}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-base font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff4ec]"
          >
            <MessageCircle className="h-5 w-5" />
            Chamar no WhatsApp
          </button>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-black/8 bg-white px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 border-b border-black/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-ink">GásFácil</div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                  Pedido rapido pelo WhatsApp
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openWhatsApp("Olá! Quero pedir gás.")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-whatsapp transition-all duration-200 hover:opacity-80"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp: {WHATSAPP_NUMBER}
            </button>

            <p className="text-sm text-black/60">
              © 2025 GásFácil. Todos os direitos reservados.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-xs leading-6 text-black/45 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Imagens ilustrativas incorporadas localmente para a landing.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {sourceCredits.map((credit) => (
                <a
                  key={credit.label}
                  href={credit.href}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-all duration-200 hover:text-brand"
                >
                  Fonte: {credit.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
