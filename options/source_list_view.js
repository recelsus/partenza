import { group_github_sources } from "../lib/source_grouping.js";
import { render_github_group } from "./source_list_github_view.js";
import { render_http_source } from "./source_list_http_view.js";

export function render_sources(state, handlers) {
  const source_list = document.getElementById("source_list");

  source_list.innerHTML = "";

  if (state.sources.length === 0) {
    const empty_state = document.createElement("div");
    empty_state.className = "source-item";
    empty_state.textContent = "No registered sources.";
    source_list.appendChild(empty_state);
    return;
  }

  const github_groups = group_github_sources(state.sources);
  const http_sources = state.sources.filter((source) => source.type === "http_static");
  const github_group_entries = [...github_groups.values()].sort((left, right) => {
    const left_source = left[0];
    const right_source = right[0];
    return `${left_source.owner}/${left_source.repo}`.localeCompare(`${right_source.owner}/${right_source.repo}`);
  });

  for (const github_group of github_group_entries) {
    render_github_group(state, github_group, handlers, source_list);
  }

  for (const source of http_sources) {
    render_http_source(state, source, handlers, source_list);
  }
}
