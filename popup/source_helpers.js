import { parse_github_cache_id } from "../lib/github_source_unit.js";

export function get_selected_source_id() {
  return document.getElementById("source_select").value;
}

export function get_source_sort_rank(source) {
  if (source.type === "github") {
    return 0;
  }

  if (source.type === "http_static") {
    return 1;
  }

  return 9;
}

export function sort_sources(sources) {
  return [...sources].sort((left, right) => {
    const rank_diff = get_source_sort_rank(left) - get_source_sort_rank(right);

    if (rank_diff !== 0) {
      return rank_diff;
    }

    return left.source_name.localeCompare(right.source_name);
  });
}

export function get_source_cache(state, source_id) {
  return state.caches.find((entry) => entry.source_id === source_id) ?? null;
}

export function get_source(state, source_id) {
  const cache_id = parse_github_cache_id(source_id);

  if (!cache_id) {
    return state.sources.find((entry) => entry.source_id === source_id) ?? null;
  }

  const source = state.sources.find((entry) => entry.source_id === cache_id.source_id) ?? null;

  if (!source) {
    return null;
  }

  return {
    ...source,
    source_id,
    path: cache_id.file_path
  };
}

export function get_source_display_name(state, source_id) {
  const source = get_source(state, source_id);
  const cache = get_source_cache(state, source_id);

  return cache?.source_snapshot?.document_title || source?.source_name || source_id;
}

export function get_file_label(source) {
  if (!source || typeof source.path !== "string" || source.path.length === 0) {
    return "unknown.json";
  }

  const segments = source.path.split("/");
  return segments[segments.length - 1] || source.path;
}

export function get_edit_target_option_label(state, source_id) {
  const source = get_source(state, source_id);
  const display_name = get_source_display_name(state, source_id);
  return `${get_file_label(source)} - ${display_name}`;
}

export function get_source_option_label(source, display_name) {
  if (source.type === "github") {
    return `GitHub - ${display_name}`;
  }

  if (source.type === "http_static") {
    return `HTTP - ${display_name}`;
  }

  return display_name;
}
