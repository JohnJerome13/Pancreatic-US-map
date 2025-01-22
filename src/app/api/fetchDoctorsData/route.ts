// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		// Fetch the doctorsData from the external URL
		const response = await fetch(
			'https://docnexus-assets.s3.us-east-1.amazonaws.com/files/pancreatic-map-data-1.json'
		);

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const doctorsData = await response.json();
		return NextResponse.json(doctorsData);
	} catch (error) {
		console.error('Error fetching doctors data:', error);
		return new NextResponse('Internal server error', { status: 500 });
	}
}
