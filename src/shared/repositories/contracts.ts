import { bookmark_source, source_cache, source_id } from "../types";

export type sync_settings = {
    sync_on_popup_open: boolean;
    sync_on_browser_start: boolean;
    auto_sync_enabled: boolean;
    auto_sync_interval_minutes: number;
};

export interface source_repository {
    list_sources(): Promise<bookmark_source[]>;
    get_source(source_id: source_id): Promise<bookmark_source | null>;
    save_source(source: bookmark_source): Promise<void>;
    delete_source(source_id: source_id): Promise<void>;
}

export interface source_cache_repository {
    list_caches(): Promise<source_cache[]>;
    get_cache(source_id: source_id): Promise<source_cache | null>;
    save_cache(cache: source_cache): Promise<void>;
    delete_cache(source_id: source_id): Promise<void>;
}

export interface sync_settings_repository {
    get_settings(): Promise<sync_settings>;
    save_settings(settings: sync_settings): Promise<void>;
}

export const DEFAULT_SYNC_SETTINGS: sync_settings = {
    sync_on_popup_open: false,
    sync_on_browser_start: false,
    auto_sync_enabled: false,
    auto_sync_interval_minutes: 360,
};
