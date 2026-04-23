import { createMessageLog } from "../db/messageLogs";
import { getSession, resetSession, saveSession } from "../db/sessions";
import { sendMessage } from "../whatsapp/sender";
import { runStateMachine } from "./states";

export async function handleMessage(
  phone: string,
  text: string,
  resellerId: number
): Promise<void> {
  try {
    const session = await getSession(phone, resellerId);

    if (session.state === "CONCLUIDO" && text.trim().toLowerCase() === "novo") {
      await resetSession(phone, resellerId);
      const result = await runStateMachine({
        resellerId,
        phone,
        currentState: "INICIO",
        text,
        sessionData: {}
      });

      await saveSession(phone, resellerId, result.nextState, result.data);
      await sendMessage(phone, result.reply);
      return;
    }

    const result = await runStateMachine({
      resellerId,
      phone,
      currentState: session.state,
      text,
      sessionData: session.data
    });

    await saveSession(phone, resellerId, result.nextState, result.data);
    await sendMessage(phone, result.reply);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await createMessageLog({
      phone,
      direction: "outbound",
      message: "Falha interna ao processar mensagem.",
      status: "internal_error",
      error: error instanceof Error ? error.message : "unknown_error"
    });
  }
}
