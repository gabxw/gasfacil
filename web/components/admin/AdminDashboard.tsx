"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  Flame,
  LogOut,
  MapPinned,
  PackageSearch,
  ShieldCheck,
  Truck
} from "lucide-react";
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  getApiBaseUrl
} from "../../lib/api";
import {
  Area,
  AuthUser,
  DashboardStats,
  Order,
  Product,
  Reseller,
  UserSummary
} from "../../lib/types";

const orderStatuses = [
  "novo",
  "confirmado",
  "preparando",
  "em_rota",
  "entregue",
  "cancelado"
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResellerId, setSelectedResellerId] = useState<string>("all");
  const [newArea, setNewArea] = useState({
    neighborhood: "",
    feeCents: "0",
    etaMinutes: "45"
  });
  const [newReseller, setNewReseller] = useState({
    name: "",
    slug: "",
    whatsappPhone: ""
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
    resellerId: ""
  });

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      router.replace("/admin/login");
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadDashboard(token, selectedResellerId);
  }, [token, selectedResellerId]);

  async function loadDashboard(
    authToken: string,
    resellerScope: string
  ): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const resellerQuery =
        resellerScope !== "all" ? `?resellerId=${encodeURIComponent(resellerScope)}` : "";

      const [meResult, statsResult, ordersResult, resellersResult, usersResult] =
        await Promise.all([
          apiRequest<{ user: AuthUser }>("/auth/me", undefined, authToken),
          apiRequest<{ stats: DashboardStats }>(
            `/admin/stats${resellerQuery}`,
            undefined,
            authToken
          ),
          apiRequest<{ orders: Order[] }>(
            `/admin/orders${resellerQuery}`,
            undefined,
            authToken
          ),
          apiRequest<{ resellers: Reseller[] }>("/admin/resellers", undefined, authToken),
          apiRequest<{ users: UserSummary[] }>("/admin/users", undefined, authToken)
        ]);

      const scopedResellerId =
        resellerScope !== "all"
          ? Number(resellerScope)
          : meResult.user.resellerId ?? resellersResult.resellers[0]?.id ?? null;

      const [productsResult, areasResult] =
        typeof scopedResellerId === "number"
          ? await Promise.all([
              apiRequest<{ products: Product[] }>(
                `/admin/products?resellerId=${scopedResellerId}`,
                undefined,
                authToken
              ),
              apiRequest<{ areas: Area[] }>(
                `/admin/areas?resellerId=${scopedResellerId}`,
                undefined,
                authToken
              )
            ])
          : [{ products: [] }, { areas: [] }];

      setUser(meResult.user);
      setStats(statsResult.stats);
      setOrders(ordersResult.orders);
      setProducts(productsResult.products);
      setAreas(areasResult.areas);
      setResellers(resellersResult.resellers);
      setUsers(usersResult.users);
    } catch (_error) {
      setError("Nao foi possivel carregar o painel. Confira o bot em execucao e o token.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderUpdate(orderId: number, status: string): Promise<void> {
    if (!token) {
      return;
    }

    await apiRequest(
      `/admin/orders/${orderId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          notifyCustomer: true
        })
      },
      token
    );

    await loadDashboard(token, selectedResellerId);
  }

  async function handleProductSave(product: Product): Promise<void> {
    if (!token) {
      return;
    }

    await apiRequest(
      `/admin/products/${product.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          priceCents: product.price_cents,
          stockUnits: product.stock_units,
          active: product.active,
          description: product.description
        })
      },
      token
    );

    await loadDashboard(token, selectedResellerId);
  }

  async function handleAreaSave(area: Area): Promise<void> {
    if (!token) {
      return;
    }

    await apiRequest(
      `/admin/areas/${area.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          feeCents: area.fee_cents,
          etaMinutes: area.eta_minutes,
          active: area.active
        })
      },
      token
    );

    await loadDashboard(token, selectedResellerId);
  }

  async function handleCreateArea(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!token) {
      return;
    }

    const resellerId =
      selectedResellerId !== "all"
        ? Number(selectedResellerId)
        : user?.resellerId ?? resellers[0]?.id;

    if (!resellerId) {
      return;
    }

    await apiRequest(
      `/admin/areas?resellerId=${resellerId}`,
      {
        method: "POST",
        body: JSON.stringify({
          neighborhood: newArea.neighborhood,
          feeCents: Number(newArea.feeCents),
          etaMinutes: Number(newArea.etaMinutes)
        })
      },
      token
    );

    setNewArea({ neighborhood: "", feeCents: "0", etaMinutes: "45" });
    await loadDashboard(token, selectedResellerId);
  }

  async function handleCreateReseller(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!token || user?.role !== "owner") {
      return;
    }

    await apiRequest(
      "/admin/resellers",
      {
        method: "POST",
        body: JSON.stringify(newReseller)
      },
      token
    );

    setNewReseller({ name: "", slug: "", whatsappPhone: "" });
    await loadDashboard(token, selectedResellerId);
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!token) {
      return;
    }

    const resellerId =
      user?.role === "owner"
        ? newUser.resellerId
          ? Number(newUser.resellerId)
          : null
        : user?.resellerId ?? null;

    await apiRequest(
      "/admin/users",
      {
        method: "POST",
        body: JSON.stringify({
          ...newUser,
          resellerId
        })
      },
      token
    );

    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "operator",
      resellerId: ""
    });
    await loadDashboard(token, selectedResellerId);
  }

  const metricCards = useMemo(
    () => [
      {
        label: "Pedidos totais",
        value: stats?.totalOrders ?? 0,
        icon: PackageSearch
      },
      {
        label: "Pendentes",
        value: stats?.pendingOrders ?? 0,
        icon: ShieldCheck
      },
      {
        label: "Em rota",
        value: stats?.inRouteOrders ?? 0,
        icon: Truck
      },
      {
        label: "Receita hoje",
        value: formatCurrency(stats?.revenueTodayCents ?? 0),
        icon: CircleDollarSign
      }
    ],
    [stats]
  );

  function logout(): void {
    clearStoredToken();
    router.replace("/admin/login");
  }

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf6] text-black/60">
        Carregando painel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf6] text-ink">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                GásFácil Ops
              </p>
              <h1 className="text-2xl font-bold">Painel operacional</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-black/10 bg-[#fff6ef] px-4 py-3 text-sm">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-black/60">{user?.email}</div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold transition-all duration-200 hover:bg-black hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Origem de dados
              </p>
              <h2 className="mt-2 text-2xl font-bold">Operacao conectada ao bot</h2>
              <p className="mt-2 text-black/65">
                API atual: <span className="font-mono">{getApiBaseUrl()}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-black/70">
                Revendedor
              </label>
              <select
                value={selectedResellerId}
                onChange={(event) => setSelectedResellerId(event.target.value)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition-all duration-200 focus:border-brand"
              >
                <option value="all">Todos / meu escopo</option>
                {resellers.map((reseller) => (
                  <option key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-brand/10 p-3 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-black/45">
                    resumo
                  </span>
                </div>
                <p className="mt-6 text-sm font-medium text-black/55">{card.label}</p>
                <p className="mt-2 text-3xl font-black">{card.value}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  Pedidos
                </p>
                <h2 className="mt-2 text-2xl font-bold">Fila operacional</h2>
              </div>
              <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-semibold text-black/60">
                {orders.length} itens
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffaf6] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-white">
                          Pedido #{order.id}
                        </span>
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-black/60">
                          {order.status}
                        </span>
                        <span className="text-xs font-semibold text-black/50">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{order.produto}</h3>
                      <p className="text-sm text-black/70">{order.endereco}</p>
                      <p className="text-sm text-black/60">
                        {order.phone} · {order.pagamento} · {order.reseller_name}
                      </p>
                      <p className="text-base font-semibold text-brand">
                        Total {formatCurrency(order.total_cents)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-52">
                      <select
                        value={order.status}
                        onChange={(event) =>
                          void handleOrderUpdate(order.id, event.target.value)
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 focus:border-brand"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {orders.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-black/15 px-5 py-10 text-center text-black/45">
                  Nenhum pedido encontrado para o escopo atual.
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Operadores
              </p>
              <h2 className="mt-2 text-2xl font-bold">Usuarios internos</h2>
            </div>

            <div className="mt-6 space-y-3">
              {users.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffaf6] px-4 py-4"
                >
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-black/60">{item.email}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                    {item.role}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateUser} className="mt-6 space-y-3">
              <input
                value={newUser.name}
                onChange={(event) =>
                  setNewUser((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nome do usuario"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                required
              />
              <input
                value={newUser.email}
                onChange={(event) =>
                  setNewUser((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Email"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                required
                type="email"
              />
              <input
                value={newUser.password}
                onChange={(event) =>
                  setNewUser((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Senha temporaria"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                required
                type="password"
              />
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser((current) => ({ ...current, role: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
              >
                <option value="operator">operator</option>
                <option value="manager">manager</option>
                <option value="owner">owner</option>
              </select>
              {user?.role === "owner" ? (
                <select
                  value={newUser.resellerId}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      resellerId: event.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                >
                  <option value="">Sem vinculo especifico</option>
                  {resellers.map((reseller) => (
                    <option key={reseller.id} value={reseller.id}>
                      {reseller.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
              >
                Criar usuario
              </button>
            </form>
          </article>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-whatsapp/10 p-3 text-whatsapp">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  Catalogo
                </p>
                <h2 className="text-2xl font-bold">Produtos e estoque</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffaf6] p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                        {product.code}
                      </div>
                      <h3 className="mt-1 text-xl font-bold">{product.name}</h3>
                    </div>

                    <textarea
                      value={product.description}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                      className="min-h-[96px] w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="number"
                        value={product.price_cents}
                        onChange={(event) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? {
                                    ...item,
                                    price_cents: Number(event.target.value)
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                      />
                      <input
                        type="number"
                        value={product.stock_units}
                        onChange={(event) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? {
                                    ...item,
                                    stock_units: Number(event.target.value)
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                      />
                      <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
                        Ativo
                        <input
                          type="checkbox"
                          checked={product.active}
                          onChange={(event) =>
                            setProducts((current) =>
                              current.map((item) =>
                                item.id === product.id
                                  ? { ...item, active: event.target.checked }
                                  : item
                              )
                            )
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleProductSave(product)}
                      className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    >
                      Salvar produto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand/10 p-3 text-brand">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  Cobertura
                </p>
                <h2 className="text-2xl font-bold">Bairros e taxa de entrega</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffaf6] p-5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="text-lg font-bold">{area.neighborhood}</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="number"
                        value={area.fee_cents}
                        onChange={(event) =>
                          setAreas((current) =>
                            current.map((item) =>
                              item.id === area.id
                                ? { ...item, fee_cents: Number(event.target.value) }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                      />
                      <input
                        type="number"
                        value={area.eta_minutes}
                        onChange={(event) =>
                          setAreas((current) =>
                            current.map((item) =>
                              item.id === area.id
                                ? { ...item, eta_minutes: Number(event.target.value) }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                      />
                      <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
                        Ativo
                        <input
                          type="checkbox"
                          checked={area.active}
                          onChange={(event) =>
                            setAreas((current) =>
                              current.map((item) =>
                                item.id === area.id
                                  ? { ...item, active: event.target.checked }
                                  : item
                              )
                            )
                          }
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAreaSave(area)}
                      className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    >
                      Salvar area
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateArea} className="mt-6 grid gap-3 sm:grid-cols-4">
              <input
                value={newArea.neighborhood}
                onChange={(event) =>
                  setNewArea((current) => ({
                    ...current,
                    neighborhood: event.target.value
                  }))
                }
                placeholder="Novo bairro"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand sm:col-span-2"
                required
              />
              <input
                type="number"
                value={newArea.feeCents}
                onChange={(event) =>
                  setNewArea((current) => ({
                    ...current,
                    feeCents: event.target.value
                  }))
                }
                placeholder="Taxa em centavos"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                required
              />
              <input
                type="number"
                value={newArea.etaMinutes}
                onChange={(event) =>
                  setNewArea((current) => ({
                    ...current,
                    etaMinutes: event.target.value
                  }))
                }
                placeholder="ETA"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                required
              />
              <button
                type="submit"
                className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 sm:col-span-4"
              >
                Adicionar bairro
              </button>
            </form>
          </article>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-black/5 p-3 text-black">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                  Rede
                </p>
                <h2 className="text-2xl font-bold">Revendedores</h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {resellers.map((reseller) => (
                <div
                  key={reseller.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffaf6] px-4 py-4"
                >
                  <div className="font-semibold">{reseller.name}</div>
                  <div className="text-sm text-black/60">
                    {reseller.slug} · {reseller.whatsapp_phone}
                  </div>
                </div>
              ))}
            </div>

            {user?.role === "owner" ? (
              <form onSubmit={handleCreateReseller} className="mt-6 space-y-3">
                <input
                  value={newReseller.name}
                  onChange={(event) =>
                    setNewReseller((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Nome do revendedor"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                  required
                />
                <input
                  value={newReseller.slug}
                  onChange={(event) =>
                    setNewReseller((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder="slug-unico"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                  required
                />
                <input
                  value={newReseller.whatsappPhone}
                  onChange={(event) =>
                    setNewReseller((current) => ({
                      ...current,
                      whatsappPhone: event.target.value
                    }))
                  }
                  placeholder="5531999999999"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-brand"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                >
                  Criar revendedor
                </button>
              </form>
            ) : null}
          </article>

          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Operacao
              </p>
              <h2 className="mt-2 text-2xl font-bold">Proximos ajustes sugeridos</h2>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-7 text-black/70">
              <p className="rounded-3xl border border-black/10 bg-[#fffaf6] px-5 py-4">
                O painel ja cobre autenticacao, multi-revendedor, fila de pedidos,
                edicao de estoque, bairros atendidos e notificacao ao cliente no update.
              </p>
              <p className="rounded-3xl border border-black/10 bg-[#fffaf6] px-5 py-4">
                Se quiser subir mais um nivel, o proximo passo tecnico faz sentido em
                integracoes de pagamento, SLA por bairro, webhooks de entrega e auditoria.
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
