import { group_github_sources } from "../lib/source_grouping.js";
import { build_github_cache_id } from "../lib/github_source_unit.js";
import { source_repository } from "./context.js";

export async function list_github_group_sources(source) {
  const all_sources = await source_repository.list_sources();
  const groups = group_github_sources(all_sources);
  const source_group = groups.get([
    source.owner || "",
    source.repo || "",
    source.branch || ""
  ].join("::"));

  return source_group ?? [source];
}

export function build_scoped_github_source(source, file_path) {
  return {
    ...source,
    source_id: build_github_cache_id(source.source_id, file_path),
    path: file_path
  };
}
