import { build_state } from "./context.js";
import {
  save_bookmark_edit,
  update_bookmark
} from "./bookmark_edit_service.js";
import { delete_bookmark } from "./bookmark_delete_service.js";
import { update_document_title } from "./document_title_service.js";
import { reorder_bookmarks } from "./reorder_service.js";
import { add_current_tab } from "./add_tab_service.js";
import { export_http_source_to_github } from "./export_service.js";
import {
  create_github_template,
  delete_source,
  register_github_source,
  register_http_source,
  sync_source
} from "./source_service.js";

export async function handle_message(message) {
  if (message.type === "ping") {
    return { ok: true, data: { pong: true } };
  }

  if (message.type === "get_view_state") {
    return { ok: true, data: await build_state() };
  }

  if (message.type === "register_http_source") {
    return { ok: true, data: await register_http_source(message.url) };
  }

  if (message.type === "register_github_source") {
    return { ok: true, data: await register_github_source(message) };
  }

  if (message.type === "sync_source") {
    return { ok: true, data: await sync_source(message.source_id) };
  }

  if (message.type === "create_github_template") {
    return { ok: true, data: await create_github_template(message.source_id) };
  }

  if (message.type === "delete_source") {
    return { ok: true, data: await delete_source(message.source_id) };
  }

  if (message.type === "add_current_tab") {
    return { ok: true, data: await add_current_tab(message.source_id) };
  }

  if (message.type === "export_http_source_to_github") {
    return {
      ok: true,
      data: await export_http_source_to_github(
        message.source_id,
        message.target_source_id,
        message.file_name
      )
    };
  }

  if (message.type === "update_bookmark") {
    return {
      ok: true,
      data: await update_bookmark(message.source_id, message.bookmark_id, message.updates)
    };
  }

  if (message.type === "save_bookmark_edit") {
    return {
      ok: true,
      data: await save_bookmark_edit(
        message.source_id,
        message.target_source_id,
        message.bookmark_id,
        message.updates
      )
    };
  }

  if (message.type === "delete_bookmark") {
    return {
      ok: true,
      data: await delete_bookmark(message.source_id, message.bookmark_id)
    };
  }

  if (message.type === "update_document_title") {
    return {
      ok: true,
      data: await update_document_title(message.source_id, message.title)
    };
  }

  if (message.type === "reorder_bookmarks") {
    return {
      ok: true,
      data: await reorder_bookmarks(message.source_id, message.ordered_bookmark_ids)
    };
  }

  return { ok: false, error_code: "unknown_message", message: "Unknown message type" };
}
