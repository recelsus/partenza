export class ChromeStorageArrayRepository {
    constructor(storage_key, id_selector) {
        this.storage_key = storage_key;
        this.id_selector = id_selector;
    }

    async list_items() {
        const result = await chrome.storage.local.get(this.storage_key);
        return result[this.storage_key] ?? [];
    }

    async get_item(item_id) {
        const items = await this.list_items();
        return items.find((item) => this.id_selector(item) === item_id) ?? null;
    }

    async save_item(next_item) {
        const items = await this.list_items();
        const next_id = this.id_selector(next_item);
        const existing_index = items.findIndex((item) => this.id_selector(item) === next_id);
        const next_items = existing_index === -1
            ? [...items, next_item]
            : items.map((item) => (this.id_selector(item) === next_id ? next_item : item));

        await chrome.storage.local.set({
            [this.storage_key]: next_items
        });
    }

    async delete_item(item_id) {
        const items = await this.list_items();
        await chrome.storage.local.set({
            [this.storage_key]: items.filter((item) => this.id_selector(item) !== item_id)
        });
    }
}
