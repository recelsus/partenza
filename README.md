# Partenza Bookmarks

## Overview

A Chrome extension that uses GitHub and HTTP-hosted JSON files as bookmark sources.

Only GitHub repositories support adding, deleting, and editing bookmarks.
HTTP-hosted JSON files are read-only.
On the GitHub side, the extension reads multiple JSON files under the `bookmarks/` directory.

## Bookmark Format

Bookmark files are expected to be plain JSON.

```json
{
  "format": "portable-bookmark-store",
  "version": 1,
  "encoding": "plain",
  "title": "Example bookmarks",
  "items": [
    {
      "id": "bookmark-1",
      "title": "Example",
      "url": "https://example.com",
      "tags": ["sample"],
      "note": "",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## GitHub Layout

GitHub repositories use `bookmarks/` under the repository root.

- default file: `bookmarks/bookmarks.json`
- additional files: `bookmarks/*.json`

If `bookmarks/` does not exist, the extension creates `bookmarks/bookmarks.json` during
initialisation. This file is treated as the default file.

## Setup

1. Download and extract the zip file from
   [Release](https://github.com/recelsus/Partenza-Bookmarks/releases)
2. Open Chrome `chrome://extensions/`
3. Use `Load unpacked`

## Usage

### Register GitHub Source

1. Open Options
2. Register a `GitHub` source
3. Set a PAT

A PAT is required for GitHub write operations.

- fine-grained PAT
- target repository only
- `Contents: Read and write`

### Register HTTP Static Source

1. Open Options
2. Register an HTTP URL

HTTP-hosted JSON files are read-only.

### Create New GitHub File

From the GitHub repository row in `Registered Sources`, press `New File` to create a new
`bookmarks/<name>.json`.

### Popup Operations

- switch source / file
- show bookmark list
- incremental search
- tag filter
- add the current tab
- edit / delete bookmarks
- reorder items inside a GitHub file

## Display Modes

You can switch between the following modes from Options.

- `Popup`
- `Side Panel`

## Themes

You can switch between the following themes from Options.

- `Auto`
- `Light`
- `Dark`

`Auto` follows the system theme.

## License

See `LICENSE` in this repository.
