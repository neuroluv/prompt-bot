export const isBlockedError = (e: any) => {
	const code = e?.response?.error_code;
	const desc = (e?.response?.description ?? e?.message ?? '').toLowerCase();

	return (
		(code === 403 && desc.includes('blocked by the user')) ||
		(code === 403 && desc.includes('user is deactivated')) ||
		(code === 400 && desc.includes('chat not found'))
	);
};
