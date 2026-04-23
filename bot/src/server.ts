import dotenv from "dotenv";
import cors from "cors";
import express, { Request, Response } from "express";
import { handleMessage } from "./bot/handler";
import { createArea, listAreas, updateArea } from "./db/areas";
import { bootstrapData } from "./db/bootstrap";
import { createMessageLog } from "./db/messageLogs";
import {
  getDashboardStats,
  getOrderById,
  getOrders,
  updateOrderStatus
} from "./db/orders";
import { listOrderEvents } from "./db/orderEvents";
import { listProducts, updateProduct } from "./db/products";
import { createReseller, getDefaultReseller, listResellers } from "./db/resellers";
import { createUser, getUserByEmail, listUsers } from "./db/users";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { OrderStatus, UserRole } from "./types";
import { signAuthToken, verifyPassword } from "./utils/security";
import { sendMessage } from "./whatsapp/sender";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const allowedOrigin = process.env.WEB_ALLOWED_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "1mb" }));

function resolveScopedResellerId(req: AuthenticatedRequest): number | null {
  if (!req.auth) {
    return null;
  }

  if (req.auth.role === "owner") {
    if (typeof req.query.resellerId === "string") {
      const parsed = Number(req.query.resellerId);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return req.auth.resellerId ?? null;
  }

  return req.auth.resellerId ?? null;
}

app.get("/health", async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ ok: true, service: "gasfacil-bot" });
  } catch (error) {
    console.error("Erro no healthcheck:", error);
    res.status(500).json({ ok: false });
  }
});

app.get("/webhook", async (_req: Request, res: Response) => {
  try {
    res.status(200).send(process.env.WEBHOOK_SECRET ?? "");
  } catch (error) {
    console.error("Erro na verificacao do webhook:", error);
    res.status(200).send("");
  }
});

app.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const phone = typeof body.phone === "string" ? body.phone : "";
    const text = typeof body.text?.message === "string" ? body.text.message : "";
    const fromMe = Boolean(body.fromMe);
    const isGroupMsg = Boolean(body.isGroupMsg);

    if (!phone || fromMe || isGroupMsg) {
      res.status(200).json({ ok: true });
      return;
    }

    await createMessageLog({
      phone,
      direction: "inbound",
      message: text || "[sem texto]",
      status: "received"
    });

    if (!text) {
      res.status(200).json({ ok: true });
      return;
    }

    const reseller = await getDefaultReseller();
    void handleMessage(phone, text, reseller.id);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao receber webhook:", error);
    res.status(200).json({ ok: true });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password.trim() : "";

    if (!email || !password) {
      res.status(400).json({ error: "credenciais_invalidas" });
      return;
    }

    const user = await getUserByEmail(email);

    if (!user || !user.active) {
      res.status(401).json({ error: "credenciais_invalidas" });
      return;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
      res.status(401).json({ error: "credenciais_invalidas" });
      return;
    }

    const token = signAuthToken({
      userId: user.id,
      resellerId: user.reseller_id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        resellerId: user.reseller_id
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

app.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(200).json({ user: req.auth });
  } catch (error) {
    console.error("Erro ao obter usuario autenticado:", error);
    res.status(500).json({ error: "erro_interno" });
  }
});

app.get(
  "/admin/stats",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);
      const stats = await getDashboardStats(resellerId);

      res.status(200).json({ stats });
    } catch (error) {
      console.error("Erro ao obter metricas:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/orders",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const orders = await getOrders({
        resellerId,
        status
      });

      res.status(200).json({ orders });
    } catch (error) {
      console.error("Erro ao listar pedidos no admin:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/orders/:id/events",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);

      if (!Number.isFinite(orderId)) {
        res.status(400).json({ error: "pedido_invalido" });
        return;
      }

      const events = await listOrderEvents(orderId);
      res.status(200).json({ events });
    } catch (error) {
      console.error("Erro ao listar eventos do pedido:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.patch(
  "/admin/orders/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      const status = req.body?.status as OrderStatus;
      const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
      const notifyCustomer = req.body?.notifyCustomer !== false;

      if (!Number.isFinite(orderId) || !status) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      const updated = await updateOrderStatus({
        orderId,
        status,
        note: note || null,
        actorType: "admin",
        actorName: req.auth?.name ?? "Operador"
      });

      if (!updated) {
        res.status(404).json({ error: "pedido_nao_encontrado" });
        return;
      }

      if (notifyCustomer) {
        const noteSuffix = note ? `\nObs: ${note}` : "";
        await sendMessage(
          updated.phone,
          `Atualizacao do pedido #${updated.id}\nStatus: ${updated.status}${noteSuffix}`
        );
      }

      res.status(200).json({ order: updated });
    } catch (error) {
      console.error("Erro ao atualizar pedido no admin:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/products",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);

      if (typeof resellerId !== "number") {
        res.status(400).json({ error: "revendedor_nao_informado" });
        return;
      }

      const products = await listProducts(resellerId);
      res.status(200).json({ products });
    } catch (error) {
      console.error("Erro ao listar produtos no admin:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.patch(
  "/admin/products/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const priceCents = Number(req.body?.priceCents);
      const stockUnits = Number(req.body?.stockUnits);
      const active = Boolean(req.body?.active);
      const description =
        typeof req.body?.description === "string" ? req.body.description : undefined;

      if (!Number.isFinite(id) || !Number.isFinite(priceCents) || !Number.isFinite(stockUnits)) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      await updateProduct(id, {
        priceCents,
        stockUnits,
        active,
        description
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/areas",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);

      if (typeof resellerId !== "number") {
        res.status(400).json({ error: "revendedor_nao_informado" });
        return;
      }

      const areas = await listAreas(resellerId);
      res.status(200).json({ areas });
    } catch (error) {
      console.error("Erro ao listar areas:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.post(
  "/admin/areas",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);
      const neighborhood =
        typeof req.body?.neighborhood === "string" ? req.body.neighborhood.trim() : "";
      const feeCents = Number(req.body?.feeCents);
      const etaMinutes = Number(req.body?.etaMinutes);

      if (
        typeof resellerId !== "number" ||
        !neighborhood ||
        !Number.isFinite(feeCents) ||
        !Number.isFinite(etaMinutes)
      ) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      const area = await createArea(resellerId, neighborhood, feeCents, etaMinutes);
      res.status(201).json({ area });
    } catch (error) {
      console.error("Erro ao criar area:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.patch(
  "/admin/areas/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const feeCents = Number(req.body?.feeCents);
      const etaMinutes = Number(req.body?.etaMinutes);
      const active = Boolean(req.body?.active);

      if (!Number.isFinite(id) || !Number.isFinite(feeCents) || !Number.isFinite(etaMinutes)) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      await updateArea(id, { feeCents, etaMinutes, active });
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Erro ao atualizar area:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/resellers",
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const resellers = await listResellers();
      res.status(200).json({ resellers });
    } catch (error) {
      console.error("Erro ao listar revendedores:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.post(
  "/admin/resellers",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.auth?.role !== "owner") {
        res.status(403).json({ error: "permissao_negada" });
        return;
      }

      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
      const whatsappPhone =
        typeof req.body?.whatsappPhone === "string" ? req.body.whatsappPhone.trim() : "";

      if (!name || !slug || !whatsappPhone) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      const reseller = await createReseller(name, slug, whatsappPhone);
      res.status(201).json({ reseller });
    } catch (error) {
      console.error("Erro ao criar revendedor:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.get(
  "/admin/users",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerId = resolveScopedResellerId(req);
      const users = await listUsers(resellerId);

      res.status(200).json({
        users: users.map((user) => ({
          id: user.id,
          resellerId: user.reseller_id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.created_at
        }))
      });
    } catch (error) {
      console.error("Erro ao listar usuarios:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.post(
  "/admin/users",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resellerIdFromScope = resolveScopedResellerId(req);
      const role = req.body?.role as UserRole;
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const password =
        typeof req.body?.password === "string" ? req.body.password.trim() : "";
      const resellerId =
        req.auth?.role === "owner" && typeof req.body?.resellerId === "number"
          ? req.body.resellerId
          : resellerIdFromScope;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: "payload_invalido" });
        return;
      }

      await createUser({
        resellerId,
        name,
        email,
        password,
        role
      });

      res.status(201).json({ ok: true });
    } catch (error) {
      console.error("Erro ao criar usuario:", error);
      res.status(500).json({ error: "erro_interno" });
    }
  }
);

app.listen(port, async () => {
  try {
    await bootstrapData();
    console.log(`Servidor do bot rodando em http://localhost:${port}`);
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
  }
});
