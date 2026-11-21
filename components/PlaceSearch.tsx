"use client";

import { useEffect, useState } from "react";

export type SelectedPlace = {
  name: string;
  address: string;
  placeId: string | null;
  latitude: number;
  longitude: number;
};

type PlaceSearchProps = {
  onSelect: (place: SelectedPlace) => void;
};

type GeoapifyResult = {
  name?: string;
  formatted: string;
  place_id?: string;
  lat: number;
  lon: number;
};

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoapifyResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          text: query,
          format: "json",
          limit: "5",
          filter: "countrycode:us",
          bias: "proximity:-71.0589,42.3601",
          apiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "",
        });

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch places");
        }

        const data = await response.json();

        setResults(data.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Place search error:", error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleSelect(result: GeoapifyResult) {
    onSelect({
      name: result.name || result.formatted.split(",")[0],
      address: result.formatted,
      placeId: result.place_id ?? null,
      latitude: result.lat,
      longitude: result.lon,
    });

    setQuery(result.formatted);
    setResults([]);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place in Boston..."
        className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
      />

      {loading && (
        <p className="mt-2 text-xs text-gray-400">
          Searching places...
        </p>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#E8E3D8] bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.place_id ?? `${result.formatted}-${index}`}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full border-b border-[#F0EDE7] px-4 py-3 text-left transition last:border-0 hover:bg-[#F7F5EF]"
            >
              <p className="text-sm font-medium text-[#292D27]">
                {result.name || result.formatted.split(",")[0]}
              </p>

              <p className="mt-1 text-xs text-[#929187]">
                {result.formatted}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
