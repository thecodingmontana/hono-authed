export type UserId = string;

export type Session = {
	id: string;
	expires_at: Date;
	user_id: string;
};

export type SessionMetadata = {
	location: string;
	browser: string;
	device: string;
	os: string;
	ipAddress: string;
};

export type IpApiResponse = {
	status: string;
	city?: string;
	country?: string;
};

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

export type OauthProvider = "google" | "github";

export type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
};
