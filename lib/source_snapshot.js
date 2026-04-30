export function create_source_id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function build_source_locator(source, resolved_branch = null) {
  if (source.type === "http_static") {
    return source.url;
  }

  if (source.type === "github") {
    const branch_label = resolved_branch || (source.branch && source.branch.trim().length > 0
      ? source.branch.trim()
      : "main|master");
    return `${source.owner}/${source.repo}:${source.path}@${branch_label}`;
  }

  return source.source_id;
}

export function create_source_snapshot(source, document_title = null, resolved_branch = null) {
  return {
    source_name: source.source_name,
    source_type: source.type,
    readable: source.readable ?? true,
    writable: source.writable,
    visibility: source.visibility ?? null,
    locator: build_source_locator(source, resolved_branch),
    document_title,
    resolved_branch,
    file_path: typeof source.path === "string" ? source.path : null
  };
}

export function create_empty_cache(source) {
  return {
    source_id: source.source_id,
    last_synced_at: null,
    last_remote_revision: null,
    dirty: false,
    items_cache: [],
    last_error: null,
    source_snapshot: create_source_snapshot(source)
  };
}
