// @ts-nocheck
import doctorData from '@/app/data/pancreatic-map-data.json';

const filteredData = doctorData.sort((a, b) => {
	const cancerA = parseInt(a.total_pancreatic_cancer, 10) || 0;
	const cancerB = parseInt(b.total_pancreatic_cancer, 10) || 0;
	return cancerB - cancerA;
});

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

const stateAbbreviationsReverse: Record<string, string> = Object.entries(
	stateAbbreviations
).reduce((acc, [fullName, abbr]) => {
	acc[abbr.toUpperCase()] = fullName;
	return acc;
}, {} as Record<string, string>);

export const doctorsData: Record<
	string,
	Array<{ name: string; specialty: string; address: string; county: string }>
> = filteredData.reduce((acc, doctor) => {
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
						(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
					)
					.join(' ')
			: undefined,
		total_whipple_procedures: doctor.total_whipple_procedures,
		total_pancreatic_cancer: doctor.total_pancreatic_cancer,
		url: doctor.url,
	});

	return acc;
}, {} as Record<string, Array<{ name: string; specialty: string; address: string; county: string }>>);
