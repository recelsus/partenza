import {
  build_state,
} from "./context.js";
import { save_github_cache } from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";
import {
  require_cache,
  require_writable_github_source
} from "./source_context_service.js";

export async function update_document_title(source_id, next_title) {
  const source = await require_writable_github_source(
    source_id,
    "Target source was not found",
    "Document title edit is only supported for GitHub sources"
  );
  const target_cache = await require_cache(source_id, "Target source cache was not found");

  const trimmed_title = typeof next_title === "string" ? next_title.trim() : "";

  if (trimmed_title.length === 0) {
    throw new Error("Document title is required");
  }

  const write_result = await write_github_document_with_retry(
    source,
    trimmed_title,
    target_cache.items_cache,
    target_cache.last_remote_revision,
    `Update bookmark title: ${trimmed_title}`,
    (latest_remote) => ({
      title: trimmed_title,
      items: latest_remote.items
    })
  );

  await save_github_cache(
    source,
    target_cache,
    write_result.items,
    trimmed_title,
    write_result.revision,
    write_result.resolved_branch
  );

  return {
    state: await build_state()
  };
}
