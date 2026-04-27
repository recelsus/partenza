function send_message(message) {
  return chrome.runtime.sendMessage(message);
}

let status_timer_id = null;
let active_tag_filter = null;
let active_search_query = "";
let current_view_state = null;
let editing_context = null;
let export_context = null;
let sort_mode_source_id = null;
let draft_sort_bookmark_ids = [];
let dragging_bookmark_id = null;

function set_status(text, is_error = false) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.classList.toggle("error", is_error);
  status.classList.toggle("visible", text.length > 0);

  if (status_timer_id !== null) {
    window.clearTimeout(status_timer_id);
    status_timer_id = null;
  }

  if (text.length > 0) {
    status_timer_id = window.setTimeout(() => {
      status.classList.remove("visible");
      status_timer_id = null;
    }, is_error ? 3200 : 1400);
  }
}

function set_loading_status(text) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.classList.remove("error");
  status.classList.add("visible");

  if (status_timer_id !== null) {
    window.clearTimeout(status_timer_id);
    status_timer_id = null;
  }
}

function get_selected_source_id() {
  return document.getElementById("source_select").value;
}

function create_edit_icon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  `;
}

function create_delete_icon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  `;
}

function get_source_option_label(source, display_name) {
  if (source.type === "github") {
    return `GitHub - ${display_name}`;
  }

  if (source.type === "http_static") {
    return `HTTP - ${display_name}`;
  }

  return display_name;
}

function get_source_sort_rank(source) {
  if (source.type === "github") {
    return 0;
  }

  if (source.type === "http_static") {
    return 1;
  }

  return 9;
}

function sort_sources(sources) {
  return [...sources].sort((left, right) => {
    const rank_diff = get_source_sort_rank(left) - get_source_sort_rank(right);

    if (rank_diff !== 0) {
      return rank_diff;
    }

    return left.source_name.localeCompare(right.source_name);
  });
}

function get_source_cache(state, source_id) {
  return state.caches.find((entry) => entry.source_id === source_id) ?? null;
}

function get_source(state, source_id) {
  return state.sources.find((entry) => entry.source_id === source_id) ?? null;
}

function get_source_display_name(state, source_id) {
  const source = get_source(state, source_id);
  const cache = get_source_cache(state, source_id);

  return cache?.source_snapshot?.document_title || source?.source_name || source_id;
}

function get_file_label(source) {
  if (!source || typeof source.path !== "string" || source.path.length === 0) {
    return "unknown.json";
  }

  const segments = source.path.split("/");
  return segments[segments.length - 1] || source.path;
}

function get_edit_target_option_label(state, source_id) {
  const source = get_source(state, source_id);
  const display_name = get_source_display_name(state, source_id);
  return `${get_file_label(source)} - ${display_name}`;
}

function render_edit_target_hint(source_id) {
  if (!current_view_state) {
    return;
  }

  const source = get_source(current_view_state, source_id);
  const target_hint = document.getElementById("edit_target_source_hint");

  if (!source) {
    target_hint.textContent = "";
    return;
  }

  target_hint.textContent = `${source.path} / ${get_source_display_name(current_view_state, source_id)}`;
}

function render_export_target_hint(source_id) {
  if (!current_view_state) {
    return;
  }

  const source = get_source(current_view_state, source_id);
  const target_hint = document.getElementById("export_target_source_hint");

  if (!source) {
    target_hint.textContent = "";
    return;
  }

  target_hint.textContent = `${source.owner}/${source.repo} / ${source.path}`;
}

function render_sources(state, selected_source_id) {
  const source_select = document.getElementById("source_select");
  const ordered_sources = sort_sources(state.sources);

  source_select.innerHTML = "";

  const all_option = document.createElement("option");
  all_option.value = "all";
  all_option.textContent = "All";
  all_option.selected = selected_source_id === "all";
  source_select.appendChild(all_option);

  if (ordered_sources.length === 0) {
    source_select.value = "all";
    return;
  }

  let has_selected_source = selected_source_id === "all";

  for (const source of ordered_sources) {
    const display_name = get_source_display_name(state, source.source_id);
    const option = document.createElement("option");
    option.value = source.source_id;
    option.textContent = get_source_option_label(source, display_name);
    option.selected = source.source_id === selected_source_id;
    has_selected_source = has_selected_source || option.selected;
    source_select.appendChild(option);
  }

  if (!has_selected_source && ordered_sources.length > 0) {
    source_select.value = "all";
  }
}

function collect_bookmark_entries(state, selected_source_id) {
  if (selected_source_id !== "all") {
    const cache = get_source_cache(state, selected_source_id);
    const source = get_source(state, selected_source_id);

    if (!cache || !source) {
      return [];
    }

    return cache.items_cache.map((bookmark) => ({
      bookmark,
      source_id: cache.source_id,
      writable: Boolean(cache.source_snapshot?.writable),
      source_type: cache.source_snapshot?.source_type || source.type || ""
    }));
  }

  const caches = selected_source_id === "all"
    ? state.caches
    : state.caches.filter((entry) => entry.source_id === selected_source_id);

  return caches.flatMap((cache) => {
    return cache.items_cache.map((bookmark) => ({
      bookmark,
      source_id: cache.source_id,
      writable: Boolean(cache.source_snapshot?.writable),
      source_type: cache.source_snapshot?.source_type || ""
    }));
  }).sort((left, right) => {
    const rank_diff = get_source_sort_rank({ type: left.source_type })
      - get_source_sort_rank({ type: right.source_type });

    if (rank_diff !== 0) {
      return rank_diff;
    }

    return left.bookmark.title.localeCompare(right.bookmark.title);
  });
}

function filter_bookmark_entries(bookmark_entries) {
  const filtered_entries = active_tag_filter
    ? bookmark_entries.filter((entry) => entry.bookmark.tags.includes(active_tag_filter))
    : bookmark_entries;
  const search_query = active_search_query.trim().toLowerCase();

  return search_query.length > 0
    ? filtered_entries.filter((entry) => {
      const { bookmark } = entry;
      const haystacks = [
        bookmark.title,
        bookmark.url,
        bookmark.note,
        ...bookmark.tags
      ];

      return haystacks.some((value) => value.toLowerCase().includes(search_query));
    })
    : filtered_entries;
}

function is_sort_mode_active_for(source_id) {
  return sort_mode_source_id === source_id;
}

function can_sort_selected_source(state, selected_source_id) {
  const source = get_source(state, selected_source_id);

  return Boolean(
    source
      && source.type === "github"
      && selected_source_id !== "all"
      && !active_tag_filter
      && active_search_query.trim().length === 0
  );
}

function reorder_entries(entries, ordered_ids) {
  const rank_map = new Map(ordered_ids.map((id, index) => [id, index]));
  const sorted = [...entries].sort((left, right) => {
    const left_rank = rank_map.has(left.bookmark.id) ? rank_map.get(left.bookmark.id) : Number.MAX_SAFE_INTEGER;
    const right_rank = rank_map.has(right.bookmark.id) ? rank_map.get(right.bookmark.id) : Number.MAX_SAFE_INTEGER;
    return left_rank - right_rank;
  });

  return sorted;
}

function update_sort_buttons(state, selected_source_id) {
  const start_sort_button = document.getElementById("start_sort_button");
  const save_sort_button = document.getElementById("save_sort_button");
  const cancel_sort_button = document.getElementById("cancel_sort_button");
  const can_sort = can_sort_selected_source(state, selected_source_id);
  const is_sorting = is_sort_mode_active_for(selected_source_id);

  start_sort_button.hidden = !can_sort || is_sorting;
  save_sort_button.hidden = !is_sorting;
  cancel_sort_button.hidden = !is_sorting;

  if (can_sort && !is_sorting) {
    start_sort_button.title = "Reorder bookmarks";
  } else if (!can_sort && selected_source_id !== "all") {
    start_sort_button.title = "Sorting is available only for a GitHub file without filters";
  }
}

function update_export_button(state, selected_source_id, is_sorting) {
  const export_button = document.getElementById("export_button");
  const selected_source = get_source(state, selected_source_id);
  const has_github_target = state.sources.some((source) => {
    return source.type === "github"
      && source.writable
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  });
  const can_export = Boolean(
    selected_source
      && selected_source.type === "http_static"
      && selected_source_id !== "all"
      && has_github_target
      && !is_sorting
  );

  export_button.hidden = !can_export;
  export_button.title = can_export
    ? "Export this HTTP bookmark file to GitHub"
    : "A writable GitHub source with PAT is required";
}

function move_draft_sort_bookmark(moved_id, target_id) {
  if (!moved_id || !target_id || moved_id === target_id) {
    return;
  }

  const next_ids = [...draft_sort_bookmark_ids];
  const from_index = next_ids.indexOf(moved_id);
  const to_index = next_ids.indexOf(target_id);

  if (from_index === -1 || to_index === -1) {
    return;
  }

  next_ids.splice(from_index, 1);
  next_ids.splice(to_index, 0, moved_id);
  draft_sort_bookmark_ids = next_ids;
}

function start_sort_mode(state, source_id) {
  if (!can_sort_selected_source(state, source_id)) {
    return;
  }

  const cache = get_source_cache(state, source_id);

  if (!cache) {
    return;
  }

  sort_mode_source_id = source_id;
  draft_sort_bookmark_ids = cache.items_cache.map((bookmark) => bookmark.id);
  dragging_bookmark_id = null;
  render_bookmarks(state);
}

function cancel_sort_mode() {
  sort_mode_source_id = null;
  draft_sort_bookmark_ids = [];
  dragging_bookmark_id = null;

  if (current_view_state) {
    render_bookmarks(current_view_state);
  }
}

function render_bookmarks(state) {
  const bookmarks_list = document.getElementById("bookmarks_list");
  const bookmark_count = document.getElementById("bookmark_count");
  const edit_title_button = document.getElementById("edit_title_button");
  const active_tag_label = document.getElementById("active_tag_label");
  const search_input = document.getElementById("search_input");
  const selected_source_id = get_selected_source_id();
  const caches = selected_source_id === "all"
    ? state.caches
    : state.caches.filter((entry) => entry.source_id === selected_source_id);
  const selected_source = get_source(state, selected_source_id);
  const is_sorting = is_sort_mode_active_for(selected_source_id);

  bookmarks_list.innerHTML = "";
  search_input.disabled = is_sorting;

  const can_edit_title = Boolean(selected_source && selected_source.type === "github");
  edit_title_button.hidden = !can_edit_title || is_sorting;
  update_sort_buttons(state, selected_source_id);
  update_export_button(state, selected_source_id, is_sorting);

  if (caches.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No bookmark cache for the selected source.";
    bookmarks_list.appendChild(item);
    bookmark_count.textContent = "0 items";
    active_tag_label.hidden = !is_sorting && !active_tag_filter;
    active_tag_label.textContent = is_sorting
      ? "drag to reorder"
      : active_tag_filter ? `tag: ${active_tag_filter}` : "";
    return;
  }

  const source_entries = collect_bookmark_entries(state, selected_source_id);
  const searched_entries = is_sorting
    ? reorder_entries(source_entries, draft_sort_bookmark_ids)
    : filter_bookmark_entries(source_entries);

  bookmark_count.textContent = `${searched_entries.length} items`;
  active_tag_label.hidden = !is_sorting && !active_tag_filter;
  active_tag_label.textContent = is_sorting
    ? "drag to reorder"
    : active_tag_filter ? `tag: ${active_tag_filter}` : "";

  if (searched_entries.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = active_tag_filter || active_search_query.trim().length > 0
      ? "No bookmarks match the current filter."
      : "No bookmarks found.";
    bookmarks_list.appendChild(item);
    return;
  }

  for (const entry of searched_entries) {
    const { bookmark, source_id, writable } = entry;
    const item = document.createElement("li");
    item.className = "bookmark-item";
    item.dataset.bookmarkId = bookmark.id;

    if (is_sorting) {
      item.classList.add("sortable");
      item.draggable = true;
      item.addEventListener("dragstart", () => {
        dragging_bookmark_id = bookmark.id;
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        dragging_bookmark_id = null;
        item.classList.remove("dragging");
      });
      item.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        move_draft_sort_bookmark(dragging_bookmark_id, bookmark.id);
        render_bookmarks(state);
      });
    }

    const head = document.createElement("div");
    head.className = "bookmark-head";

    const main = document.createElement("div");
    main.className = "bookmark-main";

    const link = document.createElement(is_sorting ? "span" : "a");
    link.className = "bookmark-link";

    if (!is_sorting) {
      link.href = bookmark.url;
      link.target = "_blank";
      link.rel = "noreferrer";
    }

    link.textContent = bookmark.title;
    main.appendChild(link);

    const visible_tags = bookmark.tags.slice(0, 3);

    if (visible_tags.length > 0) {
      const tag_list = document.createElement("div");
      tag_list.className = "tag-list";

      for (const tag of visible_tags) {
        const tag_pill = document.createElement("button");
        tag_pill.type = "button";
        tag_pill.className = "tag-pill";
        tag_pill.textContent = tag;
        tag_pill.classList.toggle("active", active_tag_filter === tag);
        tag_pill.addEventListener("click", () => {
          active_tag_filter = active_tag_filter === tag ? null : tag;
          render_bookmarks(state);
        });
        tag_list.appendChild(tag_pill);
      }

      main.appendChild(tag_list);
    }

    const actions = document.createElement("div");
    actions.className = "bookmark-actions";

    if (!is_sorting) {
      const edit_button = document.createElement("button");
      edit_button.className = "action-button";
      edit_button.innerHTML = create_edit_icon();
      edit_button.disabled = !writable;
      edit_button.title = writable ? "Edit bookmark" : "Read-only source";
      edit_button.setAttribute("aria-label", writable ? "Edit bookmark" : "Read-only source");
      edit_button.addEventListener("click", () => {
        open_edit_view(source_id, bookmark.id);
      });
      actions.appendChild(edit_button);

      const delete_button = document.createElement("button");
      delete_button.className = "action-button";
      delete_button.innerHTML = create_delete_icon();
      delete_button.disabled = !writable;
      delete_button.title = writable ? "Delete bookmark" : "Read-only source";
      delete_button.setAttribute("aria-label", writable ? "Delete bookmark" : "Read-only source");
      delete_button.addEventListener("click", async () => {
        const should_delete = window.confirm(`Delete "${bookmark.title}"?`);

        if (!should_delete) {
          return;
        }

        set_loading_status("Deleting bookmark...");
        const response = await send_message({
          type: "delete_bookmark",
          source_id,
          bookmark_id: bookmark.id
        });

        if (!response.ok) {
          set_status(response.message, true);
          return;
        }

        apply_state(response.data.state, get_selected_source_id());
        set_status("Bookmark deleted");
      });
      actions.appendChild(delete_button);
    }

    head.appendChild(main);
    head.appendChild(actions);
    item.appendChild(head);
    bookmarks_list.appendChild(item);
  }
}

function open_edit_view(source_id, bookmark_id) {
  if (!current_view_state) {
    return;
  }

  const source = get_source(current_view_state, source_id);
  const cache = get_source_cache(current_view_state, source_id);
  const bookmark = cache?.items_cache.find((entry) => entry.id === bookmark_id) ?? null;

  if (!source || !cache || !bookmark) {
    set_status("Bookmark context was not found", true);
    return;
  }

  editing_context = {
    source_id,
    bookmark_id
  };

  const target_select = document.getElementById("edit_target_source_select");
  const editable_sources = sort_sources(current_view_state.sources).filter((entry) => {
    return entry.type === "github" && entry.writable;
  });

  target_select.innerHTML = "";

  for (const editable_source of editable_sources) {
    const option = document.createElement("option");
    option.value = editable_source.source_id;
    option.textContent = get_edit_target_option_label(current_view_state, editable_source.source_id);
    option.selected = editable_source.source_id === source_id;
    target_select.appendChild(option);
  }

  render_edit_target_hint(source_id);
  document.getElementById("edit_bookmark_title").value = bookmark.title;
  document.getElementById("edit_bookmark_url").value = bookmark.url;
  document.getElementById("edit_bookmark_tag_1").value = bookmark.tags[0] || "";
  document.getElementById("edit_bookmark_tag_2").value = bookmark.tags[1] || "";
  document.getElementById("edit_bookmark_tag_3").value = bookmark.tags[2] || "";
  document.getElementById("edit_bookmark_note").value = bookmark.note || "";

  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = false;
}

function close_edit_view() {
  editing_context = null;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

function open_export_view(source_id) {
  if (!current_view_state) {
    return;
  }

  const source = get_source(current_view_state, source_id);

  if (!source || source.type !== "http_static") {
    set_status("Select an HTTP source first", true);
    return;
  }

  export_context = { source_id };
  const target_select = document.getElementById("export_target_source_select");
  const github_sources = sort_sources(current_view_state.sources).filter((entry) => {
    return entry.type === "github"
      && entry.writable
      && typeof entry.token === "string"
      && entry.token.trim().length > 0;
  });

  target_select.innerHTML = "";

  for (const github_source of github_sources) {
    const option = document.createElement("option");
    option.value = github_source.source_id;
    option.textContent = get_edit_target_option_label(current_view_state, github_source.source_id);
    target_select.appendChild(option);
  }

  document.getElementById("export_file_name").value = build_export_file_name_default(current_view_state, source_id);
  render_export_target_hint(target_select.value);
  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("export_view").hidden = false;
}

function close_export_view() {
  export_context = null;
  document.getElementById("export_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

function get_edit_tag_values() {
  return [
    document.getElementById("edit_bookmark_tag_1").value.trim(),
    document.getElementById("edit_bookmark_tag_2").value.trim(),
    document.getElementById("edit_bookmark_tag_3").value.trim()
  ].filter((tag) => tag.length > 0);
}

async function save_bookmark_edit() {
  if (!editing_context || !current_view_state) {
    set_status("Editing state was not found", true);
    return;
  }

  const next_target_source_id = document.getElementById("edit_target_source_select").value;
  const next_title = document.getElementById("edit_bookmark_title").value.trim();
  const next_url = document.getElementById("edit_bookmark_url").value.trim();
  const next_note = document.getElementById("edit_bookmark_note").value.trim();
  const next_tags = get_edit_tag_values();

  if (next_title.length === 0) {
    set_status("Title is required", true);
    return;
  }

  if (next_url.length === 0) {
    set_status("URL is required", true);
    return;
  }

  set_loading_status("Updating bookmark...");
  const response = await send_message({
    type: "save_bookmark_edit",
    source_id: editing_context.source_id,
    target_source_id: next_target_source_id,
    bookmark_id: editing_context.bookmark_id,
    updates: {
      title: next_title,
      url: next_url,
      tags: next_tags,
      note: next_note
    }
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  const current_source_id = get_selected_source_id();
  const next_selected_source_id = current_source_id === "all"
    ? "all"
    : response.data.target_source_id || current_source_id;

  close_edit_view();
  apply_state(response.data.state, next_selected_source_id);
  set_status("Bookmark updated");
}

async function edit_document_title() {
  const selected_source_id = get_selected_source_id();

  if (!selected_source_id || selected_source_id === "all") {
    set_status("Select a GitHub source first", true);
    return;
  }

  const cache = get_source_cache(current_view_state, selected_source_id);
  const current_title = cache?.source_snapshot?.document_title || "";
  const next_title = window.prompt("Document title", current_title);

  if (next_title === null) {
    return;
  }

  set_loading_status("Updating title...");
  const response = await send_message({
    type: "update_document_title",
    source_id: selected_source_id,
    title: next_title
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data.state, selected_source_id);
  set_status("Document title updated");
}

async function refresh_view() {
  cancel_sort_mode();
  set_loading_status("Loading...");
  const selected_source_id = get_selected_source_id();
  const response = await send_message({ type: "get_view_state" });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data, selected_source_id);
  set_status("State loaded");
}

function build_export_file_name_default(state, source_id) {
  const display_name = get_source_display_name(state, source_id);
  const slug = display_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "exported-bookmarks"}.json`;
}

async function export_selected_http_source() {
  if (!current_view_state || !export_context) {
    set_status("State is unavailable", true);
    return;
  }

  const source_id = export_context.source_id;
  const target_source_id = document.getElementById("export_target_source_select").value;
  const file_name = document.getElementById("export_file_name").value.trim();

  set_loading_status("Exporting to GitHub...");
  const response = await send_message({
    type: "export_http_source_to_github",
    source_id,
    target_source_id,
    file_name
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  close_export_view();
  apply_state(response.data.state, response.data.created_source_id);
  set_status("Bookmarks exported to GitHub");
}

function update_add_tab_button(state) {
  const add_tab_button = document.getElementById("add_tab_button");
  const selected_source_id = get_selected_source_id();

  if (selected_source_id === "all") {
    const has_default_github_target = state.sources.some((source) => {
      return source.type === "github"
        && source.writable
        && typeof source.token === "string"
        && source.token.trim().length > 0;
    });

    add_tab_button.disabled = !has_default_github_target;
    add_tab_button.title = has_default_github_target
      ? "Add to default GitHub source"
      : "A GitHub source with PAT is required";
    return;
  }

  const cache = get_source_cache(state, selected_source_id);
  const source = get_source(state, selected_source_id);
  const is_writable = Boolean(cache?.source_snapshot?.writable ?? source?.writable);

  add_tab_button.disabled = !is_writable;
  add_tab_button.title = is_writable ? "" : "Read-only source cannot accept local additions";
}

function apply_state(state, selected_source_id = null) {
  current_view_state = state;
  const next_selected_source_id = selected_source_id !== null && selected_source_id !== undefined
    ? selected_source_id
    : (get_selected_source_id() || "all");

  render_sources(state, next_selected_source_id);
  render_bookmarks(state);
  update_add_tab_button(state);
}

document.getElementById("refresh_button").addEventListener("click", () => {
  refresh_view().catch((error) => set_status(String(error), true));
});

document.getElementById("refresh_button").textContent = "⟳";
document.getElementById("refresh_button").title = "更新";
document.getElementById("refresh_button").setAttribute("aria-label", "更新");

document.getElementById("add_tab_button").textContent = "＋";
document.getElementById("add_tab_button").title = "Add Tab";
document.getElementById("add_tab_button").setAttribute("aria-label", "Add Tab");

document.getElementById("edit_title_button").addEventListener("click", () => {
  edit_document_title().catch((error) => set_status(String(error), true));
});

document.getElementById("back_to_list_button").addEventListener("click", () => {
  close_edit_view();
});

document.getElementById("back_from_export_button").addEventListener("click", () => {
  close_export_view();
});

document.getElementById("save_bookmark_button").addEventListener("click", () => {
  save_bookmark_edit().catch((error) => set_status(String(error), true));
});

document.getElementById("save_export_button").addEventListener("click", () => {
  export_selected_http_source().catch((error) => set_status(String(error), true));
});

document.getElementById("start_sort_button").addEventListener("click", () => {
  if (current_view_state) {
    start_sort_mode(current_view_state, get_selected_source_id());
  }
});

document.getElementById("cancel_sort_button").addEventListener("click", () => {
  cancel_sort_mode();
});

document.getElementById("save_sort_button").addEventListener("click", async () => {
  if (!current_view_state || !sort_mode_source_id) {
    return;
  }

  set_loading_status("Saving order...");
  const response = await send_message({
    type: "reorder_bookmarks",
    source_id: sort_mode_source_id,
    ordered_bookmark_ids: draft_sort_bookmark_ids
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  const selected_source_id = sort_mode_source_id;
  cancel_sort_mode();
  apply_state(response.data.state, selected_source_id);
  set_status("Bookmark order updated");
});

document.getElementById("export_button").addEventListener("click", () => {
  open_export_view(get_selected_source_id());
});

document.getElementById("edit_target_source_select").addEventListener("change", (event) => {
  render_edit_target_hint(event.target.value);
});

document.getElementById("export_target_source_select").addEventListener("change", (event) => {
  render_export_target_hint(event.target.value);
});

document.getElementById("add_tab_button").addEventListener("click", async () => {
  set_loading_status("Adding bookmark...");
  const source_id = get_selected_source_id();

  if (!source_id) {
    set_status("Select a source first", true);
    return;
  }

  const response = await send_message({
    type: "add_current_tab",
    source_id
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data.state, source_id);
  set_status(`Current tab added: ${response.data.added_item.title}`);
});

document.getElementById("source_select").addEventListener("change", () => {
  active_tag_filter = null;
  active_search_query = "";
  close_edit_view();
  close_export_view();
  cancel_sort_mode();
  document.getElementById("search_input").value = "";
  refresh_view().catch((error) => set_status(String(error), true));
});

document.getElementById("search_input").addEventListener("input", (event) => {
  active_search_query = event.target.value;

  if (current_view_state) {
    render_bookmarks(current_view_state);
  }
});

refresh_view().catch((error) => set_status(String(error), true));
