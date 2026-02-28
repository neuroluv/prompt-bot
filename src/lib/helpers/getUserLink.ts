export const getUserLink = (id: number, username?: string) => {
	if (username) {
		return `@${username}`;
	}

	return `tg://user?id=${id}`;
};
