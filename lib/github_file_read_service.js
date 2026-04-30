import { assert_plain_bookmark_document } from "./bookmark_document.js";
import {
    build_contents_url,
    decode_base64_utf8,
    get_auth_headers
} from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";
import { inspect_github_source } from "./github_directory_service.js";

function assert_file_response_ok(response) {
    if (response.ok) {
        return;
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
    }

    throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
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

        assert_file_response_ok(response);
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
