import axios from "axios";
import { createMessageLog } from "../db/messageLogs";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sendMessage(phone: string, message: string): Promise<void> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;

  if (!apiUrl || !token) {
    console.error("WHATSAPP_API_URL ou WHATSAPP_TOKEN nao configurados.");
    await createMessageLog({
      phone,
      direction: "outbound",
      message,
      status: "skipped",
      error: "missing_whatsapp_config"
    });
    return;
  }

  const delays = [0, 400, 1000];

  for (let attempt = 1; attempt <= delays.length; attempt += 1) {
    try {
      if (delays[attempt - 1] > 0) {
        await wait(delays[attempt - 1]);
      }

      await axios.post(
        `${apiUrl}/send-text`,
        {
          phone,
          message
        },
        {
          headers: {
            "Client-Token": token,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      await createMessageLog({
        phone,
        direction: "outbound",
        message,
        status: "sent",
        attempt
      });

      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "unknown_whatsapp_error";

      console.error(`Erro ao enviar mensagem na tentativa ${attempt}:`, error);

      await createMessageLog({
        phone,
        direction: "outbound",
        message,
        status: attempt === delays.length ? "failed" : "retrying",
        attempt,
        error: errorMessage
      });
    }
  }
}
