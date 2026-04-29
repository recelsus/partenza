import {
  build_github_repo_key,
  build_scoped_github_source,
  group_github_sources
} from "../lib/github_source_model.js";
import { source_repository } from "./context.js";

export async function list_github_group_sources(source) {
  const all_sources = await source_repository.list_sources();
  const groups = group_github_sources(all_sources);
  const source_group = groups.get(build_github_repo_key(source));

  return source_group ?? [source];
}
