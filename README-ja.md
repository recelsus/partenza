# Partenza Bookmarks

## Overview

GitHubとHTTP上JSONをブックマークソースとして扱うChrome拡張。

GitHubリポジトリ上のみが追加, 削除, 編集可能、HTTP上のJSONは読み込み専用。
GitHub 側は `bookmarks/` ディレクトリ配下の複数JSONファイルを読み込みます。

## Bookmark Format

bookmark file は plain JSON を前提としています。

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

GitHubでは、repository root直下の `bookmarks/` を利用します。

- default file: `bookmarks/bookmarks.json`
- additional files: `bookmarks/*.json`

`bookmarks/` が存在しない場合でも、初期化時に `bookmarks/bookmarks.json` を作成。 これは既定として扱われます。

## Setup

1. [Release](https://github.com/recelsus/Partenza-Bookmarks/releases)からzipファイルを取得して展開
2. Chrome の `chrome://extensions/` で `Load unpacked`

## Usage

### Register GitHub Source

1. Options を開く
2. `GitHub` source を登録
3. PAT を設定

GitHubの編集操作にはPATが必要。

- fine-grained PAT
- target repository only
- `Contents: Read and write`

### Register HTTP Static Source

1. Options を開く
2. HTTP URL を登録

HTTP上のJSONはread-only。

### Create New GitHub File

`Registered Sources` の GitHub repository 行から `New File` を押すと、
`bookmarks/<name>.json` を新規作成できます。

### Popup Operations

- source / file の切り替え
- bookmark list 表示
- incremental search
- tag filter
- current tab の追加
- bookmark の編集 / 削除
- GitHub file 内の並び替え

## Display Modes

Options から以下を切り替えられます。

- `Popup`
- `Side Panel`

## Themes

Options から以下を切り替えられます。

- `Auto`
- `Light`
- `Dark`

`Auto` は system theme に追従します。

## License

この repository の `LICENSE` を参照。
