import {
    update_github_source_token
} from "./github_token_update_service.js";
import {
    register_github_source,
    register_http_source
} from "./source_registration_service.js";
import {
    create_github_file,
    create_github_template,
    sync_source
} from "./source_sync_service.js";
import { delete_github_file, delete_source } from "./source_delete_service.js";

export const SOURCE_MESSAGE_HANDLERS = {
    register_http_source: async (message) => register_http_source(message.url),
    register_github_source: async (message) => register_github_source(message),
    update_github_source_token: async (message) => update_github_source_token(message.source_id, message.token),
    sync_source: async (message) => sync_source(message.source_id),
    create_github_template: async (message) => create_github_template(message.source_id),
    create_github_file: async (message) => {
        return create_github_file(message.source_id, message.file_name, message.document_title);
    },
    delete_github_file: async (message) => delete_github_file(message.source_id, message.file_path),
    delete_source: async (message) => delete_source(message.source_id)
};
