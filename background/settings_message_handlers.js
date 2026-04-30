import { build_state } from "./context.js";
import { save_ui_mode } from "./ui_mode_service.js";
import { save_theme_mode } from "./theme_service.js";

export const SETTINGS_MESSAGE_HANDLERS = {
    ping: async () => ({ pong: true }),
    get_view_state: async () => build_state(),
    save_ui_mode: async (message) => save_ui_mode(message.ui_mode),
    save_theme_mode: async (message) => save_theme_mode(message.theme_mode)
};
