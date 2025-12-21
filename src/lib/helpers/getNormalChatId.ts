export const getNormalChatId = (chatId: string) => {
  if (chatId[0] === '-' || chatId[0] === '+') {
    return chatId;
  }

  if (chatId.startsWith('https://')) {
    return chatId;
  }

  return `@${chatId}`;
};
