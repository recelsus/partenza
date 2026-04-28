import {
  GITHUB_BOOKMARKS_FILE_PATH
} from "../lib/github_adapter.js";
import {
  create_empty_cache,
  create_source_snapshot,
  create_source_id
} from "../lib/storage_repositories.js";
import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";

export async function register_http_source(url) {
  const existing_sources = await source_repository.list_sources();
  const normalised_url = url.trim();
  const has_duplicate = existing_sources.some((source) => {
    return source.type === "http_static" && source.url === normalised_url;
  });

  if (has_duplicate) {
    throw new Error("HTTP static source with the same URL is already registered");
  }

  const next_source = {
    source_id: create_source_id("http"),
    source_name: normalised_url,
    type: "http_static",
    enabled: true,
    writable: false,
    url: normalised_url
  };

  await adapters.http_static.validate_source(next_source);
  await source_repository.save_source(next_source);
  await cache_repository.save_cache(create_empty_cache(next_source));
  return sync_source(next_source.source_id);
}

export async function register_github_source(input) {
  const base_source = {
    source_id: create_source_id("github"),
    source_name: `${input.owner.trim()}/${input.repo.trim()}`,
    type: "github",
    enabled: true,
    writable: true,
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    branch: input.branch.trim(),
    path: GITHUB_BOOKMARKS_FILE_PATH,
    token: input.token.trim()
  };

  await adapters.github.validate_source(base_source);

  const existing_sources = await source_repository.list_sources();
  const discovered = await adapters.github.list_bookmark_files(base_source);
  const discovered_paths = discovered.files.length > 0 ? discovered.files : [GITHUB_BOOKMARKS_FILE_PATH];
  const synced_source_ids = [];

  for (const path of discovered_paths) {
    const duplicate = existing_sources.find((source) => {
      return source.type === "github"
        && source.owner === base_source.owner
        && source.repo === base_source.repo
        && source.branch === base_source.branch
        && source.path === path;
    });

    if (duplicate) {
      synced_source_ids.push(duplicate.source_id);
      continue;
    }

    const next_source = {
      ...base_source,
      source_id: create_source_id("github"),
      path
    };

    await source_repository.save_source(next_source);
    await cache_repository.save_cache(create_empty_cache(next_source));
    synced_source_ids.push(next_source.source_id);
  }

  if (synced_source_ids.length === 0) {
    throw new Error("No GitHub bookmark sources were discovered");
  }

  if (discovered.files.length === 0) {
    return sync_source(synced_source_ids[0]);
  }

  for (const source_id of synced_source_ids) {
    await sync_source(source_id);
  }

  return {
    state: await build_state(),
    synced_source_id: synced_source_ids[0],
    synced_source_ids
  };
}

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
    const github_result = await adapter.read(source);

    if (github_result.template_available) {
      return {
        state: await build_state(),
        synced_source_id: source.source_id,
        needs_template_creation: true,
        resolved_branch: github_result.resolved_branch,
        message: `bookmarks/ is not initialised on branch ${github_result.resolved_branch}`
      };
    }

    await cache_repository.save_cache({
      source_id: source.source_id,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: github_result.revision,
      dirty: false,
      items_cache: github_result.document.items,
      last_error: null,
      source_snapshot: create_source_snapshot(
        {
          ...source,
          branch: github_result.resolved_branch
        },
        github_result.document.title,
        github_result.resolved_branch
      )
    });

    return {
      state: await build_state(),
      synced_source_id: source.source_id,
      synced_title: github_result.document.title,
      item_count: github_result.document.items.length,
      resolved_branch: github_result.resolved_branch
    };
  }

  const { document, revision } = await adapter.read(source);

  await cache_repository.save_cache({
    source_id: source.source_id,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: revision,
    dirty: false,
    items_cache: document.items,
    last_error: null,
    source_snapshot: create_source_snapshot(source, document.title)
  });

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

  const result = await adapters.github.create_template(source);

  await cache_repository.save_cache({
    source_id: source.source_id,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: result.revision,
    dirty: false,
    items_cache: result.document.items,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...source,
        branch: result.resolved_branch
      },
      result.document.title,
      result.resolved_branch
    )
  });

  return {
    state: await build_state(),
    created_source_id: source.source_id,
    resolved_branch: result.resolved_branch,
    item_count: result.document.items.length
  };
}

export async function delete_source(source_id) {
  await source_repository.delete_source(source_id);
  await cache_repository.delete_cache(source_id);
  return build_state();
}
