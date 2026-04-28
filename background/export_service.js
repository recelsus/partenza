import { GITHUB_BOOKMARKS_DIRECTORY } from "../lib/github_adapter.js";
import {
  create_source_snapshot,
  create_source_id
} from "../lib/storage_repositories.js";
import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { create_plain_document } from "./github_helpers.js";

function build_github_export_path(file_name) {
  const trimmed_name = typeof file_name === "string" ? file_name.trim() : "";

  if (trimmed_name.length === 0) {
    throw new Error("Export file name is required");
  }

  if (trimmed_name.includes("/") || trimmed_name.includes("\\")) {
    throw new Error("Export file name must not include directory separators");
  }

  const final_name = trimmed_name.endsWith(".json") ? trimmed_name : `${trimmed_name}.json`;
  return `${GITHUB_BOOKMARKS_DIRECTORY}/${final_name}`;
}

export async function export_http_source_to_github(source_id, target_source_id, file_name) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Source was not found");
  }

  if (source.type !== "http_static") {
    throw new Error("Export is only supported from HTTP static sources");
  }

  const source_cache = await cache_repository.get_cache(source.source_id);

  if (!source_cache) {
    throw new Error("Source cache was not found");
  }

  const github_base_source = await source_repository.get_source(target_source_id);

  if (!github_base_source) {
    throw new Error("Target GitHub source was not found");
  }

  if (
    github_base_source.type !== "github"
    || !github_base_source.writable
    || typeof github_base_source.token !== "string"
    || github_base_source.token.trim().length === 0
  ) {
    throw new Error("Target source must be a writable GitHub source with PAT");
  }

  const export_path = build_github_export_path(file_name);
  const export_source = {
    ...github_base_source,
    source_id: create_source_id("github"),
    path: export_path
  };

  const existing_sources = await source_repository.list_sources();
  const local_duplicate = existing_sources.find((entry) => {
    return entry.type === "github"
      && entry.owner === export_source.owner
      && entry.repo === export_source.repo
      && entry.branch === export_source.branch
      && entry.path === export_source.path;
  });

  if (local_duplicate) {
    throw new Error("A GitHub bookmark file with the same name is already registered");
  }

  const inspection = await adapters.github.inspect_source(export_source);

  if (inspection.status === "file_ready") {
    throw new Error("A GitHub bookmark file with the same name already exists");
  }

  const document_title = source_cache.source_snapshot?.document_title || source.source_name;
  const next_document = create_plain_document(document_title, source_cache.items_cache);
  const write_result = await adapters.github.write_document(
    export_source,
    next_document,
    null,
    `Export bookmarks: ${document_title}`
  );

  await source_repository.save_source(export_source);
  await cache_repository.save_cache({
    source_id: export_source.source_id,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: write_result.revision,
    dirty: false,
    items_cache: source_cache.items_cache,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...export_source,
        branch: write_result.resolved_branch
      },
      document_title,
      write_result.resolved_branch
    )
  });

  return {
    state: await build_state(),
    created_source_id: export_source.source_id
  };
}
