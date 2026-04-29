export const GITHUB_SOURCE_ID_SEPARATOR = "::";

export function build_github_repo_key(source) {
    if (!source || source.type !== "github") {
        return "";
    }

    return [
        source.owner || "",
        source.repo || "",
        source.branch || ""
    ].join(GITHUB_SOURCE_ID_SEPARATOR);
}

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

export function build_scoped_github_source(source, file_path) {
    return {
        ...source,
        source_id: build_github_cache_id(source.source_id, file_path),
        path: file_path
    };
}

export function is_same_github_repo_unit(left, right) {
    return build_github_repo_key(left) === build_github_repo_key(right);
}

export function group_github_sources(sources) {
    const groups = new Map();

    for (const source of sources) {
        if (source.type !== "github") {
            continue;
        }

        const group_key = build_github_repo_key(source);

        if (!groups.has(group_key)) {
            groups.set(group_key, []);
        }

        groups.get(group_key).push(source);
    }

    return groups;
}
