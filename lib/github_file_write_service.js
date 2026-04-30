import { assert_plain_bookmark_document } from "./bookmark_document.js";
import {
    build_contents_url,
    create_empty_template_document,
    encode_base64_utf8,
    get_auth_headers,
    serialise_document
} from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";

function assert_write_response_ok(response, action_label) {
    if (response.ok) {
        return;
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
    }

    throw new Error(`GitHub ${action_label} failed: ${response.status} ${response.statusText}`);
}

export async function create_github_template(source) {
    const resolved_branch = await resolve_github_branch(source);
    const empty_document = create_empty_template_document();
    const body = {
        message: "Create bookmark template",
        content: encode_base64_utf8(JSON.stringify(empty_document, null, 2)),
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

    assert_write_response_ok(response, "template creation");

    const payload = await response.json();

    return {
        document: empty_document,
        revision: payload?.content?.sha ?? `github-created-${Date.now()}`,
        resolved_branch
    };
}

export async function write_github_document(
    source,
    document,
    expected_revision = null,
    commit_message = "Update bookmarks"
) {
    assert_plain_bookmark_document(document);
    const resolved_branch = await resolve_github_branch(source);
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

    assert_write_response_ok(response, "write");

    const payload = await response.json();

    return {
        revision: payload?.content?.sha ?? `github-written-${Date.now()}`,
        resolved_branch
    };
}
