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

export async function delete_bookmark(source_id, bookmark_id) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (!source.writable) {
    throw new Error("Selected source is read-only");
  }

  const target_cache = await cache_repository.get_cache(source_id);

  if (!target_cache) {
    throw new Error("Target source cache was not found");
  }

  const next_items = target_cache.items_cache.filter((item) => item.id !== bookmark_id);

  if (source.type === "github") {
    let write_result;
    let committed_items = next_items;
    let committed_title = target_cache.source_snapshot?.document_title || source.source_name;

    try {
      write_result = await adapters.github.write_document(
        source,
        create_plain_document(committed_title, committed_items),
        target_cache.last_remote_revision,
        `Delete bookmark: ${bookmark_id}`
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("409")) {
        throw error;
      }

      const latest_remote = await adapters.github.read(source);

      if (latest_remote.template_available) {
        throw new Error("GitHub bookmark file is missing");
      }

      committed_title = latest_remote.document.title || committed_title;
      committed_items = latest_remote.document.items.filter((item) => item.id !== bookmark_id);

      write_result = await adapters.github.write_document(
        source,
        create_plain_document(committed_title, committed_items),
        latest_remote.revision,
        `Delete bookmark: ${bookmark_id}`
      );
    }

    await save_github_cache(
      source,
      target_cache,
      committed_items,
      committed_title,
      write_result.revision,
      write_result.resolved_branch
    );
  } else {
    await cache_repository.save_cache({
      ...target_cache,
      items_cache: next_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: "local-delete",
      dirty: true,
      last_error: null
    });
  }

  return {
    state: await build_state()
  };
}
