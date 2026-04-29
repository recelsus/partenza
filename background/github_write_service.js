import { adapters } from "./context.js";
import {
  create_plain_document,
  read_required_github_document
} from "./github_helpers.js";

export async function write_github_document_with_retry(
  source,
  title,
  items,
  revision,
  commit_message,
  rebuild_on_retry = null
) {
  try {
    const write_result = await adapters.github.write_document(
      source,
      create_plain_document(title, items),
      revision,
      commit_message
    );

    return {
      title,
      items,
      revision: write_result.revision,
      resolved_branch: write_result.resolved_branch
    };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_remote = await read_required_github_document(source, title);
    const rebuilt = rebuild_on_retry
      ? rebuild_on_retry(latest_remote)
      : {
          title: latest_remote.title,
          items: latest_remote.items
        };

    const retry_result = await adapters.github.write_document(
      source,
      create_plain_document(rebuilt.title, rebuilt.items),
      latest_remote.revision,
      commit_message
    );

    return {
      title: rebuilt.title,
      items: rebuilt.items,
      revision: retry_result.revision,
      resolved_branch: retry_result.resolved_branch
    };
  }
}
