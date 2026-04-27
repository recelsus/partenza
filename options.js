function send_message(message) {
  return chrome.runtime.sendMessage(message);
}

function reset_http_form() {
  document.getElementById("http_source_url").value = "";
}

function reset_github_form() {
  document.getElementById("github_owner").value = "";
  document.getElementById("github_repo").value = "";
  document.getElementById("github_branch").value = "";
  document.getElementById("github_token").value = "";
}

async function handle_sync_like_response(response, source_id) {
  if (!response.ok) {
    document.getElementById("state_dump").textContent = response.message;
    return false;
  }

  if (response.data.needs_template_creation) {
    const should_create = window.confirm(
      `bookmarks/ directory has no bookmark file on branch ${response.data.resolved_branch}. Create bookmarks/bookmarks.json template?`
    );

    if (!should_create) {
      await render_state();
      return false;
    }

    const create_response = await send_message({
      type: "create_github_template",
      source_id
    });

    if (!create_response.ok) {
      document.getElementById("state_dump").textContent = create_response.message;
      return false;
    }
  }

  await render_state();
  return true;
}

async function sync_source(source_id) {
  const response = await send_message({
    type: "sync_source",
    source_id
  });
  await handle_sync_like_response(response, source_id);
}

function render_sources(state) {
  const source_list = document.getElementById("source_list");

  source_list.innerHTML = "";

  if (state.sources.length === 0) {
    const empty_state = document.createElement("div");
    empty_state.className = "source-item";
    empty_state.textContent = "No registered sources.";
    source_list.appendChild(empty_state);
    return;
  }

  for (const source of state.sources) {
    const cache = state.caches.find((entry) => entry.source_id === source.source_id);
    const wrapper = document.createElement("div");
    wrapper.className = "source-item";
    const display_name = cache?.source_snapshot?.document_title || source.source_name;

    const title = document.createElement("strong");
    title.textContent = display_name;
    wrapper.appendChild(title);

    const meta = document.createElement("span");
    meta.textContent = `${cache?.source_snapshot?.source_type || source.type} / ${(cache?.source_snapshot?.writable ?? source.writable) ? "writable" : "read-only"}`;
    wrapper.appendChild(meta);

    if (cache?.source_snapshot?.source_name && cache.source_snapshot.source_name !== display_name) {
      const registered_name = document.createElement("span");
      registered_name.textContent = `registered as: ${cache.source_snapshot.source_name}`;
      wrapper.appendChild(registered_name);
    }

    if (source.type === "http_static") {
      const url = document.createElement("span");
      url.textContent = cache?.source_snapshot?.locator || source.url;
      wrapper.appendChild(url);
    }

    if (source.type === "github") {
      const repo = document.createElement("span");
      const branch_label = cache?.source_snapshot?.resolved_branch
        || (source.branch && source.branch.trim().length > 0
          ? source.branch
          : "auto: main -> master");
      repo.textContent = `${source.owner}/${source.repo} @ ${branch_label}`;
      wrapper.appendChild(repo);

      const path = document.createElement("span");
      path.textContent = cache?.source_snapshot?.locator || source.path;
      wrapper.appendChild(path);
    }

    const cache_info = document.createElement("span");
    cache_info.textContent = `items: ${cache ? cache.items_cache.length : 0} / last synced: ${cache?.last_synced_at ?? "-"}`;
    wrapper.appendChild(cache_info);

    const button_row = document.createElement("div");
    button_row.className = "row";

    if (source.type === "http_static" || source.type === "github") {
      const sync_button = document.createElement("button");
      sync_button.textContent = source.type === "http_static"
        ? "Sync HTTP"
        : "Sync GitHub";
      sync_button.addEventListener("click", async () => {
        await sync_source(source.source_id);
      });
      button_row.appendChild(sync_button);
    }

    const delete_button = document.createElement("button");
    delete_button.textContent = "Delete";
    delete_button.addEventListener("click", async () => {
      const should_delete = window.confirm(`Delete source "${display_name}" and its local cache?`);

      if (!should_delete) {
        return;
      }

      await send_message({
        type: "delete_source",
        source_id: source.source_id
      });
      await render_state();
    });
    button_row.appendChild(delete_button);

    wrapper.appendChild(button_row);
    source_list.appendChild(wrapper);
  }
}

async function render_state() {
  const response = await send_message({ type: "get_view_state" });
  const dump = document.getElementById("state_dump");

  if (!response.ok) {
    dump.textContent = response.message;
    return;
  }

  render_sources(response.data);
  dump.textContent = JSON.stringify(response.data, null, 2);
}

document.getElementById("refresh_button").addEventListener("click", () => {
  render_state().catch((error) => {
    document.getElementById("state_dump").textContent = String(error);
  });
});

document.getElementById("register_http_button").addEventListener("click", async () => {
  const url = document.getElementById("http_source_url").value;
  const response = await send_message({
    type: "register_http_source",
    url
  });
  const success = await handle_sync_like_response(response, response.ok ? response.data.synced_source_id : null);

  if (success) {
    reset_http_form();
  }
});

document.getElementById("register_github_button").addEventListener("click", async () => {
  const response = await send_message({
    type: "register_github_source",
    owner: document.getElementById("github_owner").value,
    repo: document.getElementById("github_repo").value,
    branch: document.getElementById("github_branch").value,
    token: document.getElementById("github_token").value
  });
  const success = await handle_sync_like_response(response, response.ok ? response.data.synced_source_id : null);

  if (success) {
    reset_github_form();
  }
});

render_state().catch((error) => {
  document.getElementById("state_dump").textContent = String(error);
});
