export type TravelMode =
    | "automatic"
    | "walking"
    | "driving"
    | "cycling"
    | "transit";

export type GuestStop = {
    id: string;
    itinerary_id: string;
    name: string;
    description: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    place_id: string | null;
    time: string;
    position_in_itinerary: number;
    input_mode: "search" | "manual";
};

export type GuestItinerary = {
    id: string;
    title: string;
    description: string;
    stops: GuestStop[];
    created_at: string;
    updated_at: string;
    published: boolean;
    owner_id: null;
};

export type GuestDraft = {
    title: string;
    description: string;
    stops: GuestStop[];
    legModes?: Record<string, TravelMode>;
    updated_at: string;
};

const ITINERARIES_KEY = "fork-my-boston:guest-itineraries";
const DRAFT_KEY = "fork-my-boston:guest-draft";

// Retrieve saved guest itineraries
export function getGuestItineraries(): GuestItinerary[] {
    if (typeof window === "undefined") return [];

    try {
        const saved = localStorage.getItem(ITINERARIES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

// Save a guest itinerary
export function saveGuestItinerary(itinerary: GuestItinerary): void {
    if (typeof window === "undefined") return;

    const itineraries = getGuestItineraries();

    const existingIndex = itineraries.findIndex(
        (item) => item.id === itinerary.id
    );

    if (existingIndex >= 0) {
        itineraries[existingIndex] = itinerary;
    } else {
        itineraries.push(itinerary);
    }

    localStorage.setItem(
        ITINERARIES_KEY,
        JSON.stringify(itineraries)
    );
}

// Delete a guest itinerary
export function deleteGuestItinerary(id: string): void {
    if (typeof window === "undefined") return;

    const updated = getGuestItineraries().filter(
        (item) => item.id !== id
    );

    localStorage.setItem(ITINERARIES_KEY, JSON.stringify(updated));
}

// Retrieve the current unfinished draft
export function getGuestDraft(): GuestDraft | null {
    if (typeof window === "undefined") return null;

    try {
        const saved = localStorage.getItem(DRAFT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

// Automatically save the current draft
export function saveGuestDraft(draft: GuestDraft): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

// Clear the draft after saving the itinerary
export function clearGuestDraft(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(DRAFT_KEY);
}
