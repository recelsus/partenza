import { assert_plain_bookmark_document } from "./bookmark_document.js";
import {
  build_contents_url,
  create_empty_template_document,
  decode_base64_utf8,
  encode_base64_utf8,
  get_auth_headers,
  serialise_document
} from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";
import { inspect_github_source } from "./github_directory_service.js";

function assert_file_response_ok(response, action_label) {
  if (response.ok) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("GitHub access was denied");
  }

  throw new Error(`GitHub ${action_label} failed: ${response.status} ${response.statusText}`);
}

export async function read_github_document(source) {
  const resolved_branch = await resolve_github_branch(source);
  const resolved_source = {
    ...source,
    branch: resolved_branch
  };

  const response = await fetch(build_contents_url(resolved_source), {
    method: "GET",
    headers: get_auth_headers(resolved_source),
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 404) {
      const inspection = await inspect_github_source(source);

      if (inspection.status === "template_available" || inspection.status === "directory_missing") {
        return {
          template_available: true,
          resolved_branch: inspection.resolved_branch
        };
      }

      throw new Error("GitHub file was not found");
    }

    assert_file_response_ok(response, "fetch");
  }

  const payload = await response.json();

  if (typeof payload.content !== "string") {
    throw new Error("GitHub response did not include file content");
  }

  const decoded = decode_base64_utf8(payload.content.replace(/\n/g, ""));
  const document = JSON.parse(decoded);

  assert_plain_bookmark_document(document);

  return {
    document,
    revision: typeof payload.sha === "string" ? payload.sha : `github-fetched-${Date.now()}`,
    resolved_branch
  };
}

export async function create_github_template(source) {
  const resolved_branch = await resolve_github_branch(source);
  const body = {
    message: "Create bookmark template",
    content: encode_base64_utf8(JSON.stringify(create_empty_template_document(), null, 2)),
    branch: resolved_branch
  };

  const response = await fetch(build_contents_url({
    ...source,
    branch: resolved_branch
  }), {
    method: "PUT",
    headers: {
      ...get_auth_headers(source),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  assert_file_response_ok(response, "template creation");

  const payload = await response.json();

  return {
    document: create_empty_template_document(),
    revision: payload?.content?.sha ?? `github-created-${Date.now()}`,
    resolved_branch
  };
}

export async function write_github_document(
  source,
  document,
  expected_revision = null,
  commit_message = "Update bookmarks"
) {
  assert_plain_bookmark_document(document);
  const resolved_branch = await resolve_github_branch(source);
  const body = {
    message: commit_message,
    content: encode_base64_utf8(serialise_document(document)),
    branch: resolved_branch
  };

  if (expected_revision) {
    body.sha = expected_revision;
  }

  const response = await fetch(build_contents_url({
    ...source,
    branch: resolved_branch
  }), {
    method: "PUT",
    headers: {
      ...get_auth_headers(source),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  assert_file_response_ok(response, "write");

  const payload = await response.json();

  return {
    revision: payload?.content?.sha ?? `github-written-${Date.now()}`,
    resolved_branch
  };
}
