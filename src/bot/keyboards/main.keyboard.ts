import { callbackPlus, webAppPlus } from 'lib/helpers';
import { emojis } from 'lib/utils';

export const mainKeyboard = () => {
  const resultKeyboard = [
    [
      callbackPlus(`Нейролюб Клуб`, 'neuroluv_club', {
        icon_custom_emoji_id: emojis.premium.forButtons.flower,
      }),
    ],
    [
      webAppPlus(`Библиотека промптов`, 'https://app.neuroluv.ru', {
        icon_custom_emoji_id: emojis.premium.forButtons.robot,
      }),
    ],
    [
      callbackPlus(`Файлы с промптами`, 'guide_files', {
        icon_custom_emoji_id: emojis.premium.forButtons.diamond,
      }),
    ],
  ];

  return resultKeyboard;
};
