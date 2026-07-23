const API_BASE = 'http://localhost:2050';

export async function fetchTotalRecords(): Promise<number> {
    let url = `${API_BASE}/recordCount`;

	return $.get(url)
		.then(count => Number(count))
		.catch(error => handleApiError('/recordCount', error));
}

export async function fetchColumns(): Promise<string[]> {
	let url = `${API_BASE}/columns`;

	return $.get(url)
		.then(cols => {
			if(typeof cols === 'string')
				return JSON.parse(cols);
			return cols;
		})
		.catch(error => handleApiError('/columns', error));
}

export async function fetchCurrentPageRecords(from: number, to: number): Promise<any[][]> {
    let url = `${API_BASE}/records?from=${from}&to=${to}`;

	return $.get(url)
		.then(data => {
			if(typeof data === 'string')
				return JSON.parse(data);
			return data;
		})
		.catch(error => handleApiError('/records', error));
}

function handleApiError(endpoint: string, error: any): never {
	console.error(`API call to ${endpoint} failed: `, error);
	throw new Error(`Failed to fetch data from the server for ${endpoint}, please retry again.`)
}
