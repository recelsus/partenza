import {
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { parse_github_cache_id } from "../lib/github_source_unit.js";

export async function delete_source(source_id) {
  const parsed = parse_github_cache_id(source_id);
  const root_source_id = parsed ? parsed.source_id : source_id;
  const source = await source_repository.get_source(root_source_id);

  if (source?.type === "github") {
    const caches = await cache_repository.list_caches();

    for (const cache of caches) {
      if (cache.source_id === root_source_id || cache.source_id.startsWith(`${root_source_id}::`)) {
        await cache_repository.delete_cache(cache.source_id);
      }
    }
  } else {
    await cache_repository.delete_cache(root_source_id);
  }

  await source_repository.delete_source(root_source_id);
  return build_state();
}
