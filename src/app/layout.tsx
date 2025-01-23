import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
	src: './fonts/GeistVF.woff',
	variable: '--font-geist-sans',
	weight: '100 900',
});
const geistMono = localFont({
	src: './fonts/GeistMonoVF.woff',
	variable: '--font-geist-mono',
	weight: '100 900',
});

export const metadata: Metadata = {
	title: "Let's Win Pancreatic Cancer",
	description: "Let's Win Pancreatic Cancer",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<div
					id="pancreatic-cancer-map"
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					{children}
				</div>
			</body>
		</html>
	);
}
