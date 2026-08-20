export function normalizeDescription(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|may|might|can|could|must|need|ought|used)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeJobKey(title: string, company: string, location: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
  return `${norm(title)}|${norm(company)}|${norm(location)}`;
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function generateDescriptionHash(description: string): string {
  const normalized = normalizeDescription(description);
  return simpleHash(normalized);
}
