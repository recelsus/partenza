import { bookmark_id, bookmark_item } from "../types";

export type bookmark_item_input = {
    id: bookmark_id;
    title: string;
    url: string;
    tags?: string[];
    note?: string;
    created_at: string;
    updated_at: string;
};

function normalise_text(value: string): string {
    return value.trim();
}

function normalise_tags(tags: string[]): string[] {
    return Array.from(
        new Set(
            tags
                .map((tag) => normalise_text(tag))
                .filter((tag) => tag.length > 0)
                .map((tag) => tag.toLowerCase())
        )
    ).sort();
}

export function create_bookmark_item(input: bookmark_item_input): bookmark_item {
    return {
        id: input.id,
        title: normalise_text(input.title),
        url: normalise_text(input.url),
        tags: normalise_tags(input.tags ?? []),
        note: input.note ?? "",
        created_at: input.created_at,
        updated_at: input.updated_at,
    };
}

export function upsert_bookmark_item(items: bookmark_item[], next_item: bookmark_item): bookmark_item[] {
    const existing_index = items.findIndex((item) => item.id === next_item.id);

    if (existing_index === -1) {
        return [...items, next_item];
    }

    return items.map((item) => (item.id === next_item.id ? next_item : item));
}

export function delete_bookmark_item(items: bookmark_item[], target_id: bookmark_id): bookmark_item[] {
    return items.filter((item) => item.id !== target_id);
}

export function search_bookmark_items(items: bookmark_item[], query: string): bookmark_item[] {
    const search_term = normalise_text(query).toLowerCase();

    if (search_term.length === 0) {
        return items;
    }

    return items.filter((item) => {
        const haystacks = [
            item.title,
            item.url,
            item.note,
            ...item.tags,
        ];

        return haystacks.some((value) => value.toLowerCase().includes(search_term));
    });
}

export function filter_bookmark_items_by_tags(
    items: bookmark_item[],
    selected_tags: string[]
): bookmark_item[] {
    const required_tags = normalise_tags(selected_tags);

    if (required_tags.length === 0) {
        return items;
    }

    return items.filter((item) => required_tags.every((tag) => item.tags.includes(tag)));
}
