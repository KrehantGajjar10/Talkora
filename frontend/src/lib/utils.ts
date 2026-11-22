export { cn } from "cn";

export function parsePostTitle(rawTitle: string): { community: string; title: string } {
  if (!rawTitle) return { community: "t/talkora", title: "" };

  const match =
    rawTitle.match(/^\[t\/([a-zA-Z0-9_-]+)\]\s*(.*)$/i) ||
    rawTitle.match(/^\[([a-zA-Z0-9_-]+)\]\s*(.*)$/i);

  if (match) {
    const rawTag = match[1].toLowerCase();
    const cleanTitle = match[2].trim() || rawTitle;
    return {
      community: `t/${rawTag}`,
      title: cleanTitle,
    };
  }

  return {
    community: "t/talkora",
    title: rawTitle,
  };
}
