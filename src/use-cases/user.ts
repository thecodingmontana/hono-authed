export type User = {
	id: string;
	email: string;
	username: string;
	avatar: string;
	email_verified: boolean;
	registered_2fa: boolean;
	created_at: Date;
	updated_at: Date | null;
};
