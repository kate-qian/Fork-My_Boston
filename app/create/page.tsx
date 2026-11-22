"use client";

import { useState, useEffect } from "react";
import { getGuestDraft, saveGuestDraft, saveGuestItinerary, clearGuestDraft, type TravelMode, } from "@/lib/storage";
import PlaceSearch, { type SelectedPlace, } from "../../components/PlaceSearch";
import ItineraryMap from "../../components/ItineraryMap";
import NavBar from "../../components/NavBar";
import { useAuth } from "../context/AuthContext";
import { optimizeStopOrder } from "@/lib/planning/route-optimization";


type Stop = {
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

function getLegKey(fromStopId: string, toStopId: string) {
    return `${fromStopId}->${toStopId}`;
}

export default function CreatePage() {
    // const { user_logged_in, isGuest } = useAuth();

    // Example 1: Block guests from viewing or submitting a page
    // if (isGuest) {
    //     return (
    //         <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
    //             <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
    //                 <h1 className="text-2xl font-bold text-gray-900">Sign in required</h1>
    //                 <p className="mt-2 text-gray-500">
    //                     Guests (ID: {user_logged_in}) cannot publish itineraries. Please log in first.
    //                 </p>
    //                 <a
    //                     href="/login"
    //                     className="text-med font-semibold text-[#77796F] transition hover:text-[#C97955]"
    //                 >
    //                     Log In
    //                 </a>
    //             </div>
    //         </main>
    //     );
    // }
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [stops, setStops] = useState<Stop[]>([{
        id: crypto.randomUUID(),
        itinerary_id: "",
        name: "",
        description: "",
        location: "",
        latitude: null,
        longitude: null,
        place_id: null,
        time: "",
        position_in_itinerary: 1,
        input_mode: "manual",
    }]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [routeMessage, setRouteMessage] = useState("");
    const [legModes, setLegModes] = useState<Record<string, TravelMode>>({});

    async function handlePublish() {
        // if (!title.trim()) {
        //     setStatusMessage({ type: "error", text: "Please enter an itinerary name." });
        //     return;
        // }

        // setIsSubmitting(true);
        // setStatusMessage(null);

        const itineraryId = crypto.randomUUID();
        const now = new Date().toISOString();

        const payload = {
            id: itineraryId,
            title: title,
            description: description,
            location: "Boston",
            //travel_date: travelDate ? new Date(travelDate).toISOString() : now,
            travel_date: "anytime",
            created: now,
            last_updated: now,
            published: true,
            stops: stops.map((stop) => ({
                ...stop,
                itinerary_id: itineraryId,
            })),
        };

        //saveGuestItinerary(payload);
        clearGuestDraft();

        setSaveStatus("Itinerary saved!");

        alert("Your itinerary has been saved on this device!");

        try {
            const response = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to publish itinerary");
            }

            // setStatusMessage({
            //     type: "success",
            //     text: "Your itinerary has been published and saved!",
            // });
        } catch (error) {
            console.error("Publish error:", error);
            // setStatusMessage({
            //     type: "error",
            //     text: "Something went wrong while saving your itinerary.",
            // });
        } finally {
            //setIsSubmitting(false);
        }
    }

    // const handlePublish = () => {
    //     if (!title.trim()) return;

    //     const now = new Date().toISOString();

    //     const itinerary = {
    //         id: crypto.randomUUID(),
    //         title: title.trim(),
    //         description,
    //         stops: stops.map((stop, index) => ({
    //             ...stop,
    //             position_in_itinerary: index + 1,
    //         })),
    //         created_at: now,
    //         updated_at: now,
    //         published: false,
    //         owner_id: null,
    //     };

    //     saveGuestItinerary(itinerary);
    //     clearGuestDraft();

    //     setSaveStatus("Itinerary saved!");

    //     alert("Your itinerary has been saved on this device!");
    // };

    const addStop = () => {
        setStops((prevStops) => [...prevStops, {
            id: crypto.randomUUID(),
            itinerary_id: "",
            name: "",
            description: "",
            location: "",
            latitude: null,
            longitude: null,
            place_id: null,
            time: "",
            position_in_itinerary: prevStops.length + 1,
            input_mode: "manual",
        }]);
    };

    const addMapStop = (place: {
        name: string;
        category: string;
        latitude: number;
        longitude: number;
    }) => {
        setStops((prevStops) => [
            ...prevStops,
            {
                id: crypto.randomUUID(),
                itinerary_id: "",
                name: place.name,
                description: "",
                location: "Boston, MA",
                latitude: place.latitude,
                longitude: place.longitude,
                place_id: null,
                time: "",
                position_in_itinerary: prevStops.length + 1,
                input_mode: "search",
            },
        ]);
    };

    const handleOptimizeRoute = () => {
        const locatedCount = stops.filter(
            (stop) =>
                stop.latitude !== null &&
                stop.longitude !== null
        ).length;

        if (locatedCount < 3) {
            setRouteMessage(
                "Add at least three located stops to optimize your route."
            );
            return;
        }

        const result = optimizeStopOrder(stops);

        if (!result.improved) {
            setRouteMessage(
                `Your current route is already efficient! (${result.originalDistanceKm.toFixed(1)} km)`
            );
            return;
        }

        setStops(
            result.stops.map((stop, index) => ({
                ...stop,
                position_in_itinerary: index + 1,
            }))
        );

        setRouteMessage(
            `Route improved! ${result.originalDistanceKm.toFixed(1)} km → ${result.optimizedDistanceKm.toFixed(1)} km`
        );
    };

    // Recover an unfinished draft when the page loads
    useEffect(() => {
        const draft = getGuestDraft();

        if (draft) {
            setTitle(draft.title);
            setDescription(draft.description);
            setStops(draft.stops);
            setLegModes(draft.legModes ?? {});
        }

        setIsLoaded(true);
    }, []);

    // Automatically save whenever the user makes changes
    useEffect(() => {
        if (!isLoaded) return;

        saveGuestDraft({
            title,
            description,
            stops,
            legModes,
            updated_at: new Date().toISOString(),
        });

        setSaveStatus("Saved on this device");
    }, [title, description, stops, legModes, isLoaded]);

    const removeStop = (id: string) => {
        setStops((prevStops) =>
            prevStops.filter((stop) => stop.id !== id).map((stop, index) =>
                ({ ...stop, position_in_itinerary: index + 1, })));
    };

    const updateStop = (id: string, field: "name" | "description" | "location" | "time", value: string) => {
        setStops((prevStops) => prevStops.map((stop) => stop.id === id ? {
            ...stop,
            [field]: value,
            ...(field === "name" || field === "location" ? {
                latitude: null,
                longitude: null,
                place_id: null,
            } : {})
        } : stop));
    };

    const updateStopMode = (id: string, mode: "search" | "manual") => {
        setStops((prevStops) => prevStops.map((stop) =>
            stop.id === id ? { ...stop, input_mode: mode } : stop));
    };

    const selectPlace = (id: string, place: SelectedPlace) => {
        setStops((prevStops) => prevStops.map((stop) => stop.id === id ? {
            ...stop,
            name: place.name,
            location: place.address,
            place_id: place.placeId,
            latitude: place.latitude,
            longitude: place.longitude,
        } : stop));
    };

    const moveStop = (index: number, direction: -1 | 1) => {
        setStops((prevStops) => {
            const newStops = [...prevStops];
            const newIndex = index + direction;

            if (newIndex < 0 || newIndex >= newStops.length) {
                return prevStops;
            }

            [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];

            return newStops.map((stop, i) => ({ ...stop, position_in_itinerary: i + 1, }));
        });
    };

    return (
        <main className="min-h-screen bg-[#F7F5EF] px-6 py-10">

            {/* Navigation */}
            <NavBar />

            {/* Page content */}
            <div className="mx-auto">

                {/* Header */}
                <header className="mb-10 w-full pb-6">
                    <div className="flex w-full justify-center">
                        <h1 className="font-serif text-4xl text-center font-bold tracking-tight text-[#292D27] py-3">
                            Create a New Itinerary!
                        </h1>
                    </div>

                    <p className="mt-2 w-full text-center text-lg text-[#929187]">
                        Put together your favorite places and share your perfect Boston day!
                    </p>
                </header>

                <div className="space-y-8">

                    {/* Basic itinerary information */}
                    <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-semibold text-[#292D27]">
                            General Information
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                    Title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="ex. Thanksgiving Weekend Travel Trot"
                                    className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell us about your plans!"
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Stops and map */}
                    <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#292D27]">
                                    Your Stops
                                </h2>

                                <p className="mt-1 text-sm text-[#929187]">
                                    Add the places you want to visit!
                                </p>
                            </div>

                            <span className="rounded-full bg-[#F7F5EF] px-3 py-1 text-sm font-medium text-[#C97955]">
                                {stops.length} stops
                            </span>
                        </div>

                                                {/* Interactive map */}
                        <div className="mb-4">
                            <ItineraryMap
                                stops={stops.map((stop) => ({
                                    id: stop.id,
                                    name: stop.name,
                                    latitude: stop.latitude,
                                    longitude: stop.longitude,
                                }))}
                                legModes={legModes}
                                onAddStop={addMapStop}
                            />
                        </div>

                        {/* Route optimization */}
                        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F5EF] p-4">
                            <div>
                                <h3 className="font-semibold text-[#34483B]">
                                    Plan your route
                                </h3>
                                <p className="mt-1 text-sm text-[#929187]">
                                    Find a more efficient order for your stops.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleOptimizeRoute}
                                disabled={
                                    stops.filter(
                                        (stop) =>
                                            stop.latitude !== null &&
                                            stop.longitude !== null
                                    ).length < 3
                                }
                                className="rounded-lg bg-[#34483B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#293A30] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Optimize Route
                            </button>

                            {routeMessage && (
                                <p className="w-full text-sm text-[#71816E]">
                                    {routeMessage}
                                </p>
                            )}
                        </div>

                        {/* Individual stop cards */}
                        <div className="space-y-5">
                            {stops.map((stop, index) => (
                                <div
                                    key={stop.id}
                                    className="rounded-xl border border-[#E8E3D8] bg-[#FDFCF9] p-5"
                                >
                                    {/* Stop heading */}
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34483B] text-sm font-semibold text-white">
                                                {index + 1}
                                            </span>

                                            <h3 className="font-semibold text-[#292D27]">
                                                Stop {index + 1}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => moveStop(index, -1)}
                                                disabled={index === 0}
                                                className="text-sm text-[#929187] transition hover:text-[#34483B] disabled:cursor-not-allowed disabled:opacity-30"
                                                title="Move up"
                                            >
                                                ↑
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => moveStop(index, 1)}
                                                disabled={index === stops.length - 1}
                                                className="text-sm text-[#929187] transition hover:text-[#34483B] disabled:cursor-not-allowed disabled:opacity-30"
                                                title="Move down"
                                            >
                                                ↓
                                            </button>

                                            {stops.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStop(stop.id)}
                                                    className="text-sm text-[#B66B58] transition hover:text-red-600"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Search / manual toggle */}
                                    <div className="mb-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStopMode(stop.id, "search")
                                            }
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${stop.input_mode === "search"
                                                ? "bg-[#34483B] text-white"
                                                : "bg-[#F0EDE7] text-[#55594F] hover:bg-[#E8E3D8]"
                                                }`}
                                        >
                                            Search Places
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStopMode(stop.id, "manual")
                                            }
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${stop.input_mode === "manual"
                                                ? "bg-[#34483B] text-white"
                                                : "bg-[#F0EDE7] text-[#55594F] hover:bg-[#E8E3D8]"
                                                }`}
                                        >
                                            Enter Manually
                                        </button>
                                    </div>

                                    {/* Place input */}
                                    <div className="space-y-4">

                                        {stop.input_mode === "search" ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                                    Search for a place
                                                </label>

                                                <PlaceSearch
                                                    onSelect={(place) =>
                                                        selectPlace(stop.id, place)
                                                    }
                                                />

                                                {stop.name && (
                                                    <div className="mt-3 rounded-lg bg-[#F0F3EE] p-3">
                                                        <p className="text-sm font-semibold text-[#34483B]">
                                                            {stop.name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-[#929187]">
                                                            {stop.location}
                                                        </p>

                                                        <p className="mt-2 text-xs text-[#71816E]">
                                                            <span className="mr-1">✓</span>
                                                            Location added to map
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                                        Place name
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={stop.name}
                                                        onChange={(e) =>
                                                            updateStop(
                                                                stop.id,
                                                                "name",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="ex. Mecha Noodle Bar"
                                                        className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                                        Address / location
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={stop.location}
                                                        onChange={(e) =>
                                                            updateStop(
                                                                stop.id,
                                                                "location",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter an address or location"
                                                        className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                                    />

                                                    <p className="mt-1 text-xs text-[#929187]">
                                                        Manual locations won't appear on the map
                                                        unless coordinates are selected through search.
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {/* Stop description */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                                What are you doing here?
                                            </label>

                                            <textarea
                                                value={stop.description}
                                                onChange={(e) =>
                                                    updateStop(
                                                        stop.id,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Share what makes this stop worth visiting..."
                                                rows={2}
                                                className="w-full resize-none rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                            />
                                        </div>

                                        {/* Optional time */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[#55594F]">
                                                Time <span className="font-normal text-[#929187]">(optional)</span>
                                            </label>

                                            <input
                                                type="time"
                                                value={stop.time}
                                                onChange={(e) =>
                                                    updateStop(
                                                        stop.id,
                                                        "time",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C97955]"
                                            />
                                        </div>
                                    </div>
                                    {/* Transportation to next stop */}
                                    {index < stops.length - 1 && (
                                        <div className="border-t border-[#E8E3D8] pt-4">
                                            <label
                                                htmlFor={`travel-mode-${stop.id}`}
                                                className="mb-2 block text-sm font-semibold text-[#34483B]"
                                            >
                                                Getting to {stops[index + 1].name || `Stop ${index + 2}`}
                                            </label>

                                            <select
                                                id={`travel-mode-${stop.id}`}
                                                value={
                                                    legModes[getLegKey(stop.id, stops[index + 1].id)]
                                                    ?? "automatic"
                                                }
                                                onChange={(event) => {
                                                    const legKey = getLegKey(
                                                        stop.id,
                                                        stops[index + 1].id
                                                    );

                                                    setLegModes((previous) => ({
                                                        ...previous,
                                                        [legKey]: event.target.value as TravelMode,
                                                    }));
                                                }}
                                                className="w-full rounded-lg border border-[#E8E3D8] bg-white px-4 py-3 text-sm text-[#34483B]"
                                            >
                                                <option value="automatic">Automatic</option>
                                                <option value="walking">Walking</option>
                                                <option value="driving">Driving</option>
                                                <option value="cycling">Cycling</option>
                                                <option value="transit">Public transit</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add stop */}
                        <button
                            type="button"
                            onClick={addStop}
                            className="mt-5 w-full rounded-xl border border-dashed border-[#C97955] py-3 text-sm font-medium text-[#C97955] transition hover:bg-[#FBF4EF]"
                        >
                            + Add another stop
                        </button>
                    </section>

                    {/* Save */}
                    <div className="flex flex-col items-end gap-2">
                        {saveStatus && (
                            <p className="text-sm text-[#71816E]">
                                {saveStatus}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={!title.trim()}
                            className="rounded-xl bg-[#C97955] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B66B48] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Save itinerary
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
