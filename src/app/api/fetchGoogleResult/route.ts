// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const { query } = await req.json();

	if (!query) {
		return new NextResponse('Query is required', { status: 400 });
	}

	try {
		const response = await fetch('https://google.serper.dev/search', {
			method: 'POST',
			headers: {
				'X-API-KEY': process.env.SERPER_API_KEY,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ q: query }),
		});

		if (!response.ok) {
			return new NextResponse('Network response was not ok', {
				status: response.status,
			});
		}

		const data = await response.json();
		return NextResponse.json({ link: data.organic[0]?.link });
	} catch (error) {
		console.error('Error fetching Google result:', error);
		return new NextResponse('Internal server error', { status: 500 });
	}
}
