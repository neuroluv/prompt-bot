import { SUPPORT_USERNAME } from 'lib/common';
import { emojis } from 'lib/utils';

export const payMessages = {
	prePay: `${emojis.premium.robot} <b>Нейролюб Клуб</b> – это закрытый клуб для тех, кто хочет погрузиться в мир нейросетей и AI на более глубоком уровне. В клубе ты найдёшь:\n\n${emojis.premium.numbers[1]} Эксклюзивные материалы и гайды по работе с нейросетями\n${emojis.premium.numbers[2]} Регулярные вебинары и мастер-классы от экспертов в области AI\n${emojis.premium.numbers[3]} Поддержку и общение с единомышленниками\n\nЕсли тебе интересно развиваться в этом направлении, присоединяйся к <b>Нейролюб Клубу</b>! Это отличный способ получить доступ к ценным ресурсам и поддержке сообщества.`,

	pay: (supportUsername: string) =>
		`<b>Оплата доступна по русским картам ${emojis.premium.card}</b>\n\n<i>Если у тебя возникнут вопросы или проблемы с оплатой, не стесняйся обращаться в нашу поддержку – <b>@${supportUsername}</b></i>}`,

	cryptoPay: (supportUsername: string) =>
		`<b>Оплата доступна через Crypto Bot ${emojis.premium.cryptoBot}</b>\n\n<i>Если у тебя возникнут вопросы или проблемы с оплатой, не стесняйся обращаться в нашу поддержку – <b>@${supportUsername}</b></i>`,

	success: `${emojis.premium.heartPixel} <b>Оплата прошла успешно!</b> Ты получил доступ к каналу.`,

	errorCreate: (error?: string) =>
		`${error ? `<blockquote><code>Сообщение ошибки: ${error}</code></blockquote>\n\n` : ''}${emojis.premium.robot} Произошла ошибка при создании платежа. За помощью обратитесь к нашей поддержке – @${SUPPORT_USERNAME}`,
};
