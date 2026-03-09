import { SUPPORT_USERNAME } from 'lib/common';
import type { IPayment } from 'lib/types/directus';
import { beautyCurrency, emojis } from 'lib/utils';
import { ReceiptJson } from 'lknpd-nalog-api-ts';

export const payMessages = {
	prePay: `
${emojis.premium.flower} <b>Нейролюб Клуб</b> – это закрытый клуб для тех, кто интересуется нейросетями и занимается созданием промптов. В клубе ты найдешь:
	
${emojis.premium.numbers[1]} <b>Авторские промпты</b>, которых нет в открытом доступе
${emojis.premium.numbers[2]} <b>Материалы и советы</b> по работе с промптами и нейросетями
${emojis.premium.numbers[3]} <b>Поддержку и общение</b> с единомышленниками
	
Если тебе интересно развиваться в этом направлении, присоединяйся к <b>Нейролюб Клубу</b>! Это отличный способ получить доступ к ценным ресурсам и поддержке сообщества.`,

	pay: (supportUsername: string, privacyUrl: string, offerUrl: string) =>
		`
<b>Оплата доступна по русским картам ${emojis.premium.card}</b>
	
<i>Если у тебя возникнут вопросы или проблемы с оплатой, не стесняйся обращаться в нашу поддержку – <b>@${supportUsername}</b></i>

Ссылка для вступления в клуб придет <b>в течении нескольких минут</b> после оплаты.
	
Нажимая кнопку «<b>Оплатить</b>», вы подтверждаете свое согласие с условиями:
	
	${emojis.task} <a href="${offerUrl}">Оферта</a>
	${emojis.task} <a href="${privacyUrl}">Политика обработки персональных данных</a>`,

	cryptoPay: (supportUsername: string, privacyUrl: string, offerUrl: string) =>
		`
<b>Оплата доступна через Crypto Bot ${emojis.premium.cryptoBot}</b>
	
<i>Если у тебя возникнут вопросы или проблемы с оплатой, не стесняйся обращаться в нашу поддержку – <b>@${supportUsername}</b></i>

Ссылка для вступления в клуб придет <b>в течении нескольких минут</b> после оплаты.
	
Нажимая кнопку «<b>Оплатить</b>», вы подтверждаете свое согласие с условиями:
	
${emojis.task} <a href="${offerUrl}">Оферта</a>
${emojis.task} <a href="${privacyUrl}">Политика обработки персональных данных</a>`,

	success: `
${emojis.premium.heartPixel} <b>Оплата прошла успешно!</b>

Ты получил доступ к каналу! Нажимай на кнопку ниже ${emojis.premium.handDown}`,
	successWithReceipt: (supportUsername: string) => `
${emojis.premium.heartPixel} <b>Оплата прошла успешно!</b>

${emojis.task} Если нужен чек, обращаться – <b>@${supportUsername}</b>

Ты получил доступ к каналу! Нажимай на кнопку ниже ${emojis.premium.handDown}`,
	receipt: (receipt: ReceiptJson) => `
${emojis.task} <b>Ваш чек об оплате</b>
<b>Сумма платежа:</b> ${receipt.totalAmount} ${beautyCurrency('RUB', false)}
<b>ID транзакции:</b> ${receipt.receiptId}
<b>Дата платежа:</b> ${new Date(receipt.operationTime).toLocaleString('ru')}`,

	errorCreate: (error?: string) =>
		`${error ? `<blockquote><code>Сообщение ошибки: ${error}</code></blockquote>\n\n` : ''}${emojis.premium.robot} Произошла ошибка при создании платежа. За помощью обратитесь к нашей поддержке – @${SUPPORT_USERNAME}`,

	sendAdminSuccess: (payment: IPayment) => {
		return `
<b>${emojis.checkmark} Оплата №${payment.id} прошла успешно!</b>

${emojis.premium.card} <b>Сумма:</b> ${payment.amount} ${payment.currency} – ${payment.provider}
    `;
	},
};
