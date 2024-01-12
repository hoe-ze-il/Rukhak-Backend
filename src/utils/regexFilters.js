export function createRegexFilters(queryStr, field) {
  const searchTerms = queryStr.split(/\s+/).filter(Boolean);
  const regexPatterns = searchTerms.map((term) => new RegExp(term, "i"));
  const regexFilters = regexPatterns.map((pattern) => ({
    [field]: { $regex: pattern },
  }));
  return regexFilters;
}
