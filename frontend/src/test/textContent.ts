import type { MatcherFunction } from '@testing-library/react';

/**
 * Matches the innermost element whose full text equals (or matches) `expected`,
 * even when the text is split across child elements such as formula tokens.
 */
export function hasTextContent(expected: string | RegExp): MatcherFunction {
  const matches = (text: string | null): boolean => {
    if (text === null) return false;
    return typeof expected === 'string' ? text === expected : expected.test(text);
  };
  return (_content, element) =>
    element !== null &&
    matches(element.textContent) &&
    [...element.children].every((child) => !matches(child.textContent));
}
