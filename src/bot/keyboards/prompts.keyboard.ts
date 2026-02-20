import { callbackPlus, urlPlus } from 'lib/helpers';
import { ILabelValue } from 'lib/types';
import { emojis } from 'lib/utils';

export const promptKeyboard = (channel: ILabelValue) => {
  const resultKeyboard = [
    [
      callbackPlus(`Нейролюб Клуб`, 'neuroluv_club', {
        icon_custom_emoji_id: emojis.premium.forButtons.flower,
      }),
    ],
    [
      urlPlus(channel.label, `https://t.me/${channel.value}`, {
        icon_custom_emoji_id: emojis.premium.forButtons.robot,
      }),
      callbackPlus(`50 промптов`, 'download-file-prompts50', {
        icon_custom_emoji_id: emojis.premium.forButtons.robot,
      }),
    ],
    [
      callbackPlus(`100+ промптов`, 'download-file-prompts100', {
        icon_custom_emoji_id: emojis.premium.forButtons.diamond,
      }),
      callbackPlus(`107 промптов для фото`, 'download-file-prompts107', {
        icon_custom_emoji_id: emojis.premium.forButtons.gift,
      }),
    ],
    [
      callbackPlus(
        `Как создать свою AI модель`,
        'download-file-ai_model_guide',
        {
          icon_custom_emoji_id: emojis.premium.forButtons.lightning,
        },
      ),
    ],
  ];

  return resultKeyboard;
};
