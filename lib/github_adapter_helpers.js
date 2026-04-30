export const GITHUB_BOOKMARKS_DIRECTORY = "bookmarks";
export const GITHUB_BOOKMARKS_FILE_PATH = "bookmarks/bookmarks.json";

export function build_contents_url(source) {
  const path = source.path.split("/").map(encodeURIComponent).join("/");
  const ref = encodeURIComponent(source.branch);
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/contents/${path}?ref=${ref}`;
}

export function build_repo_url(source) {
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}`;
}

export function get_auth_headers(source) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (typeof source.token === "string" && source.token.trim().length > 0) {
    headers.Authorization = `Bearer ${source.token.trim()}`;
  }

  return headers;
}

export function build_directory_url(source, directory_path, branch) {
  const path = directory_path.split("/").map(encodeURIComponent).join("/");
  const ref = encodeURIComponent(branch);
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/contents/${path}?ref=${ref}`;
}

export function build_branch_url(source, branch) {
  return `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/branches/${encodeURIComponent(branch)}`;
}

export function create_empty_template_document() {
  return {
    format: "portable-bookmark-store",
    version: 1,
    encoding: "plain",
    title: "default bookmarks",
    items: []
  };
}

export function serialise_document(document) {
  return JSON.stringify(document, null, 2);
}

export function encode_base64_utf8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function decode_base64_utf8(text) {
  return decodeURIComponent(escape(atob(text)));
}
