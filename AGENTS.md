# DroidLabX code-server

Fork of [coder/code-server](https://github.com/coder/code-server) that is the in-app editor for **DroidLabX** (Android host: `/Users/pablo.ciranna/development/android-developer-studio`).

The work is the VS Code workbench this server ships — portrait phone and tablet/desktop — plus stripping chrome DroidLabX does not need. Touch the Node server only when something actually needs optimizing.

## Quick path

1. Read this file, then `.cursor/rules/*.mdc`.
2. Change VS Code through **quilt patches** in `patches/`. Never edit `lib/vscode` without `quilt add`.
3. Keep desktop-only chrome out of the mobile layout. Host-app CSS injection is a stopgap, not the design.
4. Workbench actions that mean something on the phone (Exit, Back, share, files) go through the Android host bridge, not a browser-only command.

## Layout

| Path | Owns |
| --- | --- |
| `src/node/` | code-server HTTP API, CLI, proxy. Change only if the host or workbench needs it. |
| `lib/vscode/` | VS Code **submodule**. The UI we adapt. Upstream, not a second repo to commit into. |
| `patches/` | Quilt series applied onto the submodule. This is where DroidLabX workbench changes live. |
| `test/` | code-server Jest / Playwright / bats. Patch behavior needs an e2e when it is user-visible. |
| Host app | PocketIDE / DroidLabX Android shell: WebView, `AdsHost`, Ubuntu/proot. Not this repo. |

## Non-negotiables

| Topic | Decision |
| --- | --- |
| Product | Editor runtime for DroidLabX. Not a generic code-server distro. |
| Layouts | Two: portrait phone, and tablet/desktop. Design both; do not ship desktop-only chrome as the phone UI. |
| Strip | Remove or hide workbench pieces DroidLabX does not use (command center, Copilot/chat, SCM in-editor, accounts). The host already disables several via `settings.json`; prefer real workbench changes over injected CSS. |
| Server | Optimize `src/node` only with a measured reason (startup, memory, ARM, proot). UI work is the default. |
| Submodule | `lib/vscode` tracks Microsoft VS Code. Patches via `quilt`. See `docs/CONTRIBUTING.md`. |
| Host actions | Configurable map: workbench intent → Android system action. Example: Exit / Back → `AdsHost.goBack()` (activity back). Do not hardcode a single injected button as the only path. |
| Artifacts | English in code, UI strings, specs, commits. User chat may be Spanish. |

## Android host bridge

The WebView exposes `window.AdsHost` (`JavascriptInterface`). Today the host injects a back arrow and calls `AdsHost.goBack()`.

Target: this fork owns the workbench UI and emits **named intents**; the Android app maps those intents to system actions. Mapping must stay configurable in the host (and documented here when a new intent is added).

| Intent (workbench) | Typical Android action |
| --- | --- |
| `back` / Exit | Activity back (leave the editor) |
| (add rows as they ship) | Keep the table the contract |

Do not grow `WORKBENCH_JS` in the Android app. Move chrome and actions into patches in this repo.

## Checks

- [ ] VS Code edits went through quilt (`quilt add` → edit → `quilt refresh`).
- [ ] Portrait and tablet/desktop were considered; unused chrome was removed, not just hidden in the host.
- [ ] A new host intent has a name, an Android mapping, and is configurable.
- [ ] `src/node` changed only with a reason that is not "while we were in the file".
