import { bind_refresh_event } from "./refresh_binding.js";
import { bind_register_events } from "./register_bindings.js";
import {
    bind_theme_mode_events,
    bind_ui_mode_events
} from "./settings_bindings.js";

export function bind_options_events(render) {
    bind_refresh_event(render);
    bind_register_events(render);
    bind_ui_mode_events(render);
    bind_theme_mode_events(render);
}
