const API_BASE = 'http://localhost:2050';

export async function fetchTotalRecords(): Promise<number> {
    try {
		let url = `${API_BASE}/recordCount`;
    	let count = await $.get(url);
    	return Number(count);
	}catch(error) {
		handleApiError('/recordCount', error);
	}
}

export async function fetchColumns(): Promise<string[]> {
    try {
		let url = `${API_BASE}/columns`;
		let cols = await $.get(url);
		if (typeof cols === 'string')
			return JSON.parse(cols);
		return cols;
	}catch(error) {
		handleApiError('/columns', error);
	}
}

export async function fetchCurrentPageRecords(from: number, to: number): Promise<any[][]> {
    try {
		let url = `${API_BASE}/records?from=${from}&to=${to}`;
		let data = await $.get(url);
		if (typeof data === 'string')
			return JSON.parse(data);
		return data;
	}catch(error) {
		handleApiError('/records', error);
	}
}

function handleApiError(endpoint: string, error: any): never {
	console.error(`API call to ${endpoint} failed: `, error);
	throw new Error(`Failed to fetch data from the server for ${endpoint}, please retry again.`)
}
