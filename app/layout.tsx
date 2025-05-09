import { Poppins } from 'next/font/google';
import './global.css';

const poppins = Poppins({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
	display: 'swap',
});

export const metadata = {
	title: 'Zenith Eclipse CO',
	description: 'Chat with us live or make a free call directly from your browser—available 24/7 for your convenience',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={poppins.className}
		>
			<head>
				<link rel="icon" href="/images/Zenith-Eclipse-Logo.webp" />
			</head>
			<body>{children}</body>
		</html>
	);
}
