/**
 * Progression Event API Service
 * 
 * Fetches and parses progression event data from the backend API
 */

import { buildApiUrl } from '../config/api';
import type { ProgressionEventResponse, ProgressionEventData } from '../types/progressionEvent';

export interface ParsedProgressionEvent {
    id: string;
    name: string;
    endDate: string;
    data: ProgressionEventData;
}

/**
 * Fetches the current progression event from the API
 */
export async function fetchProgressionEvent(): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl('/api/ProgressionEvents');

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const raw: ProgressionEventResponse = await response.json();

    // Parse the nested JSON data string
    const data: ProgressionEventData = JSON.parse(raw.data);

    return {
        id: raw.id,
        name: raw.name,
        endDate: raw.endDate,
        data,
    };
}
