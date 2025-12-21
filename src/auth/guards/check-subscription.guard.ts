import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ChannelService } from 'crud';
import { Context } from 'telegraf';
import { SceneContext, WizardContext } from 'telegraf/scenes';

@Injectable()
export class CheckSubscriptionGuard implements CanActivate {
  constructor(private readonly channelService: ChannelService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Получаем аргументы контекста и извлекаем первый параметр как ctx
    const [ctx]: [Context | SceneContext | WizardContext] = context.getArgs();

    if (!ctx?.from?.id) {
      return false;
    }

    const isUserSubs = await this.channelService.isUserSubs(ctx);

    return isUserSubs;
  }
}
