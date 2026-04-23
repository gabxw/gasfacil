"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import { apiRequest, setStoredToken } from "../../lib/api";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gasfacil.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest<{
        token: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      setStoredToken(result.token);
      router.push("/admin");
    } catch (_error) {
      setError("Falha no login. Revise email e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff6ef_0%,#ffffff_55%)] text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <section className="max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand/15 bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm">
            <Flame className="h-4 w-4" />
            Central operacional GásFácil
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Painel para pedidos, estoque e distribuidores.
          </h1>
          <p className="mt-5 text-lg leading-8 text-black/70">
            Use este acesso para acompanhar pedidos do WhatsApp, alterar status,
            ajustar precos, bairros atendidos e operar varios revendedores.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-black/70">
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              Pedidos em tempo real
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              Multi-revendedor
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              Atualizacao por WhatsApp
            </span>
          </div>
        </section>

        <section className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Area Admin
              </p>
              <h2 className="text-2xl font-bold">Entrar</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-black/70">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition-all duration-200 focus:border-brand"
                placeholder="admin@gasfacil.local"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-black/70">
                <LockKeyhole className="h-4 w-4" />
                Senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition-all duration-200 focus:border-brand"
                placeholder="Sua senha"
                required
              />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          <p className="mt-6 text-sm text-black/55">
            Acesso inicial padrao: <strong>admin@gasfacil.local</strong> /{" "}
            <strong>admin123</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
