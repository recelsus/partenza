import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import {
  create_plain_document,
  get_document_title_from_cache,
  read_required_github_document,
  save_github_cache
} from "./github_helpers.js";

export async function update_bookmark(source_id, bookmark_id, updates) {
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

  const next_items = target_cache.items_cache.map((item) => {
    if (item.id !== bookmark_id) {
      return item;
    }

    return {
      ...item,
      ...updates,
      updated_at: new Date().toISOString()
    };
  });

  if (source.type === "github") {
    let write_result;
    let committed_items = next_items;
    let committed_title = target_cache.source_snapshot?.document_title || source.source_name;

    try {
      write_result = await adapters.github.write_document(
        source,
        create_plain_document(committed_title, committed_items),
        target_cache.last_remote_revision,
        `Update bookmark: ${updates.title || bookmark_id}`
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
      committed_items = latest_remote.document.items.map((item) => {
        if (item.id !== bookmark_id) {
          return item;
        }

        return {
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        };
      });

      write_result = await adapters.github.write_document(
        source,
        create_plain_document(committed_title, committed_items),
        latest_remote.revision,
        `Update bookmark: ${updates.title || bookmark_id}`
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
      last_remote_revision: "local-edit",
      dirty: true,
      last_error: null
    });
  }

  return {
    state: await build_state()
  };
}

export async function save_bookmark_edit(source_id, target_source_id, bookmark_id, updates) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (!source.writable || source.type !== "github") {
    throw new Error("Selected source is read-only");
  }

  const target_source = target_source_id
    ? await source_repository.get_source(target_source_id)
    : source;

  if (!target_source) {
    throw new Error("Destination source was not found");
  }

  if (!target_source.writable || target_source.type !== "github") {
    throw new Error("Destination source must be a writable GitHub source");
  }

  if (target_source.source_id === source.source_id) {
    const result = await update_bookmark(source_id, bookmark_id, updates);
    return {
      ...result,
      target_source_id: source.source_id
    };
  }

  const source_cache = await cache_repository.get_cache(source.source_id);
  const target_cache = await cache_repository.get_cache(target_source.source_id);

  if (!source_cache || !target_cache) {
    throw new Error("Bookmark cache was not found");
  }

  const cached_bookmark = source_cache.items_cache.find((item) => item.id === bookmark_id);

  if (!cached_bookmark) {
    throw new Error("Bookmark was not found");
  }

  const updated_at = new Date().toISOString();
  const source_remote = await read_required_github_document(
    source,
    get_document_title_from_cache(source, source_cache)
  );
  const target_remote = await read_required_github_document(
    target_source,
    get_document_title_from_cache(target_source, target_cache)
  );
  const latest_source_bookmark = source_remote.items.find((item) => item.id === bookmark_id) || cached_bookmark;
  const moved_bookmark = {
    ...latest_source_bookmark,
    ...updates,
    updated_at
  };
  let target_items = [
    ...target_remote.items.filter((item) => item.id !== bookmark_id),
    moved_bookmark
  ];
  let target_write;

  try {
    target_write = await adapters.github.write_document(
      target_source,
      create_plain_document(target_remote.title, target_items),
      target_remote.revision,
      `Move bookmark: ${moved_bookmark.title}`
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_target_remote = await read_required_github_document(target_source, target_remote.title);
    target_items = [
      ...latest_target_remote.items.filter((item) => item.id !== bookmark_id),
      moved_bookmark
    ];
    target_write = await adapters.github.write_document(
      target_source,
      create_plain_document(latest_target_remote.title, target_items),
      latest_target_remote.revision,
      `Move bookmark: ${moved_bookmark.title}`
    );
    target_remote.title = latest_target_remote.title;
    target_remote.resolved_branch = latest_target_remote.resolved_branch;
  }

  let source_write;
  let committed_source_items = source_remote.items.filter((item) => item.id !== bookmark_id);

  try {
    source_write = await adapters.github.write_document(
      source,
      create_plain_document(source_remote.title, committed_source_items),
      source_remote.revision,
      `Move bookmark: ${moved_bookmark.title}`
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_source_remote = await read_required_github_document(source, source_remote.title);
    committed_source_items = latest_source_remote.items.filter((item) => item.id !== bookmark_id);
    source_write = await adapters.github.write_document(
      source,
      create_plain_document(latest_source_remote.title, committed_source_items),
      latest_source_remote.revision,
      `Move bookmark: ${moved_bookmark.title}`
    );
    source_remote.title = latest_source_remote.title;
    source_remote.resolved_branch = latest_source_remote.resolved_branch;
  }

  await save_github_cache(
    target_source,
    target_cache,
    target_items,
    target_remote.title,
    target_write.revision,
    target_write.resolved_branch
  );
  await save_github_cache(
    source,
    source_cache,
    committed_source_items,
    source_remote.title,
    source_write.revision,
    source_write.resolved_branch
  );

  return {
    state: await build_state(),
    target_source_id: target_source.source_id
  };
}
