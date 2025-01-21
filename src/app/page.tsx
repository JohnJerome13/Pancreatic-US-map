'use client';
import DoctorFinder from '@/app/components/DoctorFinder';
import React, { useState } from 'react';
import Papa from 'papaparse';

function FileUploader() {
	const [jsonData, setJsonData] = useState<any[]>([]);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		Papa.parse(file, {
			complete: (results) => {
				const parsedData = results.data as any[];
				setJsonData(parsedData);
				console.log('Converted JSON:', parsedData); // For testing
			},
			header: true, // Treat first row as headers
			skipEmptyLines: true,
		});
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<input
				type="file"
				accept=".csv"
				onChange={handleFileUpload}
				className="block w-full max-w-md text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100"
			/>
			{jsonData.length > 0 && (
				<div className="mt-4">
					<p className="text-green-600">
						File uploaded and converted successfully!
					</p>
				</div>
			)}
		</div>
	);
}

export default function Home() {
	return (
		<div className="grid grid-rows-[auto_1fr] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans">
			<h1 className="text-3xl font-bold text-center text-[#815FA0]">
				Let's Win Pancreatic Cancer
			</h1>
			{/* <FileUploader /> */}
			<DoctorFinder />
		</div>
	);
}
