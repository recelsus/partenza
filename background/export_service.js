import {
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { create_plain_bookmark_document } from "../lib/bookmark_document.js";
import { create_github_bookmark_file } from "./github_file_create_service.js";
import { assert_writable_github_target } from "./export_helpers.js";

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

  const document_title = source_cache.source_snapshot?.document_title || source.source_name;
  const result = await create_github_bookmark_file(
    github_base_source,
    file_name,
    create_plain_bookmark_document(document_title, source_cache.items_cache),
    `Export bookmarks: ${document_title}`
  );

  return {
    state: await build_state(),
    created_source_id: result.created_source_id
  };
}
