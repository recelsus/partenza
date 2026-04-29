import {
  create_source_snapshot,
} from "../lib/storage_repositories.js";
import { build_github_cache_id } from "../lib/github_source_unit.js";
import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { create_plain_document } from "./github_helpers.js";
import {
  assert_writable_github_target,
  build_github_export_path
} from "./export_helpers.js";

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

  assert_writable_github_target(github_base_source);

  const export_path = build_github_export_path(file_name);
  const export_source = {
    ...github_base_source,
    path: export_path
  };

  const file_paths = Array.isArray(github_base_source.file_paths) ? github_base_source.file_paths : [];

  if (file_paths.includes(export_path)) {
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

  await source_repository.save_source({
    ...github_base_source,
    file_paths: [...file_paths, export_path]
  });
  await cache_repository.save_cache({
    source_id: build_github_cache_id(github_base_source.source_id, export_path),
    last_synced_at: new Date().toISOString(),
    last_remote_revision: write_result.revision,
    dirty: false,
    items_cache: source_cache.items_cache,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...export_source,
        branch: write_result.resolved_branch,
        source_id: build_github_cache_id(github_base_source.source_id, export_path)
      },
      document_title,
      write_result.resolved_branch
    )
  });

  return {
    state: await build_state(),
    created_source_id: build_github_cache_id(github_base_source.source_id, export_path)
  };
}
