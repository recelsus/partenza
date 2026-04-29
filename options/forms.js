export function render_settings(settings) {
  const ui_mode = settings?.ui_mode === "side_panel" ? "side_panel" : "popup";

  document.getElementById("ui_mode_popup").checked = ui_mode === "popup";
  document.getElementById("ui_mode_side_panel").checked = ui_mode === "side_panel";
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
