import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';
import { goToHomeKeyboard } from './go-to-home.keyboard';

export const appKeyboard = () => {
  return [
    [
      Markup.button.webApp(
        `${emojis.robot} Нейролюб`,
        'https://app.neuroluv.ru',
      ),
    ],
    ...goToHomeKeyboard(),
  ];
};
