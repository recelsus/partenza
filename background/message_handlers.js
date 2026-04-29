import { build_state } from "./context.js";
import { update_bookmark } from "./bookmark_update_service.js";
import { save_bookmark_edit } from "./bookmark_move_service.js";
import { delete_bookmark } from "./bookmark_delete_service.js";
import { update_document_title } from "./document_title_service.js";
import { reorder_bookmarks } from "./reorder_service.js";
import { add_current_tab } from "./add_tab_service.js";
import { export_http_source_to_github } from "./export_service.js";
import { save_ui_mode } from "./ui_mode_service.js";
import {
  register_github_source,
  register_http_source
} from "./source_registration_service.js";
import {
  create_github_template,
  sync_source
} from "./source_sync_service.js";
import { delete_source } from "./source_delete_service.js";

export const MESSAGE_HANDLERS = {
  ping: async () => ({ pong: true }),
  get_view_state: async () => build_state(),
  save_ui_mode: async (message) => save_ui_mode(message.ui_mode),
  register_http_source: async (message) => register_http_source(message.url),
  register_github_source: async (message) => register_github_source(message),
  sync_source: async (message) => sync_source(message.source_id),
  create_github_template: async (message) => create_github_template(message.source_id),
  delete_source: async (message) => delete_source(message.source_id),
  add_current_tab: async (message) => add_current_tab(message.source_id),
  export_http_source_to_github: async (message) => {
    return export_http_source_to_github(
      message.source_id,
      message.target_source_id,
      message.file_name
    );
  },
  update_bookmark: async (message) => update_bookmark(message.source_id, message.bookmark_id, message.updates),
  save_bookmark_edit: async (message) => {
    return save_bookmark_edit(
      message.source_id,
      message.target_source_id,
      message.bookmark_id,
      message.updates
    );
  },
  delete_bookmark: async (message) => delete_bookmark(message.source_id, message.bookmark_id),
  update_document_title: async (message) => update_document_title(message.source_id, message.title),
  reorder_bookmarks: async (message) => reorder_bookmarks(message.source_id, message.ordered_bookmark_ids)
};
