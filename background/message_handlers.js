import { BOOKMARK_MESSAGE_HANDLERS } from "./bookmark_message_handlers.js";
import { SETTINGS_MESSAGE_HANDLERS } from "./settings_message_handlers.js";
import { SOURCE_MESSAGE_HANDLERS } from "./source_message_handlers.js";

export const MESSAGE_HANDLERS = {
  ...SETTINGS_MESSAGE_HANDLERS,
  ...SOURCE_MESSAGE_HANDLERS,
  ...BOOKMARK_MESSAGE_HANDLERS
};
