import {
    bookmark_document,
    bookmark_item,
    encrypted_bookmark_document,
    plain_bookmark_document,
} from "../types";

export const BOOKMARK_FORMAT = "portable-bookmark-store";
export const BOOKMARK_VERSION = 1;

export type bookmark_encoding = "plain" | "encrypted";

export type bookmark_schema_key = `${typeof BOOKMARK_FORMAT}:v${typeof BOOKMARK_VERSION}:${bookmark_encoding}`;

export type bookmark_schema_descriptor = {
    schema_key: bookmark_schema_key;
    format: typeof BOOKMARK_FORMAT;
    version: typeof BOOKMARK_VERSION;
    encoding: bookmark_encoding;
    schema_file: string;
};

const SCHEMA_REGISTRY: Record<bookmark_schema_key, bookmark_schema_descriptor> = {
    "portable-bookmark-store:v1:plain": {
        schema_key: "portable-bookmark-store:v1:plain",
        format: BOOKMARK_FORMAT,
        version: BOOKMARK_VERSION,
        encoding: "plain",
        schema_file: "schemas/portable_bookmark_store_plain_v1.schema.json",
    },
    "portable-bookmark-store:v1:encrypted": {
        schema_key: "portable-bookmark-store:v1:encrypted",
        format: BOOKMARK_FORMAT,
        version: BOOKMARK_VERSION,
        encoding: "encrypted",
        schema_file: "schemas/portable_bookmark_store_encrypted_v1.schema.json",
    },
};

function is_record(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function is_string_array(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function is_optional_record(value: unknown): boolean {
    return value === undefined || is_record(value);
}

function assert_bookmark_item(value: unknown): asserts value is bookmark_item {
    if (!is_record(value)) {
        throw new Error("Bookmark item must be an object");
    }

    if (typeof value.id !== "string" || value.id.length === 0) {
        throw new Error("Bookmark item id is invalid");
    }

    if (typeof value.title !== "string") {
        throw new Error("Bookmark item title is invalid");
    }

    if (typeof value.url !== "string") {
        throw new Error("Bookmark item url is invalid");
    }

    if (!is_string_array(value.tags)) {
        throw new Error("Bookmark item tags are invalid");
    }

    if (typeof value.note !== "string") {
        throw new Error("Bookmark item note is invalid");
    }

    if (typeof value.created_at !== "string") {
        throw new Error("Bookmark item created_at is invalid");
    }

    if (typeof value.updated_at !== "string") {
        throw new Error("Bookmark item updated_at is invalid");
    }

    if (!is_optional_record(value.extensions)) {
        throw new Error("Bookmark item extensions are invalid");
    }
}

export function assert_plain_bookmark_document(value: unknown): asserts value is plain_bookmark_document {
    if (!is_record(value)) {
        throw new Error("Bookmark document must be an object");
    }

    if (value.format !== BOOKMARK_FORMAT) {
        throw new Error("Bookmark format is invalid");
    }

    if (value.version !== BOOKMARK_VERSION) {
        throw new Error("Bookmark version is invalid");
    }

    if (value.encoding !== "plain") {
        throw new Error("Bookmark encoding is invalid for plain document");
    }

    if (typeof value.title !== "string") {
        throw new Error("Bookmark title is invalid");
    }

    if (!Array.isArray(value.items)) {
        throw new Error("Bookmark items must be an array");
    }

    for (const item of value.items) {
        assert_bookmark_item(item);
    }

    if (!is_optional_record(value.extensions)) {
        throw new Error("Bookmark document extensions are invalid");
    }
}

export function assert_encrypted_bookmark_document(
    value: unknown
): asserts value is encrypted_bookmark_document {
    if (!is_record(value)) {
        throw new Error("Bookmark document must be an object");
    }

    if (value.format !== BOOKMARK_FORMAT) {
        throw new Error("Bookmark format is invalid");
    }

    if (value.version !== BOOKMARK_VERSION) {
        throw new Error("Bookmark version is invalid");
    }

    if (value.encoding !== "encrypted") {
        throw new Error("Bookmark encoding is invalid for encrypted document");
    }

    if (!is_record(value.crypto)) {
        throw new Error("Bookmark crypto metadata is invalid");
    }

    if (value.crypto.algorithm !== "AES-GCM") {
        throw new Error("Bookmark crypto algorithm is invalid");
    }

    if (value.crypto.kdf !== "PBKDF2") {
        throw new Error("Bookmark crypto kdf is invalid");
    }

    if (typeof value.crypto.kdf_iterations !== "number") {
        throw new Error("Bookmark crypto kdf_iterations is invalid");
    }

    if (value.crypto.hash !== "SHA-256") {
        throw new Error("Bookmark crypto hash is invalid");
    }

    if (typeof value.crypto.salt !== "string") {
        throw new Error("Bookmark crypto salt is invalid");
    }

    if (typeof value.crypto.iv !== "string") {
        throw new Error("Bookmark crypto iv is invalid");
    }

    if (typeof value.payload !== "string") {
        throw new Error("Bookmark encrypted payload is invalid");
    }

    if (!is_optional_record(value.extensions)) {
        throw new Error("Bookmark document extensions are invalid");
    }
}

export function get_bookmark_schema_descriptor(
    version: number,
    encoding: bookmark_encoding
): bookmark_schema_descriptor {
    const schema_key = `${BOOKMARK_FORMAT}:v${version}:${encoding}` as bookmark_schema_key;
    const schema_descriptor = SCHEMA_REGISTRY[schema_key];

    if (!schema_descriptor) {
        throw new Error(`Unsupported bookmark schema: version=${version} encoding=${encoding}`);
    }

    return schema_descriptor;
}

export function list_supported_bookmark_schemas(): bookmark_schema_descriptor[] {
    return Object.values(SCHEMA_REGISTRY);
}

export function parse_bookmark_document(json_text: string): bookmark_document {
    const parsed: unknown = JSON.parse(json_text);

    if (!is_record(parsed)) {
        throw new Error("Bookmark document must be a JSON object");
    }

    if (parsed.format !== BOOKMARK_FORMAT) {
        throw new Error("Unsupported bookmark format");
    }

    if (typeof parsed.version !== "number") {
        throw new Error("Bookmark version is missing");
    }

    if (parsed.version !== BOOKMARK_VERSION) {
        throw new Error(`Unsupported bookmark version: ${parsed.version}`);
    }

    if (parsed.encoding !== "plain" && parsed.encoding !== "encrypted") {
        throw new Error("Unsupported bookmark encoding");
    }

    get_bookmark_schema_descriptor(parsed.version, parsed.encoding);

    if (parsed.encoding === "plain") {
        assert_plain_bookmark_document(parsed);
        return parsed;
    }

    assert_encrypted_bookmark_document(parsed);
    return parsed;
}

export function serialise_plain_bookmark_document(document: plain_bookmark_document): string {
    assert_plain_bookmark_document(document);
    return JSON.stringify(document, null, 2);
}

export function create_empty_plain_bookmark_document(title: string): plain_bookmark_document {
    return {
        format: BOOKMARK_FORMAT,
        version: BOOKMARK_VERSION,
        encoding: "plain",
        title,
        items: [],
    };
}

export function encode_text(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

export function decode_text(data: Uint8Array): string {
    return new TextDecoder().decode(data);
}
