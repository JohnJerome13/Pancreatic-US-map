// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { debounce } from 'lodash';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export const stateAbbreviations: Record<string, string> = {
	Alabama: 'AL',
	Alaska: 'AK',
	Arizona: 'AZ',
	Arkansas: 'AR',
	California: 'CA',
	Colorado: 'CO',
	Connecticut: 'CT',
	Delaware: 'DE',
	'District Of Columbia': 'DC',
	Florida: 'FL',
	Georgia: 'GA',
	Hawaii: 'HI',
	Idaho: 'ID',
	Illinois: 'IL',
	Indiana: 'IN',
	Iowa: 'IA',
	Kansas: 'KS',
	Kentucky: 'KY',
	Louisiana: 'LA',
	Maine: 'ME',
	Maryland: 'MD',
	Massachusetts: 'MA',
	Michigan: 'MI',
	Minnesota: 'MN',
	Mississippi: 'MS',
	Missouri: 'MO',
	Montana: 'MT',
	Nebraska: 'NE',
	Nevada: 'NV',
	'New Hampshire': 'NH',
	'New Jersey': 'NJ',
	'New Mexico': 'NM',
	'New York': 'NY',
	'North Carolina': 'NC',
	'North Dakota': 'ND',
	Ohio: 'OH',
	Oklahoma: 'OK',
	Oregon: 'OR',
	Pennsylvania: 'PA',
	'Rhode Island': 'RI',
	'South Carolina': 'SC',
	'South Dakota': 'SD',
	Tennessee: 'TN',
	Texas: 'TX',
	Utah: 'UT',
	Vermont: 'VT',
	Virginia: 'VA',
	Washington: 'WA',
	'West Virginia': 'WV',
	Wisconsin: 'WI',
	Wyoming: 'WY',
};

function processDoctorDataWithStateAbbreviations(
	doctorData: any[],
	stateAbbreviations: Record<string, string>
): Record<
	string,
	Array<{ name: string; specialty: string; address: string; county: string }>
> {
	// Sort the doctorData by total_pancreatic_cancer in descending order
	const sortedDoctorData = doctorData.sort((a, b) => {
		const cancerA = parseInt(a.total_pancreatic_cancer, 10) || 0;
		const cancerB = parseInt(b.total_pancreatic_cancer, 10) || 0;
		return cancerB - cancerA;
	});

	const stateAbbreviationsReverse = Object.entries(stateAbbreviations).reduce(
		(acc, [fullName, abbr]) => {
			acc[abbr.toUpperCase()] = fullName;
			return acc;
		},
		{} as Record<string, string>
	);

	return sortedDoctorData.reduce((acc, doctor) => {
		const stateUpper = doctor.state.toUpperCase();
		const fullStateName = stateAbbreviationsReverse[stateUpper] || stateUpper;

		// Capitalize the first letter of each word in the state name
		const stateKey = fullStateName
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');

		if (!acc[stateKey]) {
			acc[stateKey] = [];
		}

		acc[stateKey].push({
			npi_number: doctor.npi_number,
			name: doctor.provider_name,
			specialty: doctor.primary_hcp_segment,
			address: `${doctor.affiliated_hco}, ${doctor.city}, ${doctor.county}, ${stateUpper}, ${doctor.zip_code}`,
			county: doctor.county
				? doctor.county
						.split(' ')
						.map(
							(word) =>
								word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
						)
						.join(' ')
				: undefined,
			total_whipple_procedures: doctor.total_whipple_procedures,
			total_pancreatic_cancer: doctor.total_pancreatic_cancer,
			url: doctor.url,
		});

		return acc;
	}, {} as Record<string, Array<{ name: string; specialty: string; address: string; county: string }>>);
}

const limitStates = ['New York', 'Pennsylvania', 'Florida', 'Texas'];
// Map of FIPS codes to state names
const stateNames: { [key: string]: string } = {
	'01': 'Alabama',
	'02': 'Alaska',
	'04': 'Arizona',
	'05': 'Arkansas',
	'06': 'California',
	'08': 'Colorado',
	'09': 'Connecticut',
	'10': 'Delaware',
	'11': 'District Of Columbia',
	'12': 'Florida',
	'13': 'Georgia',
	'15': 'Hawaii',
	'16': 'Idaho',
	'17': 'Illinois',
	'18': 'Indiana',
	'19': 'Iowa',
	'20': 'Kansas',
	'21': 'Kentucky',
	'22': 'Louisiana',
	'23': 'Maine',
	'24': 'Maryland',
	'25': 'Massachusetts',
	'26': 'Michigan',
	'27': 'Minnesota',
	'28': 'Mississippi',
	'29': 'Missouri',
	'30': 'Montana',
	'31': 'Nebraska',
	'32': 'Nevada',
	'33': 'New Hampshire',
	'34': 'New Jersey',
	'35': 'New Mexico',
	'36': 'New York',
	'37': 'North Carolina',
	'38': 'North Dakota',
	'39': 'Ohio',
	'40': 'Oklahoma',
	'41': 'Oregon',
	'42': 'Pennsylvania',
	'44': 'Rhode Island',
	'45': 'South Carolina',
	'46': 'South Dakota',
	'47': 'Tennessee',
	'48': 'Texas',
	'49': 'Utah',
	'50': 'Vermont',
	'51': 'Virginia',
	'53': 'Washington',
	'54': 'West Virginia',
	'55': 'Wisconsin',
	'56': 'Wyoming',
};

type FilterContainerProps = {
	selectedState: string;
	selectedSpecialty: string;
	selectedCounty: string;
	searchQuery: string;
	onStateChange: (state: string) => void;
	onSpecialtyChange: (specialty: string) => void;
	onCountyChange: (county: string) => void;
	onSearchChange: (query: string) => void;
};
function FilterContainer({
	doctorData,
	selectedState,
	selectedSpecialty,
	selectedCounty,
	searchQuery,
	onStateChange,
	onSpecialtyChange,
	onCountyChange,
	onSearchChange,
}: FilterContainerProps) {
	const states = Object.keys(doctorData)
		.filter((state) => {
			return state.trim() !== '' && stateAbbreviations[state];
		})
		.sort();
	const specialties = [
		'Surgical Oncology',
		'Radiation Oncology',
		'Medical Oncology',
	];

	// Generate counties based on the selected state
	const counties = selectedState
		? Array.from(
				new Set(
					doctorData[selectedState]
						.map((doctor) => doctor.county)
						.filter((county) => county) // Filter out empty counties
				)
		  ).sort()
		: [];
	return (
		<div className="flex flex-col sm:flex-row justify-center items-center gap-4 ">
			<div>
				<label htmlFor="stateFilter" className="font-bold mr-2">
					State:
				</label>
				<select
					id="stateFilter"
					value={selectedState}
					onChange={(e) => onStateChange(e.target.value)}
					className="p-2 border rounded"
				>
					<option value="">All States</option>
					{states.map((state) => (
						<option key={state} value={state}>
							{state}
						</option>
					))}
				</select>
			</div>
			<div>
				<label
					htmlFor="countyFilter"
					className={`font-bold mr-2 ${!selectedState ? 'text-gray-400' : ''}`}
				>
					County:
				</label>
				<select
					id="countyFilter"
					value={selectedCounty}
					onChange={(e) => onCountyChange(e.target.value)}
					className="p-2 border rounded"
					disabled={!selectedState} // Disable if no state is selected
				>
					<option value="">All Counties</option>
					{counties.map((county) => (
						<option key={county} value={county}>
							{county}
						</option>
					))}
				</select>
			</div>
			<div>
				<label htmlFor="specialtyFilter" className="font-bold mr-2">
					Specialty:
				</label>
				<select
					id="specialtyFilter"
					value={selectedSpecialty}
					onChange={(e) => onSpecialtyChange(e.target.value)}
					className="p-2 border rounded"
				>
					<option value="">All Specialties</option>
					{specialties.map((specialty) => (
						<option key={specialty} value={specialty}>
							{specialty}
						</option>
					))}
				</select>
			</div>
			<div>
				<label htmlFor="searchFilter" className="font-bold mr-2">
					Search:
				</label>
				<input
					type="text"
					id="searchFilter"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Enter doctor's name"
					className="p-2 border rounded"
				/>
			</div>
		</div>
	);
}

type USMapProps = {
	onStateSelect: (state: string) => void;
};

function USMap({ onStateSelect, selectedState }: USMapProps) {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		if (!svgRef.current) return;

		const width = 960;
		const height = 600;
		const svg = d3.select(svgRef.current);

		svg.attr('viewBox', `0 0 ${width} ${height}`);

		const path = d3.geoPath();

		// Create a tooltip div
		const tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background-color', 'white')
			.style('padding', '5px')
			.style('border', '1px solid #ccc')
			.style('border-radius', '5px')
			.style('pointer-events', 'none');

		d3.json('https://d3js.org/us-10m.v1.json').then((us: any) => {
			const states = topojson.feature(us, us.objects.states);

			// Store the state paths for later use
			const statePaths = svg
				.append('g')
				.selectAll('path')
				.data(states.features)
				.enter()
				.append('path')
				.attr('class', 'state')
				.attr('d', path)
				.attr('fill', '#815FA0')
				.attr('stroke', '#ffffff')
				.attr('stroke-width', '1');

			statePaths
				.on('mouseover', function (event, d: any) {
					const stateName = stateNames[d.id] || 'Unknown';
					tooltip
						.style('visibility', 'visible')
						.text(stateName)
						.style('top', event.pageY - 10 + 'px')
						.style('left', event.pageX + 10 + 'px');
				})
				.on('mousemove', function (event) {
					tooltip
						.style('top', event.pageY - 10 + 'px')
						.style('left', event.pageX + 10 + 'px');
				})
				.on('mouseout', function () {
					tooltip.style('visibility', 'hidden');
				});

			statePaths.on('click', function (event, d: any) {
				const stateName = stateNames[d.id] || 'Unknown';
				track('State Clicked', { state: stateName });
				updateSelectedState(stateName, this);
			});

			// Function to update the selected state
			function updateSelectedState(
				stateName: string,
				element: SVGPathElement | null
			) {
				statePaths.attr('fill', '#815FA0');
				if (element) {
					d3.select(element).attr('fill', '#3c236a');
				}
				onStateSelect(stateName);
			}

			// Update the map when selectedState changes
			if (selectedState) {
				const stateElement = statePaths
					.filter((d: any) => stateNames[d.id] === selectedState)
					.node();
				updateSelectedState(selectedState, stateElement);
			}

			// Add state labels
			svg
				.append('g')
				.selectAll('text')
				.data(states.features)
				.enter()
				.append('text')
				.attr('class', 'state-label')
				.attr('transform', (d: any) => `translate(${path.centroid(d)})`)
				.attr('dy', '.35em')
				.attr('text-anchor', 'middle')
				.text((d: any) => stateAbbreviations[stateNames[d.id]] || '')
				.style('fill', '#ffffff')
				.style('font-size', '10px');
		});
	}, [onStateSelect, selectedState]);

	return <svg ref={svgRef} className="w-full h-auto" />;
}

type Doctor = {
	name: string;
	specialty: string;
	address: string;
};

type DoctorListProps = {
	doctors: Doctor[];
	selectedSpecialty: string;
	searchQuery: string;
	currentPage: number;
	setCurrentPage: (page: number) => void;
};

function DoctorList({
	doctorData,
	doctors,
	selectedSpecialty,
	selectedCounty,
	searchQuery,
	currentPage,
	setCurrentPage,
	loading,
}: DoctorListProps) {
	const doctorsPerPage = 10;
	const maxPageButtons = 5;

	const allDoctors = Object.values(doctorData).flat();

	let filteredDoctors = allDoctors.filter((doctor) => {
		const specialties = doctor.specialty
			.toLowerCase()
			.split(',')
			.map((s) => s.trim());
		const selected = selectedSpecialty.toLowerCase();

		return (
			(doctors?.length === 0 || doctors?.includes(doctor)) &&
			(selectedCounty === '' || doctor.county === selectedCounty) &&
			(selected === '' ||
				(selected === 'surgical oncology' &&
					specialties.some(
						(specialty) =>
							specialty === 'surgery' ||
							specialty === 'surgical' ||
							specialty === 'surgical critical care' ||
							specialty === 'surgical oncology'
					)) ||
				(selected === 'radiation oncology' &&
					specialties.some(
						(specialty) => specialty === 'radiation oncology'
					)) ||
				(selected === 'medical oncology' &&
					specialties.some(
						(specialty) =>
							specialty === 'oncology' ||
							specialty === 'medical oncology' ||
							specialty === 'hematology' ||
							specialty === 'hematology & oncology'
					))) &&
			(searchQuery === '' ||
				doctor.name.toLowerCase().includes(searchQuery.toLowerCase()))
		);
	});

	if (selectedSpecialty.toLowerCase() === 'surgical oncology') {
		const filteredWithWhipple = filteredDoctors.filter(
			(doctor) => (parseInt(doctor.total_whipple_procedures) || 0) >= 1
		);
		if (filteredWithWhipple.length > 0) {
			filteredDoctors = filteredWithWhipple;
		}
		// If no doctors meet the 'whipple_procedures' criteria, retain the original filteredDoctors
	}

	// Sort by total_whipple_procedures if the selected specialty is surgical oncology
	if (selectedSpecialty.toLowerCase() === 'surgical oncology') {
		filteredDoctors.sort((a, b) => {
			const aProcedures = parseInt(a.total_whipple_procedures) || 0;
			const bProcedures = parseInt(b.total_whipple_procedures) || 0;
			return bProcedures - aProcedures;
		});
	}

	const indexOfLastDoctor = currentPage * doctorsPerPage;
	const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
	const currentDoctors = filteredDoctors.slice(
		indexOfFirstDoctor,
		indexOfLastDoctor
	);

	const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber);
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	const handlePreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const getPageNumbers = () => {
		if (totalPages <= maxPageButtons) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		if (currentPage <= 3) {
			return [1, 2, 3, 4, 5];
		}

		if (currentPage >= totalPages - 2) {
			return [
				totalPages - 4,
				totalPages - 3,
				totalPages - 2,
				totalPages - 1,
				totalPages,
			];
		}

		return [
			currentPage - 2,
			currentPage - 1,
			currentPage,
			currentPage + 1,
			currentPage + 2,
		];
	};

	async function handleDoctorClick(doctor) {
		if (doctor.url) {
			track('Doctor URL Clicked', { doctorName: doctor.name, url: doctor.url });
			window.open(doctor.url, '_blank');
		} else {
			console.error('No URL available for this doctor');
		}
	}
	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			{loading ? (
				<h2 className="text-2xl font-bold mb-4">
					Loading Doctors... Please wait.
				</h2>
			) : (
				<h2 className="text-2xl font-bold mb-4">
					Doctors List ({filteredDoctors.length.toLocaleString()} doctors)
				</h2>
			)}
			{loading && (
				<div className="flex justify-center items-center">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
				</div>
			)}
			{currentDoctors.length > 0 ? (
				<>
					<ul className="space-y-4">
						{currentDoctors.map((doctor, index) => (
							<li key={index} className="relative">
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handleDoctorClick(doctor);
									}}
									className="block bg-gray-100 p-4 rounded hover:bg-gray-200 text-[#815FA0] transition-colors duration-200"
								>
									<strong className="text-lg block underline">
										{doctor.name}
									</strong>
									<p className="mt-2 text-gray-600 group-hover:text-[#815FA0]">
										Address: {doctor.address}
										{/* <br />
										total_pancreatic_cancer: {doctor.total_pancreatic_cancer}
										<br /> total_whipple_procedures:{' '}
										{doctor.total_whipple_procedures} */}
									</p>
									<span className="absolute top-2 right-2 bg-[#815FA0] text-white px-2 py-1 rounded">
										{doctor.specialty}
									</span>
								</a>
							</li>
						))}
					</ul>
					<div className="mt-6 flex justify-center items-center">
						{currentPage > 1 && (
							<button
								onClick={handlePreviousPage}
								className="mr-2 px-3 py-1 rounded bg-[#815FA0] text-white"
							>
								Back
							</button>
						)}
						{currentPage > 3 && totalPages > maxPageButtons && (
							<>
								<button
									onClick={() => handlePageChange(1)}
									className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700"
								>
									1
								</button>
								<span className="mx-1">...</span>
							</>
						)}
						{getPageNumbers().map((page) => (
							<button
								key={page}
								onClick={() => handlePageChange(page)}
								className={`mx-1 px-3 py-1 rounded ${
									currentPage === page
										? 'bg-[#815FA0] text-white'
										: 'bg-gray-200 text-gray-700'
								}`}
							>
								{page}
							</button>
						))}
						{currentPage < totalPages - 2 && totalPages > maxPageButtons && (
							<>
								<span className="mx-1">...</span>
								<button
									onClick={() => handlePageChange(totalPages)}
									className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700"
								>
									{totalPages}
								</button>
							</>
						)}
						{currentPage < totalPages && (
							<button
								onClick={handleNextPage}
								className="ml-2 px-3 py-1 rounded bg-[#815FA0] text-white"
							>
								Next
							</button>
						)}
					</div>
				</>
			) : (
				<p>No doctors available for the selected criteria.</p>
			)}
		</div>
	);
}

export default function DoctorFinder() {
	const [doctorData, setDoctorData] = useState([]);
	const [selectedState, setSelectedState] = useState('');
	const [selectedSpecialty, setSelectedSpecialty] = useState('');
	const [selectedCounty, setSelectedCounty] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);

	const handleStateChange = (state: string) => {
		if (state !== selectedState) {
			setCurrentPage(1);
			setSelectedCounty('');
		}
		setSelectedState(state);
		track('State Selected', { state });
	};

	const handleSpecialtyChange = (specialty: string) => {
		setSelectedSpecialty(specialty);
		setCurrentPage(1);
		track('Specialty Selected', { specialty });
	};

	const handleCountyChange = (county: string) => {
		setSelectedCounty(county);
		setCurrentPage(1);
		track('County Selected', { county });
	};

	const handleSearchChange = useCallback(
		debounce((query: string) => {
			track('Search Query', { query });
		}, 300),
		[]
	);

	const handleSearchInputChange = (query: string) => {
		setSearchQuery(query);
		setCurrentPage(1);
		handleSearchChange(query);
	};

	const allDoctors = Object.values(doctorData).flat();
	const stateKeys = Object.entries(stateNames).reduce((acc, [key, value]) => {
		acc[value] = value;
		return acc;
	}, {});

	const stateKey = stateKeys[selectedState];

	const limitedDoctors =
		selectedState && limitStates.includes(selectedState)
			? doctorData[stateKey].slice(0, 2000)
			: selectedState
			? doctorData[selectedState]
			: allDoctors;
	const filteredDoctors = limitedDoctors.filter(
		(doctor) =>
			(selectedState === '' || doctorData[selectedState]?.includes(doctor)) &&
			(selectedSpecialty === '' ||
				doctor.specialty
					.toLowerCase()
					.includes(selectedSpecialty.toLowerCase())) &&
			(selectedCounty === '' ||
				(doctor.county &&
					doctor.county.toLowerCase() === selectedCounty.toLowerCase())) &&
			(searchQuery === '' ||
				doctor.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [filteredDoctors.length]);

	useEffect(() => {
		const fetchDoctorData = async () => {
			setLoading(true); // Show loader
			try {
				const response = await fetch(
					'https://us-pancreatic-cancer-map.vercel.app/api/fetchDoctorsData'
				);

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();

				const transformedData = processDoctorDataWithStateAbbreviations(
					data,
					stateAbbreviations
				);
				setDoctorData(transformedData);
			} catch (error) {
				console.error('Failed to fetch doctor data:', error);
			} finally {
				setLoading(false); // Hide loader
			}
		};

		fetchDoctorData();
	}, []);

	return (
		<div className="flex flex-col items-center gap-8">
			{/* Loader element */}
			<FilterContainer
				selectedState={selectedState}
				selectedSpecialty={selectedSpecialty}
				selectedCounty={selectedCounty}
				searchQuery={searchQuery}
				onStateChange={handleStateChange}
				onSpecialtyChange={handleSpecialtyChange}
				onCountyChange={handleCountyChange}
				onSearchChange={handleSearchInputChange}
				doctorData={doctorData}
			/>
			<div className="w-full max-w-4xl mt-8">
				{Object.keys(doctorData).length > 0 && (
					<USMap
						onStateSelect={handleStateChange}
						selectedState={selectedState}
					/>
				)}
			</div>
			<div className="w-full max-w-4xl mt-8">
				<DoctorList
					doctors={limitedDoctors}
					selectedSpecialty={selectedSpecialty}
					selectedCounty={selectedCounty}
					searchQuery={searchQuery}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					doctorData={doctorData}
					loading={loading}
				/>
			</div>
		</div>
	);
}
