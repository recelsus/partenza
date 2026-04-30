export type source_type = "github" | "http_static";

export type source_id = string;
export type bookmark_id = string;
export type iso_datetime = string;
export type sync_status = "idle" | "syncing" | "success" | "error" | "conflict";

export type storage_capabilities = {
    readable: boolean;
    writable: boolean;
    history: boolean;
    auth_required: boolean;
    encryption_supported: boolean;
    scan_supported: boolean;
};

export type base_source = {
    source_id: source_id;
    source_name: string;
    type: source_type;
    enabled: boolean;
    readable?: boolean;
    writable: boolean;
    visibility?: "public" | "private" | "unknown";
};

export type github_source = base_source & {
    type: "github";
    owner: string;
    repo: string;
    branch: string;
    directory?: string;
    path: string;
    encrypted_expected?: boolean;
};

export type http_static_source = base_source & {
    type: "http_static";
    url: string;
};

export type bookmark_source = github_source | http_static_source;

export type bookmark_item = {
    id: bookmark_id;
    title: string;
    url: string;
    tags: string[];
    note: string;
    created_at: iso_datetime;
    updated_at: iso_datetime;
    extensions?: Record<string, unknown>;
};

export type plain_bookmark_document = {
    format: "portable-bookmark-store";
    version: 1;
    encoding: "plain";
    title: string;
    items: bookmark_item[];
    extensions?: Record<string, unknown>;
};

export type encrypted_bookmark_document = {
    format: "portable-bookmark-store";
    version: 1;
    encoding: "encrypted";
    crypto: {
        algorithm: "AES-GCM";
        kdf: "PBKDF2";
        kdf_iterations: number;
        hash: "SHA-256";
        salt: string;
        iv: string;
    };
    payload: string;
    extensions?: Record<string, unknown>;
};

export type bookmark_document = plain_bookmark_document | encrypted_bookmark_document;

export type source_cache_snapshot = {
    source_name: string;
    source_type: source_type;
    readable?: boolean;
    writable: boolean;
    visibility?: "public" | "private" | "unknown" | null;
    locator: string;
    document_title: string | null;
    resolved_branch?: string | null;
};

export type source_cache = {
    source_id: source_id;
    last_synced_at: iso_datetime | null;
    last_remote_revision: string | null;
    dirty: boolean;
    items_cache: bookmark_item[];
    last_error: string | null;
    source_snapshot: source_cache_snapshot;
};

export type read_result = {
    data: Uint8Array;
    revision: string | null;
};

export type write_result = {
    revision: string | null;
};

export type bookmark_file_candidate = {
    name: string;
    path: string;
    guessed_encoding: "plain" | "encrypted" | "unknown";
};

export interface bookmark_storage_adapter {
    get_capabilities(): storage_capabilities;
    validate_source(source: bookmark_source): Promise<void>;
    read(source: bookmark_source): Promise<read_result>;
    write?(
        source: bookmark_source,
        data: Uint8Array,
        expected_revision?: string | null
    ): Promise<write_result>;
    get_revision?(source: bookmark_source): Promise<string | null>;
    list_files?(source: bookmark_source): Promise<bookmark_file_candidate[]>;
}

export type request_message =
    | { type: "get_view_state" }
    | { type: "sync_source"; source_id: source_id }
    | { type: "sync_all_sources" }
    | { type: "save_source"; source: bookmark_source }
    | { type: "delete_source"; source_id: source_id }
    | { type: "save_bookmark"; source_id: source_id; item: bookmark_item }
    | { type: "delete_bookmark"; source_id: source_id; bookmark_id: bookmark_id }
    | { type: "add_current_tab"; source_id: source_id };

export type response_message =
    | { ok: true; data: unknown }
    | { ok: false; error_code: string; message: string };
