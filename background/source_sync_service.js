import {
  adapters,
  build_state,
  source_repository
} from "./context.js";
import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import {
  build_scoped_github_source,
  list_github_group_sources
} from "./source_group_service.js";
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
    const grouped_sources = await list_github_group_sources(source);
    const synced_source_ids = [source.source_id];
    let synced_title = null;
    let resolved_branch = null;

    for (const grouped_source of grouped_sources) {
      const file_paths = Array.isArray(grouped_source.file_paths) && grouped_source.file_paths.length > 0
        ? grouped_source.file_paths
        : [grouped_source.path];

      for (const file_path of file_paths) {
        const scoped_source = build_scoped_github_source(grouped_source, file_path);
        const github_result = await adapter.read(scoped_source);

        if (github_result.template_available) {
          return {
            state: await build_state(),
            synced_source_id: grouped_source.source_id,
            synced_source_ids,
            needs_template_creation: true,
            resolved_branch: github_result.resolved_branch,
            message: `bookmarks/ is not initialised on branch ${github_result.resolved_branch}`
          };
        }

        await save_synced_source_cache(
          scoped_source,
          github_result.document.items,
          github_result.document.title,
          github_result.revision,
          github_result.resolved_branch
        );

        synced_source_ids.push(scoped_source.source_id);
        synced_title = github_result.document.title;
        resolved_branch = github_result.resolved_branch;
      }
    }

    return {
      state: await build_state(),
      synced_source_id: source.source_id,
      synced_source_ids,
      synced_title,
      resolved_branch
    };
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

  const scoped_source = build_scoped_github_source(source, GITHUB_BOOKMARKS_FILE_PATH);
  const result = await adapters.github.create_template(scoped_source);

  const file_paths = Array.isArray(source.file_paths) ? source.file_paths : [];

  if (!file_paths.includes(GITHUB_BOOKMARKS_FILE_PATH)) {
    await source_repository.save_source({
      ...source,
      file_paths: [...file_paths, GITHUB_BOOKMARKS_FILE_PATH]
    });
  }

  await save_synced_source_cache(
    scoped_source,
    result.document.items,
    result.document.title,
    result.revision,
    result.resolved_branch
  );

  return {
    state: await build_state(),
    created_source_id: scoped_source.source_id,
    resolved_branch: result.resolved_branch,
    item_count: result.document.items.length
  };
}
