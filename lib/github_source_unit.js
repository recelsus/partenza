export const GITHUB_SOURCE_ID_SEPARATOR = "::";

export function build_github_cache_id(source_id, file_path) {
  return `${source_id}${GITHUB_SOURCE_ID_SEPARATOR}${file_path}`;
}

export function parse_github_cache_id(value) {
  if (typeof value !== "string") {
    return null;
  }

  const separator_index = value.indexOf(GITHUB_SOURCE_ID_SEPARATOR);

  if (separator_index === -1) {
    return null;
  }

  return {
    source_id: value.slice(0, separator_index),
    file_path: value.slice(separator_index + GITHUB_SOURCE_ID_SEPARATOR.length)
  };
}
