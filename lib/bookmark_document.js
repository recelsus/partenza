export const BOOKMARK_FORMAT = "portable-bookmark-store";
export const BOOKMARK_VERSION = 1;

function is_record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function is_string_array(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function is_optional_record(value) {
  return value === undefined || is_record(value);
}

export function assert_bookmark_item(value) {
  if (!is_record(value)) {
    throw new Error("Bookmark item must be an object");
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Bookmark item id is invalid");
  }

  if (typeof value.title !== "string") {
    throw new Error("Bookmark item title is invalid");
  }

  if (typeof value.url !== "string") {
    throw new Error("Bookmark item url is invalid");
  }

  if (!is_string_array(value.tags)) {
    throw new Error("Bookmark item tags are invalid");
  }

  if (typeof value.note !== "string") {
    throw new Error("Bookmark item note is invalid");
  }

  if (typeof value.created_at !== "string") {
    throw new Error("Bookmark item created_at is invalid");
  }

  if (typeof value.updated_at !== "string") {
    throw new Error("Bookmark item updated_at is invalid");
  }

  if (!is_optional_record(value.extensions)) {
    throw new Error("Bookmark item extensions are invalid");
  }
}

export function assert_plain_bookmark_document(value) {
  if (!is_record(value)) {
    throw new Error("Bookmark document must be an object");
  }

  if (value.format !== BOOKMARK_FORMAT) {
    throw new Error("Bookmark format is invalid");
  }

  if (value.version !== BOOKMARK_VERSION) {
    throw new Error("Bookmark version is invalid");
  }

  if (value.encoding !== "plain") {
    throw new Error("Bookmark encoding is invalid for plain document");
  }

  if (typeof value.title !== "string") {
    throw new Error("Bookmark title is invalid");
  }

  if (!Array.isArray(value.items)) {
    throw new Error("Bookmark items must be an array");
  }

  for (const item of value.items) {
    assert_bookmark_item(item);
  }

  if (!is_optional_record(value.extensions)) {
    throw new Error("Bookmark document extensions are invalid");
  }
}
