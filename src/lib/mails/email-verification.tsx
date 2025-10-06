import { EmailVerificationMailTemplate } from "../../emails/email-verification-mail";
import { resend } from "./resend";

type Props = {
	email: string;
	subject: string;
	code: string;
	expiryTimestamp: Date;
};

export const sendEmailVerificationMail = async ({
	email,
	subject,
	code,
	expiryTimestamp,
}: Props) => {
	try {
		const result = await resend.emails.send({
			from: "Team GoodsnCart <noreply@thecodingmontana.com>",
			to: [email],
			subject,
			react: (
				<EmailVerificationMailTemplate
					code={code}
					expiryTimestamp={expiryTimestamp}
				/>
			),
		});
		return result;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to send email: ${error.message}`);
		}
		throw new Error("Failed to send email");
	}
};
