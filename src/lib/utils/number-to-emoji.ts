export function numberToEmoji(number: number): string {
  const emojis = {
    '0': '0️⃣',
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣',
  };
  return number
    .toString()
    .split('')
    .map((el) => emojis[el])
    .join('');
}
