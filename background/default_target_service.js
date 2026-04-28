import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter.js";
import { create_source_id } from "../lib/storage_repositories.js";
import { source_repository } from "./context.js";

export async function find_default_add_target_source() {
  const sources = await source_repository.list_sources();
  const default_source = sources.find((source) => {
    return source.type === "github"
      && source.writable
      && source.path === GITHUB_BOOKMARKS_FILE_PATH
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  });

  if (default_source) {
    return {
      source: default_source,
      should_register_source: false
    };
  }

  const fallback_source = sources.find((source) => {
    return source.type === "github"
      && source.writable
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  });

  if (!fallback_source) {
    return null;
  }

  return {
    source: {
      ...fallback_source,
      source_id: create_source_id("github"),
      path: GITHUB_BOOKMARKS_FILE_PATH
    },
    should_register_source: true
  };
}
