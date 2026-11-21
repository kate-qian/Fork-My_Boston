"use client";

import { useState } from "react";
import PlaceSearch, { type SelectedPlace, } from "../../components/PlaceSearch";
import ItineraryMap from "../../components/ItineraryMap";

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

export default function CreatePage() {
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

    const addStop = () => {setStops((prevStops) => [...prevStops, {
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

    const removeStop = (id: string) => {setStops((prevStops) =>
        prevStops.filter((stop) => stop.id !== id).map((stop, index) => 
        ({...stop, position_in_itinerary: index + 1, })));
    };

    const updateStop = (id: string, field: "name" | "description" | "location" | "time", value: string) => {
        setStops((prevStops) => prevStops.map((stop) => stop.id === id ? {
            ...stop,
            [field]: value,
            ...(field === "name" || field === "location" ? {
                latitude: null,
                longitude: null,
                place_id: null,
            } : {})} : stop));
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
            longitude: place.longitude, } : stop));
    };

    const moveStop = (index: number, direction: -1 | 1) => {
        setStops((prevStops) => {
            const newStops = [...prevStops];
            const newIndex = index + direction;

            if (newIndex < 0 || newIndex >= newStops.length) {
                return prevStops;
            }

            [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];

            return newStops.map((stop, i) => ({...stop, position_in_itinerary: i + 1,}));
        });
    };

    // TODO: replace this placeholder at some point
    const handlePublish = () => {
        console.log({
            title,
            description,
            stops,
        });

        alert("Your itinerary is ready to publish!");
    };

    return (
    <main className="min-h-screen bg-[#F7F5EF] px-6 py-10">
        <div className="mx-auto max-w-3xl">
        {/* Navigation */}
        <nav className="border-b border-[#E8E3D8] px-6 py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
            <a href="/" className="font-serif text-2xl font-bold tracking-tight">
                create a new itinerary<span className="text-[#C97955]">.</span>
            </a>
            </div>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-[#E8E3D8] pb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#C97955]">
            Fork My Boston
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#292D27]">
            Create an itinerary
            </h1>

            <p className="mt-2 text-sm text-[#929187]">
            Put together your favorite places and share your
            perfect Boston day.
            </p>
        </header>

        <div className="space-y-8">

            {/* Basic itinerary information */}
            <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#292D27]">
                The basics
            </h2>

            <div className="space-y-5">
                <div>
                <label className="mb-2 block text-sm font-medium text-[#55594F]">
                    Itinerary title
                </label>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. A perfect Saturday in Boston"
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
                    placeholder="Tell people a little about your itinerary..."
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
                    Your stops
                </h2>

                <p className="mt-1 text-sm text-[#929187]">
                    Add the places you want to visit, in order.
                </p>
                </div>

                <span className="rounded-full bg-[#F7F5EF] px-3 py-1 text-sm font-medium text-[#C97955]">
                {stops.length} stops
                </span>
            </div>

            {/* Interactive map */}
            <div className="mb-6">
                <ItineraryMap
                stops={stops.map((stop) => ({
                    id: stop.id,
                    name: stop.name,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                }))}
                />
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
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        stop.input_mode === "search"
                            ? "bg-[#34483B] text-white"
                            : "bg-[#F0EDE7] text-[#55594F] hover:bg-[#E8E3D8]"
                        }`}
                    >
                        Search places
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                        updateStopMode(stop.id, "manual")
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        stop.input_mode === "manual"
                            ? "bg-[#34483B] text-white"
                            : "bg-[#F0EDE7] text-[#55594F] hover:bg-[#E8E3D8]"
                        }`}
                    >
                        Enter manually
                    </button>
                    </div>

                    {/* Place input */}
                    <div className="space-y-4">

                    {stop.input_mode === "search" ? (
                        <div>
                        <label className="mb-2 block text-sm font-medium text-[#55594F]">
                            Find a place
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
                            placeholder="e.g. Boston Public Garden"
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

            {/* Publish */}
            <div className="flex justify-end">
            <button
                type="button"
                onClick={handlePublish}
                disabled={!title.trim()}
                className="rounded-xl bg-[#C97955] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B66B48] disabled:cursor-not-allowed disabled:opacity-50"
            >
                Publish itinerary →
            </button>
            </div>
        </div>
        </div>
    </main>
    );
}
