"use client";

import { useState, useEffect } from "react";
import { getGuestItineraries, type GuestItinerary } from "@/lib/storage";
import NavBar from "../components/NavBar";

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [savedItineraries, setSavedItineraries] = useState<GuestItinerary[]>([]);

    // Filter menu state
    const [showFilters, setShowFilters] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [neighborhoodFilter, setNeighborhoodFilter] = useState("All");
    const [priceFilter, setPriceFilter] = useState("All");

    useEffect(() => {
        setSavedItineraries(getGuestItineraries());
    }, []);

    // Mock itinerary data
    const itineraries = [
        {
            id: "1",
            title: "A perfect Saturday in Boston",
            description: "Coffee, bookstores, and a walk along the Charles.",
            category: "Outdoors",
            neighborhood: "Cambridge",
            price: "$$",
            stops: ["Tatte", "Harvard Square", "Charles River"],
        },
        {
            id: "2",
            title: "A North End food crawl",
            description: "Pizza, pastries, and Italian food.",
            category: "Food & Coffee",
            neighborhood: "North End",
            price: "$$",
            stops: ["Mike's Pastry", "Regina Pizzeria"],
        },
        {
            id: "3",
            title: "A cozy Back Bay afternoon",
            description: "Coffee, shopping, and beautiful city streets.",
            category: "Food & Coffee",
            neighborhood: "Back Bay",
            price: "$$$",
            stops: ["Newbury Street", "Thinking Cup", "Boston Public Garden"],
        },
        {
            id: "4",
            title: "An afternoon exploring Boston",
            description: "Historic landmarks and scenic outdoor spots.",
            category: "Outdoors",
            neighborhood: "Downtown",
            price: "$",
            stops: ["Boston Common", "Beacon Hill", "Public Garden"],
        },
    ];

    // Combine mock itineraries with saved guest itineraries
    const allItineraries = [
        ...itineraries,
        ...savedItineraries.map((itinerary) => ({
            id: itinerary.id,
            title: itinerary.title,
            description: itinerary.description,
            category: "Your Saved Itinerary",
            neighborhood: "Various",
            price: "All",
            stops: itinerary.stops
                .map((stop) => stop.name)
                .filter(Boolean),
        })),
    ];

    // Popular search suggestions (mock data)
    const popularSearches = [
        { term: "Best matcha in Boston", searches: "2.4k searches" },
        { term: "Date night in Boston", searches: "1.8k searches" },
        { term: "Study spots in Cambridge", searches: "1.2k searches" },
        { term: "Boston brunch spots", searches: "980 searches" },
        { term: "Things to do in Seaport", searches: "850 searches" },
        { term: "Best coffee shops", searches: "720 searches" },
    ];

    // Apply search and filters
    const filteredItineraries = allItineraries.filter((itinerary) => {
        const searchableText = [
            itinerary.title,
            itinerary.description,
            itinerary.category,
            itinerary.neighborhood,
            ...itinerary.stops,
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchQuery.toLowerCase());

        const matchesCategory =
            categoryFilter === "All" ||
            itinerary.category === categoryFilter;

        const matchesNeighborhood =
            neighborhoodFilter === "All" ||
            itinerary.neighborhood === neighborhoodFilter;

        const matchesPrice =
            priceFilter === "All" ||
            itinerary.price === priceFilter;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesNeighborhood &&
            matchesPrice
        );
    });

    // Reset all filters
    const resetFilters = () => {
        setCategoryFilter("All");
        setNeighborhoodFilter("All");
        setPriceFilter("All");
    };

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#292D27]">
            <div className="mx-auto max-w-5xl">

                {/* Navigation */}
                <NavBar />

                {/* Welcome section */}
                <header className="mb-12 py-2">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#C97955]">
                        Fork My Boston
                    </p>

                    <h1 className="font-serif text-5xl">
                        Welcome to Fork My Boston!
                    </h1>

                    <p className="mt-4 text-xl text-[#77796F]">
                        Discover and share Boston adventures.
                    </p>
                </header>

                {/* Search section */}
                <section className="mb-12">
                    <h2 className="mb-4 font-serif text-3xl">
                        Where to Next?
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            placeholder="Try 'coffee shops in Cambridge'..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-w-0 flex-1 rounded-xl border border-[#E8E3D8] bg-white px-5 py-4 outline-none transition focus:border-[#C97955]"
                        />

                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-4 font-medium transition ${
                                showFilters
                                    ? "border-[#C97955] bg-[#C97955] text-white"
                                    : "border-[#E8E3D8] bg-white hover:border-[#C97955]"
                            }`}
                        >
                            <span>☷</span>
                            Filters
                            <span>{showFilters ? "−" : "+"}</span>
                        </button>
                    </div>

                    {/* Filter dropdown */}
                    {showFilters && (
                        <div className="mt-4 rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="font-serif text-xl">
                                    Refine your search
                                </h3>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-sm font-medium text-[#C97955] hover:text-[#A85D3F]"
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-3">
                                {/* Category */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Category
                                    </label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full rounded-lg border border-[#E8E3D8] bg-[#F7F5EF] px-3 py-3 outline-none focus:border-[#C97955]"
                                    >
                                        <option value="All">All categories</option>
                                        <option value="Food & Coffee">Food & Coffee</option>
                                        <option value="Outdoors">Outdoors</option>
                                        <option value="Your Saved Itinerary">My saved itineraries</option>
                                    </select>
                                </div>

                                {/* Neighborhood */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Neighborhood
                                    </label>
                                    <select
                                        value={neighborhoodFilter}
                                        onChange={(e) => setNeighborhoodFilter(e.target.value)}
                                        className="w-full rounded-lg border border-[#E8E3D8] bg-[#F7F5EF] px-3 py-3 outline-none focus:border-[#C97955]"
                                    >
                                        <option value="All">All neighborhoods</option>
                                        <option value="Back Bay">Back Bay</option>
                                        <option value="Cambridge">Cambridge</option>
                                        <option value="Downtown">Downtown</option>
                                        <option value="North End">North End</option>
                                    </select>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Price range
                                    </label>
                                    <select
                                        value={priceFilter}
                                        onChange={(e) => setPriceFilter(e.target.value)}
                                        className="w-full rounded-lg border border-[#E8E3D8] bg-[#F7F5EF] px-3 py-3 outline-none focus:border-[#C97955]"
                                    >
                                        <option value="All">Any price</option>
                                        <option value="$">$ · Budget-friendly</option>
                                        <option value="$$">$$ · Moderate</option>
                                        <option value="$$$">$$$ · Upscale</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Popular Searches */}
                <section className="mb-16">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-3xl">
                                Explore Popular Searches
                            </h2>
                            <p className="mt-2 text-sm text-[#77796F]">
                                Find inspiration for your next adventure.
                            </p>
                        </div>
                        <span className="text-sm text-[#929187]">
                            ↗ Trending
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {popularSearches.map((item, index) => (
                            <button
                                key={item.term}
                                type="button"
                                onClick={() => {
                                    setSearchQuery(item.term);
                                    resetFilters();
                                }}
                                className="group flex items-center justify-between rounded-xl border border-[#E8E3D8] bg-white p-4 text-left transition hover:-translate-y-1 hover:border-[#C97955] hover:shadow-sm"
                            >
                                <div>
                                    <p className="font-medium transition group-hover:text-[#C97955]">
                                        {item.term}
                                    </p>
                                    <p className="mt-1 text-xs text-[#929187]">
                                        {item.searches}
                                    </p>
                                </div>

                                <span className="text-lg text-[#C97955]">
                                    {index + 1}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Popular Itineraries */}
                <section>
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl">
                                Explore Popular Itineraries
                            </h2>
                            <p className="mt-2 text-sm text-[#77796F]">
                                Discover adventures created by the community.
                            </p>
                        </div>

                        <span className="text-sm text-[#929187]">
                            {filteredItineraries.length} Results
                        </span>
                    </div>

                    {filteredItineraries.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            {filteredItineraries.map((itinerary) => (
                                <div
                                    key={itinerary.id}
                                    className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C97955]">
                                        {itinerary.category}
                                    </p>

                                    <h3 className="font-serif text-2xl">
                                        {itinerary.title}
                                    </h3>

                                    <p className="mt-3 text-sm leading-relaxed text-[#77796F]">
                                        {itinerary.description}
                                    </p>

                                    <div className="my-5 border-t border-[#E8E3D8]" />

                                    <div className="flex flex-wrap gap-3 text-xs text-[#929187]">
                                        <span>📍 {itinerary.neighborhood}</span>
                                        <span>💰 {itinerary.price}</span>
                                        <span>{itinerary.stops.length} stops</span>
                                    </div>

                                    <p className="mt-3 text-sm text-[#77796F]">
                                        {itinerary.stops.join(" · ")}
                                    </p>

                                    <button
                                        type="button"
                                        className="mt-5 text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]"
                                    >
                                        View itinerary →
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#D6CFC1] p-10 text-center">
                            <h3 className="font-serif text-xl">
                                No adventures found just yet.
                            </h3>

                            <p className="mt-2 text-sm text-[#929187]">
                                Try another search or adjust your filters!
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    resetFilters();
                                }}
                                className="mt-4 text-sm font-semibold text-[#C97955]"
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
