import {
  build_branch_url,
  get_auth_headers
} from "./github_adapter_helpers.js";

export async function resolve_github_branch(source) {
  const requested_branch = typeof source.branch === "string" ? source.branch.trim() : "";

  if (requested_branch.length > 0) {
    const branch_response = await fetch(build_branch_url(source, requested_branch), {
      method: "GET",
      headers: get_auth_headers(source),
      cache: "no-store"
    });

    if (!branch_response.ok) {
      throw new Error(`GitHub branch was not found: ${requested_branch}`);
    }

    return requested_branch;
  }

  for (const candidate_branch of ["main", "master"]) {
    const branch_response = await fetch(build_branch_url(source, candidate_branch), {
      method: "GET",
      headers: get_auth_headers(source),
      cache: "no-store"
    });

    if (branch_response.ok) {
      return candidate_branch;
    }
  }

  throw new Error("GitHub branch was not found: main or master");
}
