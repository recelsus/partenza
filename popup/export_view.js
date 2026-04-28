import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import {
  get_edit_target_option_label,
  get_source,
  get_source_display_name,
  sort_sources
} from "./source_helpers.js";

export function render_export_target_hint(source_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const source = get_source(app_state.current_view_state, source_id);
  const target_hint = document.getElementById("export_target_source_hint");

  if (!source) {
    target_hint.textContent = "";
    return;
  }

  target_hint.textContent = `${source.owner}/${source.repo} / ${source.path}`;
}

export function build_export_file_name_default(state, source_id) {
  const display_name = get_source_display_name(state, source_id);
  const slug = display_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "exported-bookmarks"}.json`;
}

export function open_export_view(source_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const source = get_source(app_state.current_view_state, source_id);

  if (!source || source.type !== "http_static") {
    set_status("Select an HTTP source first", true);
    return;
  }

  app_state.export_context = { source_id };
  const target_select = document.getElementById("export_target_source_select");
  const github_sources = sort_sources(app_state.current_view_state.sources).filter((entry) => {
    return entry.type === "github"
      && entry.writable
      && typeof entry.token === "string"
      && entry.token.trim().length > 0;
  });

  target_select.innerHTML = "";

  for (const github_source of github_sources) {
    const option = document.createElement("option");
    option.value = github_source.source_id;
    option.textContent = get_edit_target_option_label(app_state.current_view_state, github_source.source_id);
    target_select.appendChild(option);
  }

  document.getElementById("export_file_name").value = build_export_file_name_default(
    app_state.current_view_state,
    source_id
  );
  render_export_target_hint(target_select.value);
  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("export_view").hidden = false;
}

export function close_export_view() {
  app_state.export_context = null;
  document.getElementById("export_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

export async function export_selected_http_source(apply_state) {
  if (!app_state.current_view_state || !app_state.export_context) {
    set_status("State is unavailable", true);
    return;
  }

  const source_id = app_state.export_context.source_id;
  const target_source_id = document.getElementById("export_target_source_select").value;
  const file_name = document.getElementById("export_file_name").value.trim();

  set_loading_status("Exporting to GitHub...");
  const response = await send_message({
    type: "export_http_source_to_github",
    source_id,
    target_source_id,
    file_name
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  close_export_view();
  apply_state(response.data.state, response.data.created_source_id);
  set_status("Bookmarks exported to GitHub");
}
