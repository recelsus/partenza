import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import {
  create_plain_document,
  save_github_cache
} from "./github_helpers.js";

export async function update_document_title(source_id, next_title) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (source.type !== "github") {
    throw new Error("Document title edit is only supported for GitHub sources");
  }

  const target_cache = await cache_repository.get_cache(source_id);

  if (!target_cache) {
    throw new Error("Target source cache was not found");
  }

  const trimmed_title = typeof next_title === "string" ? next_title.trim() : "";

  if (trimmed_title.length === 0) {
    throw new Error("Document title is required");
  }

  let write_result;

  try {
    write_result = await adapters.github.write_document(
      source,
      create_plain_document(trimmed_title, target_cache.items_cache),
      target_cache.last_remote_revision,
      `Update bookmark title: ${trimmed_title}`
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_remote = await adapters.github.read(source);

    if (latest_remote.template_available) {
      throw new Error("GitHub bookmark file is missing");
    }

    write_result = await adapters.github.write_document(
      source,
      create_plain_document(trimmed_title, latest_remote.document.items),
      latest_remote.revision,
      `Update bookmark title: ${trimmed_title}`
    );
  }

  await save_github_cache(
    source,
    target_cache,
    target_cache.items_cache,
    trimmed_title,
    write_result.revision,
    write_result.resolved_branch
  );

  return {
    state: await build_state()
  };
}
