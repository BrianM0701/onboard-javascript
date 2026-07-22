import { API_BASE } from '../app.js';

export async function fetchTotalRecords(): Promise<number> {
    let url = `${API_BASE}/recordCount`;
    let count = await $.get(url);
    return Number(count);
}

export async function fetchColumns(): Promise<string[]> {
    let url = `${API_BASE}/columns`;
    let cols = await $.get(url);
    if (typeof cols === 'string')
        return JSON.parse(cols);
    return cols;
}

export async function fetchCurrentPageRecords(from: number, to: number): Promise<any[][]> {
    let url = `${API_BASE}/records?from=${from}&to=${to}`;
    let data = await $.get(url);
    if (typeof data === 'string')
        return JSON.parse(data);
    return data;
}
