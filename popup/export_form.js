import { app_state } from "./state.js";
import {
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

export function populate_export_form(state, source_id) {
  const target_select = document.getElementById("export_target_source_select");
  const github_sources = sort_sources(state.sources).filter((entry) => {
    return entry.type === "github"
      && entry.writable
      && typeof entry.token === "string"
      && entry.token.trim().length > 0;
  });

  target_select.innerHTML = "";

  for (const github_source of github_sources) {
    const option = document.createElement("option");
    option.value = github_source.source_id;
    option.textContent = `${github_source.owner}/${github_source.repo}`;
    target_select.appendChild(option);
  }

  document.getElementById("export_file_name").value = build_export_file_name_default(state, source_id);
  render_export_target_hint(target_select.value);
}

export function get_export_form_values() {
  return {
    target_source_id: document.getElementById("export_target_source_select").value,
    file_name: document.getElementById("export_file_name").value.trim()
  };
}
