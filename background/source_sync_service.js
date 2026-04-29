import {
  adapters,
  build_state,
  source_repository
} from "./context.js";
import {
  create_github_file_for_repo,
  create_github_template_for_repo,
  sync_github_repo_source
} from "./github_repo_service.js";
import { save_synced_source_cache } from "./source_cache_service.js";

export async function sync_source(source_id) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  const adapter = adapters[source.type];

  if (!adapter) {
    throw new Error(`Adapter is not implemented for source type: ${source.type}`);
  }

  if (source.type === "github") {
    return sync_github_repo_source(source);
  }

  const { document, revision } = await adapter.read(source);

  await save_synced_source_cache(
    source,
    document.items,
    document.title,
    revision
  );

  return {
    state: await build_state(),
    synced_source_id: source.source_id,
    synced_title: document.title,
    item_count: document.items.length
  };
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

function derive_document_title(file_name, requested_title = "") {
  const trimmed_title = typeof requested_title === "string" ? requested_title.trim() : "";

  if (trimmed_title.length > 0) {
    return trimmed_title;
  }

  const without_extension = file_name.replace(/\.json$/i, "");
  return without_extension.length > 0 ? without_extension : "new bookmarks";
}

export async function create_github_file(source_id, file_name, document_title = "") {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type !== "github" || !source.writable) {
    throw new Error("File creation is only supported for writable GitHub sources");
  }

  const next_title = derive_document_title(file_name, document_title);
  return create_github_file_for_repo(source, file_name, next_title);
}
