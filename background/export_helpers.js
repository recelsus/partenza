import { GITHUB_BOOKMARKS_DIRECTORY } from "../lib/github_adapter_helpers.js";

export function build_github_export_path(file_name) {
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

export function assert_writable_github_target(source) {
  if (
    !source
    || source.type !== "github"
    || !source.writable
    || typeof source.token !== "string"
    || source.token.trim().length === 0
  ) {
    throw new Error("Target source must be a writable GitHub source with PAT");
  }
}
