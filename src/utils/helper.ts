export const capitalize = (word: string): string => {
  const firstLetter = word.charAt(0);
  const remainingLetters = word.slice(1);
  const firstLetterCap = firstLetter.toUpperCase();
  return firstLetterCap + remainingLetters;
};
