import {
  GithubAdapter,
  GITHUB_BOOKMARKS_DIRECTORY,
  GITHUB_BOOKMARKS_FILE_PATH
} from "./lib/github_adapter.js";
import { HttpStaticAdapter } from "./lib/http_static_adapter.js";
import {
  ChromeStorageSourceCacheRepository,
  ChromeStorageSourceRepository,
  ChromeStorageSyncSettingsRepository,
  create_empty_cache,
  create_source_snapshot,
  create_source_id,
  get_storage_state
} from "./lib/storage_repositories.js";

const source_repository = new ChromeStorageSourceRepository();
const cache_repository = new ChromeStorageSourceCacheRepository();
const settings_repository = new ChromeStorageSyncSettingsRepository();

const adapters = {
  http_static: new HttpStaticAdapter(),
  github: new GithubAdapter()
};

async function build_state() {
  return get_storage_state(source_repository, cache_repository, settings_repository);
}

async function find_default_add_target_source() {
  const sources = await source_repository.list_sources();

  return sources.find((source) => {
    return source.type === "github"
      && source.writable
      && source.path === GITHUB_BOOKMARKS_FILE_PATH
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  }) ?? sources.find((source) => {
    return source.type === "github"
      && source.writable
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  }) ?? null;
}

async function register_http_source(url) {
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

async function register_github_source(input) {
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

async function sync_source(source_id) {
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
        message: `No bookmark file found in bookmarks/ on branch ${github_result.resolved_branch}`
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

async function create_github_template(source_id) {
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

async function delete_source(source_id) {
  await source_repository.delete_source(source_id);
  await cache_repository.delete_cache(source_id);
  return build_state();
}

function create_tab_bookmark(tab) {
  const now = new Date().toISOString();

  return {
    id: `tab-${Date.now()}`,
    title: tab.title || tab.url || "Untitled tab",
    url: tab.url || "",
    tags: [],
    note: "Added from the active browser tab.",
    created_at: now,
    updated_at: now
  };
}

function create_plain_document(title, items) {
  return {
    format: "portable-bookmark-store",
    version: 1,
    encoding: "plain",
    title,
    items
  };
}

function get_document_title_from_cache(source, cache) {
  return cache?.source_snapshot?.document_title || source.source_name;
}

async function save_github_cache(source, cache, items, title, revision, resolved_branch) {
  await cache_repository.save_cache({
    ...cache,
    items_cache: items,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: revision,
    dirty: false,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...source,
        branch: resolved_branch
      },
      title,
      resolved_branch
    )
  });
}

async function read_required_github_document(source, fallback_title = null) {
  const result = await adapters.github.read(source);

  if (result.template_available) {
    throw new Error("GitHub bookmark file is missing");
  }

  return {
    title: result.document.title || fallback_title || source.source_name,
    items: result.document.items,
    revision: result.revision,
    resolved_branch: result.resolved_branch
  };
}

async function add_current_tab(source_id) {
  const source = source_id === "all"
    ? await find_default_add_target_source()
    : await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (!source.writable) {
    throw new Error("Selected source is read-only");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    throw new Error("Active tab is unavailable");
  }

  const target_cache = await cache_repository.get_cache(source.source_id);

  if (!target_cache) {
    throw new Error("Target source cache was not found");
  }

  const next_item = create_tab_bookmark(tab);
  const next_items = [...target_cache.items_cache, next_item];
  const next_document_title = target_cache.source_snapshot?.document_title || source.source_name;

  if (source.type === "github") {
    let write_result;
    let committed_items = next_items;

    try {
      const next_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: next_document_title,
        items: committed_items
      };
      write_result = await adapters.github.write_document(
        source,
        next_document,
        target_cache.last_remote_revision,
        `Add bookmark: ${next_item.title}`
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("409")) {
        throw error;
      }

      const latest_remote = await adapters.github.read(source);

      if (latest_remote.template_available) {
        throw new Error("GitHub bookmark file is missing");
      }

      committed_items = [...latest_remote.document.items, next_item];
      const retry_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: latest_remote.document.title || next_document_title,
        items: committed_items
      };

      write_result = await adapters.github.write_document(
        source,
        retry_document,
        latest_remote.revision,
        `Add bookmark: ${next_item.title}`
      );
    }

    await cache_repository.save_cache({
      ...target_cache,
      items_cache: committed_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: write_result.revision,
      dirty: false,
      last_error: null,
      source_snapshot: create_source_snapshot(
        {
          ...source,
          branch: write_result.resolved_branch
        },
        next_document_title,
        write_result.resolved_branch
      )
    });
  } else {
    await cache_repository.save_cache({
      ...target_cache,
      items_cache: next_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: "local-update",
      dirty: true,
      last_error: null,
      source_snapshot: create_source_snapshot(
        source,
        next_document_title,
        target_cache.source_snapshot?.resolved_branch ?? null
      )
    });
  }

  return {
    state: await build_state(),
    added_item: next_item,
    target_source_id: source.source_id
  };
}

async function handle_add_current_tab_shortcut() {
  try {
    await add_current_tab("all");
  } catch (error) {
    console.error("Failed to add current tab from shortcut", error);
  }
}

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

async function export_http_source_to_github(source_id, target_source_id, file_name) {
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

  if (inspection.status === "directory_missing") {
    throw new Error("bookmarks/ directory is missing on the target GitHub repository");
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

async function update_bookmark(source_id, bookmark_id, updates) {
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
      const next_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: committed_title,
        items: committed_items
      };

      write_result = await adapters.github.write_document(
        source,
        next_document,
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

      const retry_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: committed_title,
        items: committed_items
      };

      write_result = await adapters.github.write_document(
        source,
        retry_document,
        latest_remote.revision,
        `Update bookmark: ${updates.title || bookmark_id}`
      );
    }

    await cache_repository.save_cache({
      ...target_cache,
      items_cache: committed_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: write_result.revision,
      dirty: false,
      last_error: null,
      source_snapshot: create_source_snapshot(
        {
          ...source,
          branch: write_result.resolved_branch
        },
        committed_title,
        write_result.resolved_branch
      )
    });
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

async function save_bookmark_edit(source_id, target_source_id, bookmark_id, updates) {
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

async function delete_bookmark(source_id, bookmark_id) {
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
      const next_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: committed_title,
        items: committed_items
      };

      write_result = await adapters.github.write_document(
        source,
        next_document,
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

      const retry_document = {
        format: "portable-bookmark-store",
        version: 1,
        encoding: "plain",
        title: committed_title,
        items: committed_items
      };

      write_result = await adapters.github.write_document(
        source,
        retry_document,
        latest_remote.revision,
        `Delete bookmark: ${bookmark_id}`
      );
    }

    await cache_repository.save_cache({
      ...target_cache,
      items_cache: committed_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: write_result.revision,
      dirty: false,
      last_error: null,
      source_snapshot: create_source_snapshot(
        {
          ...source,
          branch: write_result.resolved_branch
        },
        committed_title,
        write_result.resolved_branch
      )
    });
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

async function update_document_title(source_id, next_title) {
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
    const next_document = {
      format: "portable-bookmark-store",
      version: 1,
      encoding: "plain",
      title: trimmed_title,
      items: target_cache.items_cache
    };

    write_result = await adapters.github.write_document(
      source,
      next_document,
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

    const retry_document = {
      format: "portable-bookmark-store",
      version: 1,
      encoding: "plain",
      title: trimmed_title,
      items: latest_remote.document.items
    };

    write_result = await adapters.github.write_document(
      source,
      retry_document,
      latest_remote.revision,
      `Update bookmark title: ${trimmed_title}`
    );
  }

  await cache_repository.save_cache({
    ...target_cache,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: write_result.revision,
    dirty: false,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...source,
        branch: write_result.resolved_branch
      },
      trimmed_title,
      write_result.resolved_branch
    )
  });

  return {
    state: await build_state()
  };
}

function reorder_items_by_ids(items, ordered_bookmark_ids) {
  const rank_map = new Map(ordered_bookmark_ids.map((id, index) => [id, index]));
  const known_items = [];
  const unknown_items = [];

  for (const item of items) {
    if (rank_map.has(item.id)) {
      known_items.push(item);
    } else {
      unknown_items.push(item);
    }
  }

  known_items.sort((left, right) => rank_map.get(left.id) - rank_map.get(right.id));
  return [...known_items, ...unknown_items];
}

async function reorder_bookmarks(source_id, ordered_bookmark_ids) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (source.type !== "github" || !source.writable) {
    throw new Error("Bookmark reordering is only supported for writable GitHub sources");
  }

  const target_cache = await cache_repository.get_cache(source_id);

  if (!target_cache) {
    throw new Error("Target source cache was not found");
  }

  const committed_title = target_cache.source_snapshot?.document_title || source.source_name;
  const next_items = reorder_items_by_ids(target_cache.items_cache, ordered_bookmark_ids);
  let write_result;
  let committed_items = next_items;
  let next_title = committed_title;

  try {
    write_result = await adapters.github.write_document(
      source,
      create_plain_document(next_title, committed_items),
      target_cache.last_remote_revision,
      "Reorder bookmarks"
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_remote = await adapters.github.read(source);

    if (latest_remote.template_available) {
      throw new Error("GitHub bookmark file is missing");
    }

    next_title = latest_remote.document.title || next_title;
    committed_items = reorder_items_by_ids(latest_remote.document.items, ordered_bookmark_ids);
    write_result = await adapters.github.write_document(
      source,
      create_plain_document(next_title, committed_items),
      latest_remote.revision,
      "Reorder bookmarks"
    );
  }

  await save_github_cache(
    source,
    target_cache,
    committed_items,
    next_title,
    write_result.revision,
    write_result.resolved_branch
  );

  return {
    state: await build_state()
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "ping") {
      sendResponse({ ok: true, data: { pong: true } });
      return;
    }

    if (message.type === "get_view_state") {
      sendResponse({ ok: true, data: await build_state() });
      return;
    }

    if (message.type === "register_http_source") {
      sendResponse({ ok: true, data: await register_http_source(message.url) });
      return;
    }

    if (message.type === "register_github_source") {
      sendResponse({ ok: true, data: await register_github_source(message) });
      return;
    }

    if (message.type === "sync_source") {
      sendResponse({ ok: true, data: await sync_source(message.source_id) });
      return;
    }

    if (message.type === "create_github_template") {
      sendResponse({ ok: true, data: await create_github_template(message.source_id) });
      return;
    }

    if (message.type === "delete_source") {
      sendResponse({ ok: true, data: await delete_source(message.source_id) });
      return;
    }

    if (message.type === "add_current_tab") {
      sendResponse({ ok: true, data: await add_current_tab(message.source_id) });
      return;
    }

    if (message.type === "export_http_source_to_github") {
      sendResponse({
        ok: true,
        data: await export_http_source_to_github(
          message.source_id,
          message.target_source_id,
          message.file_name
        )
      });
      return;
    }

    if (message.type === "update_bookmark") {
      sendResponse({
        ok: true,
        data: await update_bookmark(message.source_id, message.bookmark_id, message.updates)
      });
      return;
    }

    if (message.type === "save_bookmark_edit") {
      sendResponse({
        ok: true,
        data: await save_bookmark_edit(
          message.source_id,
          message.target_source_id,
          message.bookmark_id,
          message.updates
        )
      });
      return;
    }

    if (message.type === "delete_bookmark") {
      sendResponse({
        ok: true,
        data: await delete_bookmark(message.source_id, message.bookmark_id)
      });
      return;
    }

    if (message.type === "update_document_title") {
      sendResponse({
        ok: true,
        data: await update_document_title(message.source_id, message.title)
      });
      return;
    }

    if (message.type === "reorder_bookmarks") {
      sendResponse({
        ok: true,
        data: await reorder_bookmarks(message.source_id, message.ordered_bookmark_ids)
      });
      return;
    }

    sendResponse({ ok: false, error_code: "unknown_message", message: "Unknown message type" });
  })().catch((error) => {
    sendResponse({
      ok: false,
      error_code: "runtime_error",
      message: error instanceof Error ? error.message : String(error)
    });
  });

  return true;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "add-current-tab") {
    handle_add_current_tab_shortcut();
  }
});
