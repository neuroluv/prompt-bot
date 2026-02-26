import { callbackPlus, urlPlus } from 'lib/helpers';
import { ILabelValue } from 'lib/types';
import { emojis } from 'lib/utils';
import { goToHomeKeyboard } from './go-to-home.keyboard';

export const guideFilesKeyboard = (channel: ILabelValue) => {
  const resultKeyboard = [
    [
      urlPlus(channel.label, `https://t.me/${channel.value}`, {
        icon_custom_emoji_id: emojis.premium.forButtons.robot,
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
    ...goToHomeKeyboard(),
  ];

  return resultKeyboard;
};
