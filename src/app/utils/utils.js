import { v4 as uuid } from "uuid";

export const extractLanguageKeywordAndText = (input) => {
  const regex = /^\s*```(\w*)\s*\n*([\s\S]*?)\n*\s*```/;
  const matches = input.match(regex);

  if (matches && matches.length >= 3) {
    const languageKeyword = matches[1];
    const text = matches[2];
    const blockId = uuid();
    return { languageKeyword, text, blockId };
  }

  return null;
};
