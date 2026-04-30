export function get_source_sort_rank(source) {
    if (source.type === "github") {
        return 0;
    }

    if (source.type === "http_static") {
        return 1;
    }

    return 9;
}

export function sort_sources(sources) {
    return [...sources].sort((left, right) => {
        const rank_diff = get_source_sort_rank(left) - get_source_sort_rank(right);

        if (rank_diff !== 0) {
            return rank_diff;
        }

        return left.source_name.localeCompare(right.source_name);
    });
}
