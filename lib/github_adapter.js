import { assert_plain_bookmark_document } from "./bookmark_document.js";

export const GITHUB_BOOKMARKS_DIRECTORY = "bookmarks";
export const GITHUB_BOOKMARKS_FILE_PATH = "bookmarks/bookmarks.json";

function build_contents_url(source) {
  const path = source.path.split("/").map(encodeURIComponent).join("/");
  const ref = encodeURIComponent(source.branch);
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/contents/${path}?ref=${ref}`;
}

function get_auth_headers(source) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (typeof source.token === "string" && source.token.trim().length > 0) {
    headers.Authorization = `Bearer ${source.token.trim()}`;
  }

  return headers;
}

function build_directory_url(source, directory_path, branch) {
  const path = directory_path.split("/").map(encodeURIComponent).join("/");
  const ref = encodeURIComponent(branch);
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/contents/${path}?ref=${ref}`;
}

function build_branch_url(source, branch) {
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/branches/${encodeURIComponent(branch)}`;
}

function create_empty_template_document() {
  return {
    format: "portable-bookmark-store",
    version: 1,
    encoding: "plain",
    title: "default bookmarks",
    items: []
  };
}

function serialise_document(document) {
  return JSON.stringify(document, null, 2);
}

function encode_base64_utf8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decode_base64_utf8(text) {
  return decodeURIComponent(escape(atob(text)));
}

export class GithubAdapter {
  get_capabilities() {
    return {
      readable: true,
      writable: true,
      history: true,
      auth_required: false,
      encryption_supported: true,
      scan_supported: true
    };
  }

  async validate_source(source) {
    if (source.type !== "github") {
      throw new Error("GitHub adapter cannot validate this source type");
    }

    for (const field_name of ["source_name", "owner", "repo", "path"]) {
      if (typeof source[field_name] !== "string" || source[field_name].trim().length === 0) {
        throw new Error(`GitHub source ${field_name} is required`);
      }
    }

    if (!source.path.startsWith(`${GITHUB_BOOKMARKS_DIRECTORY}/`)) {
      throw new Error(`GitHub source path must stay inside ${GITHUB_BOOKMARKS_DIRECTORY}/`);
    }
  }

  async resolve_branch(source) {
    const requested_branch = typeof source.branch === "string" ? source.branch.trim() : "";

    if (requested_branch.length > 0) {
      const branch_response = await fetch(build_branch_url(source, requested_branch), {
        method: "GET",
        headers: get_auth_headers(source),
        cache: "no-store"
      });

      if (!branch_response.ok) {
        throw new Error(`GitHub branch was not found: ${requested_branch}`);
      }

      return requested_branch;
    }

    for (const candidate_branch of ["main", "master"]) {
      const branch_response = await fetch(build_branch_url(source, candidate_branch), {
        method: "GET",
        headers: get_auth_headers(source),
        cache: "no-store"
      });

      if (branch_response.ok) {
        return candidate_branch;
      }
    }

    throw new Error("GitHub branch was not found: main or master");
  }

  async inspect_source(source) {
    await this.validate_source(source);

    const resolved_branch = await this.resolve_branch(source);
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

    if (!directory_response.ok) {
      if (directory_response.status === 401 || directory_response.status === 403) {
        throw new Error("GitHub access was denied");
      }

      throw new Error(`GitHub directory fetch failed: ${directory_response.status} ${directory_response.statusText}`);
    }

    const entries = await directory_response.json();
    const has_bookmarks_file = Array.isArray(entries)
      && entries.some((entry) => entry && entry.type === "file" && entry.path === source.path);

    return {
      status: has_bookmarks_file ? "file_ready" : "template_available",
      resolved_branch
    };
  }

  async list_bookmark_files(source) {
    await this.validate_source(source);

    const resolved_branch = await this.resolve_branch(source);
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

    if (!directory_response.ok) {
      if (directory_response.status === 401 || directory_response.status === 403) {
        throw new Error("GitHub access was denied");
      }

      throw new Error(`GitHub directory fetch failed: ${directory_response.status} ${directory_response.statusText}`);
    }

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

  async read(source) {
    await this.validate_source(source);
    const resolved_branch = await this.resolve_branch(source);
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
        const inspection = await this.inspect_source(source);

        if (inspection.status === "template_available" || inspection.status === "directory_missing") {
          return {
            template_available: true,
            resolved_branch: inspection.resolved_branch
          };
        }

        throw new Error("GitHub file was not found");
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
      }

      throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
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

  async create_template(source) {
    await this.validate_source(source);
    const resolved_branch = await this.resolve_branch(source);
    const body = {
      message: "Create bookmark template",
      content: btoa(unescape(encodeURIComponent(JSON.stringify(create_empty_template_document(), null, 2)))),
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

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
      }

      throw new Error(`GitHub template creation failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();

    return {
      document: create_empty_template_document(),
      revision: payload?.content?.sha ?? `github-created-${Date.now()}`,
      resolved_branch
    };
  }

  async write_document(source, document, expected_revision = null, commit_message = "Update bookmarks") {
    await this.validate_source(source);
    assert_plain_bookmark_document(document);
    const resolved_branch = await this.resolve_branch(source);
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

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
      }

      throw new Error(`GitHub write failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();

    return {
      revision: payload?.content?.sha ?? `github-written-${Date.now()}`,
      resolved_branch
    };
  }
}
