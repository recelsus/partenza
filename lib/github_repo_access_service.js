import { build_repo_url, get_auth_headers } from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";

function assert_repo_response_ok(response) {
    if (response.ok) {
        return;
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub access was denied");
    }

    if (response.status === 404) {
        throw new Error("GitHub repository was not found");
    }

    throw new Error(`GitHub repository fetch failed: ${response.status} ${response.statusText}`);
}

export async function probe_github_repo_access(source) {
    const resolved_branch = await resolve_github_branch(source);
    const response = await fetch(build_repo_url(source), {
        method: "GET",
        headers: get_auth_headers(source),
        cache: "no-store"
    });

    assert_repo_response_ok(response);

    const payload = await response.json();
    const permissions = payload && typeof payload.permissions === "object" ? payload.permissions : null;

    return {
        readable: true,
        writable: Boolean(permissions && permissions.push === true),
        visibility: payload?.private ? "private" : "public",
        resolved_branch
    };
}
