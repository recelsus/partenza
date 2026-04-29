let current_theme_mode = "auto";
let media_query_list = null;
let media_query_listener = null;

function resolve_system_theme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve_theme(theme_mode) {
  return theme_mode === "auto" ? resolve_system_theme() : theme_mode;
}

function apply_resolved_theme(theme_mode) {
  const resolved_theme = resolve_theme(theme_mode);
  document.documentElement.dataset.theme = resolved_theme;
  document.documentElement.dataset.theme_mode = theme_mode;
}

function detach_theme_listener() {
  if (!media_query_list || !media_query_listener) {
    return;
  }

  media_query_list.removeEventListener("change", media_query_listener);
  media_query_list = null;
  media_query_listener = null;
}

function attach_theme_listener() {
  detach_theme_listener();

  media_query_list = window.matchMedia("(prefers-color-scheme: dark)");
  media_query_listener = () => {
    if (current_theme_mode === "auto") {
      apply_resolved_theme("auto");
    }
  };

  media_query_list.addEventListener("change", media_query_listener);
}

export function apply_theme_mode(theme_mode) {
  current_theme_mode = theme_mode === "light" || theme_mode === "dark" ? theme_mode : "auto";
  apply_resolved_theme(current_theme_mode);

  if (current_theme_mode === "auto") {
    attach_theme_listener();
    return;
  }

  detach_theme_listener();
}
