import { get_source, get_source_display_name } from "./source_resolver.js";

export function get_source_type_label(source_type) {
    if (source_type === "github") {
        return "GitHub";
    }

    if (source_type === "http_static") {
        return "HTTP";
    }

    return source_type;
}

export function get_file_label(source) {
    if (!source || typeof source.path !== "string" || source.path.length === 0) {
        return "unknown.json";
    }

    const segments = source.path.split("/");
    return segments[segments.length - 1] || source.path;
}

export function get_edit_target_option_label(state, source_id) {
    const source = get_source(state, source_id);
    const display_name = get_source_display_name(state, source_id);
    return `${get_file_label(source)} - ${display_name}`;
}

export function get_source_option_label(source, display_name) {
    return `${get_source_type_label(source.type)} - ${display_name}`;
}
