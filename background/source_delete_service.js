import { source_repository } from "./context.js";
import { parse_github_cache_id } from "../lib/github_source_model.js";
import { delete_github_file_from_repo, delete_github_repo_source } from "./github_repo_service.js";
import { delete_http_source } from "./http_source_service.js";

export async function delete_source(source_id) {
  const parsed = parse_github_cache_id(source_id);
  const root_source_id = parsed ? parsed.source_id : source_id;
  const source = await source_repository.get_source(root_source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type === "github") {
    return delete_github_repo_source(source);
  }

  if (source.type === "http_static") {
    return delete_http_source(source);
  }

  throw new Error(`Delete is not implemented for source type: ${source.type}`);
}

export async function delete_github_file(source_id, file_path) {
  const source = await source_repository.get_source(source_id);

  if (!source || source.type !== "github") {
    throw new Error("GitHub repository was not found");
  }

  if (!source.writable) {
    throw new Error("GitHub file deletion is only supported for writable GitHub sources");
  }

  return delete_github_file_from_repo(source, file_path);
}
