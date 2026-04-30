import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { build_scoped_github_source } from "../lib/github_source_model.js";
import { source_repository } from "./context.js";

export async function find_default_github_add_target() {
    const sources = await source_repository.list_sources();
    const default_source = sources.find((source) => {
        return source.type === "github"
            && source.writable
            && Array.isArray(source.file_paths)
            && source.file_paths.includes(GITHUB_BOOKMARKS_FILE_PATH)
            && typeof source.token === "string"
            && source.token.trim().length > 0;
    });

    if (default_source) {
        return {
            source: build_scoped_github_source(default_source, GITHUB_BOOKMARKS_FILE_PATH),
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
        source: build_scoped_github_source(fallback_source, GITHUB_BOOKMARKS_FILE_PATH),
        should_register_source: true
    };
}
