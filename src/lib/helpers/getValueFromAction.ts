import type { Context } from 'telegraf';
import type { SceneContext, WizardContext } from 'telegraf/scenes';
import type { CallbackQuery } from 'telegraf/types';

export const getValueFromAction = (
  ctx: Context | WizardContext | SceneContext,
  index = 1,
  separator = '-',
) => {
  return (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(separator)[
    index
  ];
};
