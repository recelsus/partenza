import { apply_theme_mode } from "../ui/theme.js";

export function render_settings(settings) {
  const ui_mode = settings?.ui_mode === "side_panel" ? "side_panel" : "popup";
  const theme_mode = settings?.theme_mode === "light" || settings?.theme_mode === "dark"
    ? settings.theme_mode
    : "auto";

  document.getElementById("ui_mode_popup").checked = ui_mode === "popup";
  document.getElementById("ui_mode_side_panel").checked = ui_mode === "side_panel";
  document.getElementById("theme_mode_auto").checked = theme_mode === "auto";
  document.getElementById("theme_mode_light").checked = theme_mode === "light";
  document.getElementById("theme_mode_dark").checked = theme_mode === "dark";

  apply_theme_mode(theme_mode);
}

export function reset_http_form() {
  document.getElementById("http_source_url").value = "";
}

export function reset_github_form() {
  document.getElementById("github_owner").value = "";
  document.getElementById("github_repo").value = "";
  document.getElementById("github_branch").value = "";
  document.getElementById("github_token").value = "";
}

export function get_http_form_values() {
  return {
    url: document.getElementById("http_source_url").value
  };
}

export function get_github_form_values() {
  return {
    owner: document.getElementById("github_owner").value,
    repo: document.getElementById("github_repo").value,
    branch: document.getElementById("github_branch").value,
    token: document.getElementById("github_token").value
  };
}
