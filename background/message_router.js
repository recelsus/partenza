import { MESSAGE_HANDLERS } from "./message_handlers.js";

export async function handle_message(message) {
  const handler = MESSAGE_HANDLERS[message.type];

  if (!handler) {
    return { ok: false, error_code: "unknown_message", message: "Unknown message type" };
  }

  return {
    ok: true,
    data: await handler(message)
  };
}
