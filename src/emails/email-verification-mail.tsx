import {
	Body,
	Container,
	Font,
	Head,
	Hr,
	Html,
	Tailwind,
	Text,
} from "@react-email/components";
import type React from "react";

type EmailVerificationMailTemplateProps = {
	code: string;
	userName?: string;
	companyName?: string;
	expirationMinutes?: number;
	expiryTimestamp?: Date;
};

export const EmailVerificationMailTemplate: React.FC<
	Readonly<EmailVerificationMailTemplateProps>
> = ({
	code,
	companyName = "Hono",
	expirationMinutes = 10,
	expiryTimestamp,
}) => {
	const getRemainingTime = () => {
		if (!expiryTimestamp) {
			return `${expirationMinutes} minutes`;
		}

		const now = new Date();
		const remaining = Math.max(
			0,
			Math.floor((expiryTimestamp.getTime() - now.getTime()) / 1000)
		);

		if (remaining > 60) {
			return `${Math.floor(remaining / 60)} minutes`;
		}
		return `${remaining} seconds`;
	};

	return (
		<Html>
			<Head>
				<Font
					fallbackFontFamily="Verdana"
					fontFamily="Roboto"
					fontStyle="normal"
					fontWeight={400}
					webFont={{
						url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
						format: "woff2",
					}}
				/>
			</Head>
			<Tailwind>
				<Body className="bg-slate-50 font-sans">
					<Container className="mx-auto mb-16 max-w-[650px] rounded-lg border border-slate-200 bg-white py-5 pb-12">
						<Text className="mb-4 px-6 text-base text-slate-600 leading-relaxed">
							Hi 👋,
						</Text>

						<Text className="mb-4 px-6 text-base text-slate-600 leading-relaxed">
							Please use the verification code below:
						</Text>
						<Text className="m-0 border-2 border-slate-300 border-dashed bg-slate-50 p-5 text-center font-bold font-mono text-2xl text-slate-800 tracking-wide">
							{code}
						</Text>

						<Text className="mb-4 px-6 text-base text-slate-600 leading-relaxed">
							This code will expire in {getRemainingTime()} for security
							purposes.
						</Text>

						<Text className="mb-4 px-6 text-base text-slate-600 leading-relaxed">
							If you didn't request this verification code, please ignore this
							email or contact our support team if you have concerns.
						</Text>

						<Hr className="mx-3 my-8 border-slate-200" />

						<Text className="mb-4 px-6 text-base text-slate-600 leading-relaxed">
							Best regards,
							<br />
							The {companyName} Team
						</Text>

						<Text className="m-0 text-pretty px-6 text-center text-slate-400 text-xs italic leading-relaxed">
							This is an automated message. Please do not reply to this email.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
