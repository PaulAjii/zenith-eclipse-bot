import { Poppins } from 'next/font/google';

const poppins = Poppins({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
});

import './global.css';

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
			<body>{children}</body>
		</html>
	);
}
