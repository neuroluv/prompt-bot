export const mapParseMode = (
  parseMode: string,
): 'HTML' | 'Markdown' | 'MarkdownV2' => {
  if (
    parseMode === 'HTML' ||
    parseMode === 'Markdown' ||
    parseMode === 'MarkdownV2'
  )
    return parseMode;

  const v = (parseMode ?? '').toLowerCase();
  if (v === 'html') return 'HTML';
  if (v === 'markdownv2') return 'MarkdownV2';
  return 'Markdown';
};
