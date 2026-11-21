"use client";

import { useState } from "react";

// type Itinerary = {
//     id: string;
//     title: string;
//     description: string;
//     location: string;
//     travel_date: string;
//     created: string;
//     last_updated: string;
//     published: boolean;
// };

type Stop = {
    id: string;
    itinerary_id: string;
    name: string;
    description: string;
    location: string;
    time: string;
    position_in_itinerary: number;
};

// export default function CreatePage() {
//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");
//     const [location, setLocation] = useState("Boston, MA");
//     const [travelDate, setTravelDate] = useState("");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [statusMessage, setStatusMessage] = useState<{
//         type: "success" | "error";
//         text: string;
//     } | null>(null);

export default function CreatePage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [stops, setStops] = useState<Stop[]>([{
        id: crypto.randomUUID(),
        itinerary_id: "",
        name: "",
        description: "",
        location: "",
        time: "",
        position_in_itinerary: 1,
    }]);

    function addStop() {
        setStops((prevStops) => [...prevStops, {
            id: crypto.randomUUID(),
            itinerary_id: "",
            name: "",
            description: "",
            location: "",
            time: "",
            position_in_itinerary: prevStops.length + 1,
        }]);
    }

    function removeStop(id: string) {
        setStops((prevStops) =>
            prevStops.filter((stop) => stop.id !== id).map((stop, index) =>
                ({ ...stop, position_in_itinerary: index + 1, })));
    }

    function updateStop(
        id: string,
        field: "name" | "description" | "location" | "time",
        value: string
    ) {
        setStops((prevStops) => prevStops.map((stop) =>
            stop.id === id ? { ...stop, [field]: value } : stop));
    }


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
            title,
            description: "Boston",
            location,
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

    // // placeholder for now
    // function handlePublish() {
    //     const itinerary = {
    //         title,
    //         description,
    //         stops,
    //     };

    //     console.log("Itinerary:", itinerary);

    //     alert("Your itinerary is ready to publish!");
    // }

    return (
        <main className="min-h-screen bg-[#FAF9F6] px-6 py-12">
            <div className="mx-auto max-w-3xl">

                {/* Header */}
                <div className="mb-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-600">
                        Fork My Boston
                    </p>

                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        Customize your adventure.
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Put together a day worth sharing.
                    </p>
                </div>

                {/* Itinerary details */}
                <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        The basic details
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Itinerary name
                            </label>

                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. A perfect Saturday in Boston"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Description
                            </label>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's the vibe? Who is this itinerary for? What's happening?"
                                rows={4}
                                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>
                </section>

                {/* Stops */}
                <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Your stops
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Build your itinerary, one place at a time.
                            </p>
                        </div>

                        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                            {stops.length} {stops.length === 1 ? "stop" : "stops"}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {stops.map((stop, index) => (
                            <div
                                key={stop.id}
                                className="rounded-xl border border-gray-200 p-5"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-orange-600">
                                        STOP {index + 1}
                                    </span>

                                    {stops.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeStop(stop.id)}
                                            className="text-sm text-gray-400 transition hover:text-red-500"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={stop.name}
                                        onChange={(e) =>
                                            updateStop(stop.id, "name", e.target.value)
                                        }
                                        placeholder="Where are you going?"
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                                    />

                                    <input
                                        value={stop.location}
                                        onChange={(e) =>
                                            updateStop(stop.id, "location", e.target.value)
                                        }
                                        placeholder="Address or neighborhood (optional)"
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                                    />

                                    <input
                                        value={stop.time}
                                        onChange={(e) =>
                                            updateStop(stop.id, "time", e.target.value)
                                        }
                                        placeholder="Arrival time (e.g. 10:00 AM)"
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                                    />

                                    <input
                                        value={stop.description}
                                        onChange={(e) =>
                                            updateStop(stop.id, "description", e.target.value)
                                        }
                                        placeholder="What will you do here? (optional)"
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addStop}
                        className="mt-5 w-full rounded-xl border border-dashed border-orange-300 py-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                    >
                        + Add another stop
                    </button>
                </section>

                {/* Publish */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handlePublish}
                        className="rounded-xl bg-orange-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-700"
                    >
                        Publish itinerary →
                    </button>
                </div>

            </div>
        </main>
    );
}
