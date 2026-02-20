import { callbackPlus, urlPlus } from 'lib/helpers';
import { ISubscriptionPlan } from 'lib/types/directus';
import { beautyCurrency, emojis, isFiatCurrency } from 'lib/utils';

export const prePayKeyboard = () => {
  return [
    [
      callbackPlus(`Оплатить картой`, 'pay-neuroluv_club', {
        icon_custom_emoji_id: emojis.premium.forButtons.card,
      }),
    ],
    [
      callbackPlus(`Оплатить через Crypto Bot`, 'crypto_pay-neuroluv_club', {
        icon_custom_emoji_id: emojis.premium.forButtons.cryptoBot,
      }),
    ],
  ];
};

export const payKeyboard = (
  price: number,
  currency: string,
  payUrl: string,
) => {
  const isFiat = isFiatCurrency(currency);
  const btnText = `Оплатить ${price} ${beautyCurrency(currency, !!isFiat)}`;

  return [
    [
      urlPlus(btnText, payUrl, {
        icon_custom_emoji_id: isFiat
          ? emojis.premium.forButtons.card
          : beautyCurrency(currency),
      }),
    ],
  ];
};

export const afterPayKeyboard = (channelUrl: string) => {
  return [
    [
      urlPlus(`Перейти в канал`, channelUrl, {
        icon_custom_emoji_id: emojis.premium.forButtons.diamond,
        style: 'primary',
      }),
    ],
  ];
};

export const payFromSubPlansKeyboard = (plans: ISubscriptionPlan[]) => {
  if (!plans || plans.length === 0) {
    return prePayKeyboard();
  }

  const result = plans.map((plan) => {
    const isFiat = isFiatCurrency(plan.currency);
    const btnText = isFiat ? 'Оплатить картой' : 'Оплатить в Crypto Bot';

    return [
      callbackPlus(
        btnText,
        `pay-neuroluv_club-${plan.price}-${plan.currency}`,
        {
          icon_custom_emoji_id: isFiat
            ? emojis.premium.forButtons.card
            : emojis.premium.forButtons.cryptoBot,
        },
      ),
    ];
  });

  return result;
};
