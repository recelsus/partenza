import {
  build_state,
} from "./context.js";
import { apply_github_document_change } from "./github_document_change_service.js";
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

  await apply_github_document_change(
    source,
    target_cache,
    `Update bookmark title: ${trimmed_title}`,
    (document) => ({
      title: trimmed_title,
      items: document.items
    })
  );

  return {
    state: await build_state()
  };
}
