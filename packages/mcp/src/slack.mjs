// slack.mjs: upload a compiled MDP artifact to a Slack channel as a file.
// Zero npm deps — uses the global `fetch` (Node >=18) and node:fs. Implements
// Slack's current external-upload flow (the old `files.upload` was sunset
// 2025-11-12), three steps:
//   1. files.getUploadURLExternal  (form: filename, length) -> { upload_url, file_id }
//   2. POST the raw bytes to upload_url                       -> plain 200 (NOT a json envelope)
//   3. files.completeUploadExternal (json: files[], channel_id, initial_comment?)
//        -> finalizes AND shares the file into the channel (no chat.postMessage needed)
// Web API methods always answer HTTP 200 with an { ok, error } envelope; we never
// throw on a Slack/HTTP error — we return { ok:false, error, message } so the tool
// layer can surface it (matching mdpValidate's degrade-don't-throw discipline).
//
// Note: Slack does not render an uploaded .html inline; it appears as a file the
// recipient opens in a browser, where the full design + interactive forms work.
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const SLACK_API = "https://slack.com/api";

// POST to a Slack Web API method, return its parsed { ok, error, ... } envelope.
// `body` is a URLSearchParams (form-encoded) or a plain object (sent as JSON).
// Exposed for tests (envelope passthrough is the seam worth asserting).
export async function slackApi(method, token, body) {
  const isForm = body instanceof URLSearchParams;
  const resp = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": isForm ? "application/x-www-form-urlencoded" : "application/json; charset=utf-8",
    },
    body: isForm ? body : JSON.stringify(body),
  });
  return resp.json().catch(() => ({ ok: false, error: `non_json_response_${resp.status}` }));
}

// Upload one file to a Slack channel. Returns { ok:true, file_id, file } on
// success, or { ok:false, error, message } on any failure. Never throws.
export async function uploadFileToSlack({ token, filePath, filename, channel, initialComment, title } = {}) {
  if (!token) return { ok: false, error: "no_token", message: "A Slack bot token is required." };
  if (!channel) return { ok: false, error: "no_channel", message: "A Slack channel id is required." };

  let bytes;
  try {
    bytes = await readFile(filePath);
  } catch (err) {
    return { ok: false, error: "read_failed", message: `Could not read ${filePath}: ${err.message}` };
  }
  const name = filename || basename(filePath);

  // 1. reserve a pre-signed upload URL.
  const reserved = await slackApi(
    "files.getUploadURLExternal",
    token,
    new URLSearchParams({ filename: name, length: String(bytes.length) })
  );
  if (!reserved.ok) {
    return { ok: false, error: reserved.error || "get_upload_url_failed", message: `files.getUploadURLExternal failed: ${reserved.error}` };
  }
  const { upload_url, file_id } = reserved;

  // 2. PUT the raw bytes to the pre-signed URL. This endpoint answers with a
  // plain 200 (not a Slack envelope) — only the HTTP status is meaningful.
  let put;
  try {
    put = await fetch(upload_url, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: bytes });
  } catch (err) {
    return { ok: false, error: "upload_failed", message: `byte upload threw: ${err.message}` };
  }
  if (!put.ok) return { ok: false, error: "upload_failed", message: `byte upload returned HTTP ${put.status}` };

  // 3. finalize and share into the channel.
  const completed = await slackApi("files.completeUploadExternal", token, {
    files: [{ id: file_id, title: title || name }],
    channel_id: channel,
    ...(initialComment ? { initial_comment: initialComment } : {}),
  });
  if (!completed.ok) {
    return { ok: false, error: completed.error || "complete_upload_failed", message: `files.completeUploadExternal failed: ${completed.error}` };
  }

  const file = Array.isArray(completed.files) ? completed.files[0] : undefined;
  return { ok: true, file_id, file };
}
