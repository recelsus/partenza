import {
  build_directory_url,
  get_auth_headers,
  GITHUB_BOOKMARKS_DIRECTORY
} from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";

function assert_directory_response_ok(response) {
  if (response.ok) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("GitHub access was denied");
  }

  throw new Error(`GitHub directory fetch failed: ${response.status} ${response.statusText}`);
}

export async function inspect_github_source(source) {
  const resolved_branch = await resolve_github_branch(source);
  const directory_response = await fetch(
    build_directory_url(source, GITHUB_BOOKMARKS_DIRECTORY, resolved_branch),
    {
      method: "GET",
      headers: get_auth_headers(source),
      cache: "no-store"
    }
  );

  if (directory_response.status === 404) {
    return {
      status: "directory_missing",
      resolved_branch
    };
  }

  assert_directory_response_ok(directory_response);

  const entries = await directory_response.json();
  const has_bookmarks_file = Array.isArray(entries)
    && entries.some((entry) => entry && entry.type === "file" && entry.path === source.path);

  return {
    status: has_bookmarks_file ? "file_ready" : "template_available",
    resolved_branch
  };
}

export async function list_github_bookmark_files(source) {
  const resolved_branch = await resolve_github_branch(source);
  const directory_response = await fetch(
    build_directory_url(source, GITHUB_BOOKMARKS_DIRECTORY, resolved_branch),
    {
      method: "GET",
      headers: get_auth_headers(source),
      cache: "no-store"
    }
  );

  if (directory_response.status === 404) {
    return {
      resolved_branch,
      files: [],
      directory_missing: true
    };
  }

  assert_directory_response_ok(directory_response);

  const entries = await directory_response.json();
  const files = Array.isArray(entries)
    ? entries
        .filter((entry) => {
          return entry
            && entry.type === "file"
            && typeof entry.path === "string"
            && entry.path.startsWith(`${GITHUB_BOOKMARKS_DIRECTORY}/`)
            && entry.path.endsWith(".json")
            && !entry.path.endsWith(".enc.json");
        })
        .map((entry) => entry.path)
    : [];

  return {
    resolved_branch,
    files,
    directory_missing: false
  };
}
