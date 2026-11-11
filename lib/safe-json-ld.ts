/**
 * XSS-safe JSON-LD serialization.
 *
 * `JSON.stringify()` does NOT escape `<`, `>` or `&`, so any dynamic value
 * containing `</script>` (blog titles, review comments, ...) can break out of
 * the <script type="application/ld+json"> tag and execute arbitrary markup.
 * Escaping those characters to their \uXXXX forms keeps the JSON valid while
 * making premature script-tag termination impossible.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
