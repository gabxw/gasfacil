import { NextFunction, Request, Response } from "express";
import { AuthTokenPayload } from "../types";
import { verifyAuthToken } from "../utils/security";

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "nao_autorizado" });
      return;
    }

    const token = header.replace("Bearer ", "").trim();
    const payload = verifyAuthToken(token);

    if (!payload) {
      res.status(401).json({ error: "token_invalido" });
      return;
    }

    req.auth = payload;
    next();
  } catch (error) {
    console.error("Erro no middleware de autenticacao:", error);
    res.status(401).json({ error: "nao_autorizado" });
  }
}
