import { assert_plain_bookmark_document } from "./bookmark_document.js";

function validate_http_url(url) {
  let parsed_url;

  try {
    parsed_url = new URL(url);
  } catch (_error) {
    throw new Error("URL is invalid");
  }

  if (parsed_url.protocol !== "http:" && parsed_url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
}

export class HttpStaticAdapter {
  get_capabilities() {
    return {
      readable: true,
      writable: false,
      history: false,
      auth_required: false,
      encryption_supported: false,
      scan_supported: false
    };
  }

  async validate_source(source) {
    if (source.type !== "http_static") {
      throw new Error("HTTP static adapter cannot validate this source type");
    }

    if (typeof source.source_name !== "string" || source.source_name.trim().length === 0) {
      throw new Error("Source name is required");
    }

    if (typeof source.url !== "string" || source.url.trim().length === 0) {
      throw new Error("Source URL is required");
    }

    validate_http_url(source.url);
  }

  async read(source) {
    await this.validate_source(source);

    const response = await fetch(source.url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP fetch failed: ${response.status} ${response.statusText}`);
    }

    const document = await response.json();
    assert_plain_bookmark_document(document);

    return {
      document,
      revision: response.headers.get("etag")
        || response.headers.get("last-modified")
        || `http-fetched-${Date.now()}`
    };
  }
}
