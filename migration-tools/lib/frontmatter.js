import matter from "gray-matter";

// Lenient fallback for files whose frontmatter is not valid YAML (e.g. unquoted
// titles containing backticks/colons — found in real ticket data). Extracts
// simple `key: value` lines; everything else is treated as body.
function lenientParse(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: content };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      // Strip matching surrounding quotes (YAML would have removed them)
      data[kv[1]] = kv[2].trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
    }
  }
  return { data, body: content.slice(m[0].length) };
}

// Parse YAML frontmatter + markdown body. Returns { data, body }.
// Falls back to lenient parsing when the frontmatter is not valid YAML.
export function parseFrontmatter(content) {
  try {
    const { data, content: body } = matter(content);
    return { data: data ?? {}, body: body ?? "" };
  } catch {
    return lenientParse(content);
  }
}
