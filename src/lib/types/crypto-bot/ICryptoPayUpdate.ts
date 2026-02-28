export interface ICryptoPayUpdate {
	update_id: number;
	update_type: string;
	request_date: string;
	payload: ICryptoPayInvoice;
}

export interface ICryptoPayInvoice {
	invoice_id: number | string;
	status: string;
	amount?: string | number;
	asset?: string;
	fiat?: string;
	pay_url?: string;
	bot_invoice_url?: string;
	payload?: string | Record<string, unknown>;
	paid_at?: string;
}
