import {
  source_repository
} from "./context.js";
import {
  derive_github_document_title,
  create_github_file_for_repo,
  create_github_template_for_repo,
  sync_github_repo_source
} from "./github_repo_service.js";
import { sync_http_source } from "./http_source_service.js";

export async function sync_source(source_id) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type === "github") {
    return sync_github_repo_source(source);
  }

  if (source.type === "http_static") {
    return sync_http_source(source);
  }

  throw new Error(`Adapter is not implemented for source type: ${source.type}`);
}

export async function create_github_template(source_id) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type !== "github") {
    throw new Error("Template creation is only supported for GitHub sources");
  }

  return create_github_template_for_repo(source);
}

export async function create_github_file(source_id, file_name, document_title = "") {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type !== "github" || !source.writable) {
    throw new Error("File creation is only supported for writable GitHub sources");
  }

  const next_title = derive_github_document_title(file_name, document_title);
  return create_github_file_for_repo(source, file_name, next_title);
}
