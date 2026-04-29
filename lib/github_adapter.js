import {
  GITHUB_BOOKMARKS_DIRECTORY,
} from "./github_adapter_helpers.js";
import { resolve_github_branch } from "./github_branch_service.js";
import {
  inspect_github_source,
  list_github_bookmark_files
} from "./github_directory_service.js";
import {
  create_github_template,
  read_github_document,
  write_github_document
} from "./github_file_service.js";

export class GithubAdapter {
  get_capabilities() {
    return {
      readable: true,
      writable: true,
      history: true,
      auth_required: false,
      encryption_supported: true,
      scan_supported: true
    };
  }

  async validate_source(source) {
    if (source.type !== "github") {
      throw new Error("GitHub adapter cannot validate this source type");
    }

    for (const field_name of ["source_name", "owner", "repo", "path"]) {
      if (typeof source[field_name] !== "string" || source[field_name].trim().length === 0) {
        throw new Error(`GitHub source ${field_name} is required`);
      }
    }

    if (!source.path.startsWith(`${GITHUB_BOOKMARKS_DIRECTORY}/`)) {
      throw new Error(`GitHub source path must stay inside ${GITHUB_BOOKMARKS_DIRECTORY}/`);
    }
  }

  async resolve_branch(source) {
    return resolve_github_branch(source);
  }

  async inspect_source(source) {
    await this.validate_source(source);
    return inspect_github_source(source);
  }

  async list_bookmark_files(source) {
    await this.validate_source(source);
    return list_github_bookmark_files(source);
  }

  async read(source) {
    await this.validate_source(source);
    return read_github_document(source);
  }

  async create_template(source) {
    await this.validate_source(source);
    return create_github_template(source);
  }

  async write_document(source, document, expected_revision = null, commit_message = "Update bookmarks") {
    await this.validate_source(source);
    return write_github_document(source, document, expected_revision, commit_message);
  }
}
