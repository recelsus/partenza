import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
    filter_bookmark_items_by_tags,
    search_bookmark_items,
} from "../shared/core/bookmark_items";
import {
    decode_text,
    encode_text,
    parse_bookmark_document,
    serialise_plain_bookmark_document,
} from "../shared/core/document";
import { plain_bookmark_document } from "../shared/types";

type sample_expectation = {
    file_name: string;
    expected_title: string;
    search_term: string;
    filter_tag: string;
};

const SAMPLE_EXPECTATIONS: sample_expectation[] = [
    {
        file_name: "github_bookmarks.json",
        expected_title: "github sample bookmarks",
        search_term: "chrome",
        filter_tag: "docs",
    },
  {
        file_name: "http_bookmarks.json",
        expected_title: "http sample bookmarks",
        search_term: "json",
        filter_tag: "web",
    },
];

function assert_plain_document(value: unknown): asserts value is plain_bookmark_document {
    if (!value || typeof value !== "object" || !("encoding" in value) || value.encoding !== "plain") {
        throw new Error("Expected a plain bookmark document");
    }
}

function load_sample_document(file_name: string): plain_bookmark_document {
    const absolute_path = join(process.cwd(), "sample", file_name);
    const json_text = readFileSync(absolute_path, "utf8");
    const parsed = parse_bookmark_document(json_text);

    assert_plain_document(parsed);

    return parsed;
}

function verify_round_trip(document: plain_bookmark_document): void {
    const serialised = serialise_plain_bookmark_document(document);
    const encoded = encode_text(serialised);
    const decoded = decode_text(encoded);
    const reparsed = parse_bookmark_document(decoded);

    assert_plain_document(reparsed);

    if (reparsed.items.length !== document.items.length) {
        throw new Error("Round trip item count does not match");
    }
}

function verify_sample(expectation: sample_expectation): string {
    const document = load_sample_document(expectation.file_name);

    if (document.title !== expectation.expected_title) {
        throw new Error(`Unexpected title in ${expectation.file_name}`);
    }

    if (document.items.length !== 2) {
        throw new Error(`Expected 2 items in ${expectation.file_name}`);
    }

    const search_results = search_bookmark_items(document.items, expectation.search_term);
    const filtered_results = filter_bookmark_items_by_tags(document.items, [expectation.filter_tag]);

    if (search_results.length === 0) {
        throw new Error(`Search result is empty for ${expectation.file_name}`);
    }

    if (filtered_results.length === 0) {
        throw new Error(`Tag filter result is empty for ${expectation.file_name}`);
    }

    verify_round_trip(document);

    return [
        `${expectation.file_name}`,
        `items=${document.items.length}`,
        `search=${search_results.length}`,
        `tag=${filtered_results.length}`,
    ].join(" ");
}

function main(): void {
    const summaries = SAMPLE_EXPECTATIONS.map(verify_sample);

    console.log("Sample verification passed");

    for (const summary of summaries) {
        console.log(summary);
    }
}

main();
