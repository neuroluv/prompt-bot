import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiClient } from 'nalog.ru';
import type {
	CancelIncomeRequest,
	IncomeClient,
	IncomeServiceItem,
} from 'nalog.ru/dist/interfaces';

export interface ICreateIncome extends IncomeServiceItem {
	client?: IncomeClient;
}

@Injectable()
export class ReceiptService {
	api: ApiClient = new ApiClient();
	inn: string;
	constructor(private readonly config: ConfigService) {
		// this.api = new ApiClient(this.config.getOrThrow('NALOG_API_KEY'));
		this.inn = this.config.getOrThrow('NALOG_INN');
		this.init();
	}

	async init() {
		const challenge = (await this.api.createPhoneChallenge('79520788245')) as {
			challengeToken: string;
		};
		console.log(challenge.challengeToken);
	}

	async newIncome(data: ICreateIncome) {
		const income = await this.api.income.create(data);

		return income;
	}

	async cancelIncome(data: CancelIncomeRequest) {
		const canceledIncome = await this.api.income.cancel(data);
		return canceledIncome;
	}

	async getReceipt(receiptId: string) {
		const receipt = await this.api.receipt.getOne({
			inn: this.inn,
			receiptId,
		});

		return receipt;
	}

	getPrintUrl(inn: string, receiptId: string) {
		const printUrl = this.api.receipt.getPrintUrl({
			inn,
			receiptId,
		});

		return printUrl;
	}
}
