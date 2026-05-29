# Proctoring Recorder — Design Spec

**Date:** 2026-05-29
**Status:** Approved

## Problem

The current screen recorder records continuously and optionally pauses when the user switches tabs. For a proctoring service, the requirement is the inverse: record **only** when the user leaves the application, and pause while they are on it. This minimises file size and focuses the recording on suspicious activity.

---

## Decisions

| Question | Decision |
|---|---|
| Mode vs toggle | Pure proctoring mode — no toggle, record-while-away is the only behaviour |
| "Left the app" signal | Both `document.visibilitychange` AND `window blur/focus` combined |
| Output structure | One clip per away-period; separate `MediaRecorder` per clip |
| Auto-download | Disabled during session; clips accumulate in list for manual download |
| UX language | "Start Session" / "End Session"; three visible states |

---

## State Machine

```
idle ──[Start Session]──→ monitoring
monitoring ──[user leaves]──→ recording
recording ──[user returns]──→ monitoring  (+clip saved)
monitoring ──[End Session]──→ idle
recording ──[End Session]──→ idle  (+clip saved first)
```

### State definitions

- **`idle`** — No stream, no session. "Start Session" button visible.
- **`monitoring`** — Stream acquired, user is on the app. No `MediaRecorder` running. Status: "Monitoring — recording will start when you leave."
- **`recording`** — User is away. A `MediaRecorder` is actively capturing. Status: pulsing red "Recording…"

### Transitions

- `idle → monitoring`: `startSession()` called — `getDisplayMedia` resolves successfully.
- `monitoring → recording`: user-left signal fires AND debounce elapses — new `MediaRecorder` created and started.
- `recording → monitoring`: user-returned signal fires — current `MediaRecorder` stopped, blob finalised, clip appended to list.
- `monitoring → idle`: `endSession()` called — stream tracks stopped, listeners removed.
- `recording → idle`: `endSession()` called — current `MediaRecorder` stopped, clip finalised first, then stream released.

---

## Dual-Signal Detection

Two event listeners are attached after `getDisplayMedia` resolves and removed when the session ends.

### "User left" (monitoring → recording)

Triggered when **either** condition becomes true:

- `document.visibilitychange` fires and `document.hidden === true`
- `window` emits `blur`

A **500 ms debounce** is applied. If the user returns within 500 ms (e.g., momentary Alt-Tab), the timer is cancelled and no recording starts. This prevents empty or near-empty clips from accidental brief focus losses.

### "User returned" (recording → monitoring)

Triggered when **both** conditions are true simultaneously:

- `document.hidden === false`
- `document.hasFocus() === true`

Checked on `document.visibilitychange` (hidden → visible) and `window focus` events. Both must pass before the transition fires.

---

## Architecture

### `useProctoringRecorder` (replaces `useScreenRecorder`)

Single hook owning all session and recording logic.

**Exposed interface:**

```ts
sessionState: 'idle' | 'monitoring' | 'recording'
clips: Recording[]
error: string | null
selectedQuality: number
setSelectedQuality: (index: number) => void
startSession: () => Promise<void>
endSession: () => void
removeClip: (id: string) => void
```

**Internal responsibilities:**

- Calls `getDisplayMedia` with quality constraints on `startSession`
- Attaches/detaches visibility and focus listeners for the session lifetime
- Manages the debounce timer for "user left" events
- Creates a new `MediaRecorder` on each `monitoring → recording` transition
- Finalises blobs and appends `Recording` objects on each `recording → monitoring` transition
- Discards empty blobs (size === 0) silently

### `RecordingControls` (updated)

Receives `sessionState` instead of `isRecording`. Renders:

| `sessionState` | Primary button | Status indicator |
|---|---|---|
| `idle` | "Start Session" (blue) | — |
| `monitoring` | "End Session" (grey) | Pulsing grey dot — "Monitoring" |
| `recording` | "End Session" (grey) | Pulsing red dot — "Recording" |

Quality dropdown is disabled when `sessionState !== 'idle'`.

The "Record when tab is hidden" toggle is **removed**.

### `RecordingsList` — no changes

Already renders a list of clips with video preview and per-clip download button. Works as-is.

### `App.tsx` — minor update

Switch from `useScreenRecorder` to `useProctoringRecorder`. Pass `sessionState` to `RecordingControls`.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `getDisplayMedia` throws `NotAllowedError` (permission denied) | Stay in `idle`, show "Screen share permission denied." |
| `getDisplayMedia` throws any other error | Stay in `idle`, show "Could not start screen capture. Please try again." |
| Browser "Stop sharing" button clicked mid-session | `stream.getVideoTracks()[0].onended` fires → finalise any in-progress clip → transition to `idle` |
| Visibility/focus events fire before stream is ready | Listeners attached only after `getDisplayMedia` resolves — no race condition |
| `endSession` called while in `recording` state | Clip finalised first, then stream released and state → `idle`. No data lost. |
| Debounce timer pending when session ends | Timer cancelled. No phantom `monitoring → recording` transition after session end. |
| `MediaRecorder` stopped before producing data (blob size === 0) | Clip discarded silently, not added to list. |

---

## File Changes

| File | Change |
|---|---|
| `src/hooks/useProctoringRecorder.ts` | New file — replaces `useScreenRecorder.ts` |
| `src/hooks/useScreenRecorder.ts` | Deleted |
| `src/components/RecordingControls.tsx` | Updated — new props, new labels, toggle removed |
| `src/components/RecordingsList.tsx` | No changes |
| `src/App.tsx` | Updated — use new hook, pass `sessionState` |
| `src/index.css` | Minor — add "Monitoring" indicator style (grey pulsing dot) |
