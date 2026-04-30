import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { create_source_id } from "../lib/storage_repositories.js";
import {
  adapters,
  build_state,
} from "./context.js";
import {
  assert_github_repo_is_unique,
  initialise_github_repo_source
} from "./github_repo_service.js";
import {
  assert_http_source_is_unique,
  build_http_source,
  initialise_http_source
} from "./http_source_service.js";
import { sync_source } from "./source_sync_service.js";

export async function register_http_source(url) {
  await assert_http_source_is_unique(url);
  const next_source = build_http_source(url);
  await initialise_http_source(next_source);
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
    token: input.token.trim(),
    file_paths: []
  };

  await adapters.github.validate_source({
    ...base_source,
    path: GITHUB_BOOKMARKS_FILE_PATH
  });

  await assert_github_repo_is_unique(base_source);

  const initialised = await initialise_github_repo_source(base_source);
  const next_source = initialised.source;

  if (initialised.needs_template_creation) {
    return sync_source(next_source.source_id);
  }

  await sync_source(next_source.source_id);

  return {
    state: await build_state(),
    synced_source_id: next_source.source_id
  };
}
