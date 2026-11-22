"use client";

import { useEffect, useRef } from "react";
import {
    Map as MapLibreGL,
    Marker,
    Popup,
    NavigationControl,
    LngLatBounds,
    setWorkerUrl,
    type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TravelMode } from "@/lib/storage";


setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type MapStop = {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
};

type MapPlace = {
    name: string;
    category: string;
    latitude: number;
    longitude: number;
};

type ItineraryMapProps = {
    stops: MapStop[];
    legModes: Record<string, TravelMode>;
    onAddStop: (place: MapPlace) => void;
};

function getLegKey(fromStopId: string, toStopId: string) {
    return `${fromStopId}->${toStopId}`;
}

function getDistanceKm(
    a: MapStop,
    b: MapStop
): number {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;

    const lat1 = toRadians(a.latitude!);
    const lat2 = toRadians(b.latitude!);
    const deltaLat = toRadians(b.latitude! - a.latitude!);
    const deltaLon = toRadians(b.longitude! - a.longitude!);

    const h =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;

    return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function resolveTravelMode(
    selectedMode: TravelMode,
    distanceKm: number
): Exclude<TravelMode, "automatic"> {
    if (selectedMode !== "automatic") {
        return selectedMode;
    }

    if (distanceKm < 1.2) return "walking";
    if (distanceKm < 4) return "cycling";

    return "transit";
}

function estimateTravelMinutes(
    distanceKm: number,
    mode: Exclude<TravelMode, "automatic">
): number {
    const estimates: Record<
        Exclude<TravelMode, "automatic">,
        number
    > = {
        walking: Math.max(2, Math.round(distanceKm * 1.3 / 4.8 * 60)),
        cycling: Math.max(3, Math.round(distanceKm * 1.2 / 15 * 60)),
        driving: Math.max(3, Math.round(distanceKm * 1.4 / 25 * 60 + 3)),
        transit: Math.max(5, Math.round(distanceKm * 1.5 / 20 * 60 + 8)),
    };

    return estimates[mode];
}

function getModeColor(
    mode: Exclude<TravelMode, "automatic">
) {
    const colors = {
        walking: "#4B8A6A",
        driving: "#C97955",
        cycling: "#D6A545",
        transit: "#6685B5",
    };

    return colors[mode];
}

function getModeLabel(
    mode: Exclude<TravelMode, "automatic">
) {
    const labels = {
        walking: "Walking",
        driving: "Driving",
        cycling: "Cycling",
        transit: "Public transit",
    };

    return labels[mode];
}

function createBusinessPopup(
    name: string,
    category: string,
    latitude: number,
    longitude: number,
    alreadyAdded: boolean,
    onAdd: () => void
) {
    const container = document.createElement("div");

    container.style.width = "220px";
    container.style.maxWidth = "calc(100vw - 48px)";
    container.style.padding = "0";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.color = "#34483B";
    container.style.padding = "4px 2px";

    // Category descriptions
    const descriptions: Record<string, string> = {
        Cafe: "A spot to grab coffee, enjoy a pastry, or spend some time relaxing.",
        Restaurant: "Explore the menu, atmosphere, and what diners have to say.",
        Bar: "A place to unwind, catch up with friends, or enjoy a night out.",
        Bakery: "Discover fresh pastries, baked goods, and local favorites.",
        Shop: "A local spot worth exploring while you're in the neighborhood.",
        Place: "Discover more about this spot and see what visitors think.",
    };

    const summary =
        descriptions[category] ||
        `Explore this ${category.toLowerCase()} and see what makes it worth a visit.`;

    // Category label
    const label = document.createElement("div");
    label.textContent = category.toUpperCase();
    label.style.fontSize = "10px";
    label.style.fontWeight = "700";
    label.style.letterSpacing = "1.5px";
    label.style.color = "#C97955";
    label.style.marginBottom = "7px";

    // Business name
    const heading = document.createElement("h3");
    heading.textContent = name;
    heading.style.fontSize = "16px";
    heading.style.fontWeight = "700";
    heading.style.lineHeight = "1.3";
    heading.style.margin = "0 0 4px";
    heading.style.color = "#34483B";

    // Location
    const location = document.createElement("div");
    location.textContent = "⌖ Boston, Massachusetts";
    location.style.fontSize = "12px";
    location.style.color = "#85877D";
    location.style.marginBottom = "13px";

    // Summary
    const summaryBox = document.createElement("div");
    summaryBox.textContent = summary;
    summaryBox.style.background = "#F7F5EF";
    summaryBox.style.borderRadius = "10px";
    summaryBox.style.padding = "8px 10px";
    summaryBox.style.fontSize = "12px";
    summaryBox.style.lineHeight = "1.4";
    summaryBox.style.color = "#62685D";
    summaryBox.style.marginBottom = "14px";

    // Add to itinerary button
    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.textContent = alreadyAdded
        ? "✓ Already added"
        : "+ Add to itinerary";

    addButton.disabled = alreadyAdded;

    addButton.style.width = "100%";
    addButton.style.padding = "10px";
    addButton.style.marginBottom = "14px";
    addButton.style.borderRadius = "8px";
    addButton.style.background = alreadyAdded ? "#E8EDE7" : "#34483B";
    addButton.style.color = alreadyAdded ? "#71816E" : "white";
    addButton.style.fontSize = "13px";
    addButton.style.fontWeight = "600";
    addButton.style.cursor = alreadyAdded ? "default" : "pointer";

    addButton.addEventListener("click", () => {
        onAdd();
        addButton.textContent = "✓ Added to itinerary";
        addButton.disabled = true;
        addButton.style.background = "#E8EDE7";
        addButton.style.color = "#71816E";
        addButton.style.cursor = "default";
    });

    // Links
    const googleUrl = new URL(
        "https://www.google.com/maps/search/"
    );
    googleUrl.searchParams.set("api", "1");
    googleUrl.searchParams.set(
        "query",
        `${name}, ${latitude}, ${longitude}`
    );

    const yelpUrl = new URL(
        "https://www.yelp.com/search"
    );
    yelpUrl.searchParams.set("find_desc", name);
    yelpUrl.searchParams.set("find_loc", "Boston, MA");

    const linksHeading = document.createElement("div");
    linksHeading.style.fontSize = "10px";
    linksHeading.style.fontWeight = "700";
    linksHeading.style.letterSpacing = "1px";
    linksHeading.style.color = "#85877D";
    linksHeading.style.marginBottom = "6px";

    function createLink(
        label: string,
        url: string
    ) {
        const link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label + " ↗";

        link.style.display = "flex";
        link.style.alignItems = "center";
        link.style.justifyContent = "space-between";
        link.style.padding = "6px 0";
        link.style.borderTop = "1px solid #EEEAE1";
        link.style.border = "none";
        link.style.borderTop = "none";
        link.style.borderBottom = "none";
        link.style.color = "#34483B";
        link.style.fontSize = "13px";
        link.style.fontWeight = "600";
        link.style.textDecoration = "none";

        link.addEventListener("mouseenter", () => {
            link.style.color = "#C97955";
        });

        link.addEventListener("mouseleave", () => {
            link.style.color = "#34483B";
        });

        return link;
    }

    const googleLink = createLink(
        "Google Reviews",
        googleUrl.toString()
    );

    const yelpLink = createLink(
        "Yelp Reviews",
        yelpUrl.toString()
    );

    container.append(
        label,
        heading,
        location,
        summaryBox,
        addButton,
        linksHeading,
        googleLink,
        yelpLink
    );

    return new Popup({
        offset: 12,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
        className: "business-popup",
    }).setDOMContent(container);
}

export default function ItineraryMap({ stops, legModes, onAddStop, }: ItineraryMapProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreGL | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const legMarkersRef = useRef<Marker[]>([]);
    const activeLegPopupRef = useRef<Popup | null>(null);
    const activeBusinessPopupRef = useRef<Popup | null>(null);
    const stopsRef = useRef(stops);
    const onAddStopRef = useRef(onAddStop);

    stopsRef.current = stops;
    onAddStopRef.current = onAddStop;

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new MapLibreGL({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: [-71.0589, 42.3601],
            zoom: 12,
            minZoom: 10,
            maxZoom: 18,
            maxBounds: [
                [-71.25, 42.20],
                [-70.90, 42.45],
            ],
        });

        mapRef.current = map;

        map.addControl(new NavigationControl(), "top-right");

                map.on("load", () => {
            console.log("Map loaded successfully");

            // Add the route line source.
            map.addSource("itinerary-route", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [],
                },
            });

            // Add the route line underneath map labels.
            const firstSymbolLayer = map.getStyle().layers?.find(
                (layer) => layer.type === "symbol"
            )?.id;

            map.addLayer({
                id: "itinerary-route-line",
                type: "line",
                source: "itinerary-route",
                layout: {
                    "line-cap": "round",
                    "line-join": "round",
                },
                paint: {
                    "line-color": [
                        "match",
                        ["get", "mode"],
                        "walking", "#4B8A6A",
                        "driving", "#C97955",
                        "cycling", "#D6A545",
                        "transit", "#6685B5",
                        "#929187",
                    ],
                    "line-width": 4,
                    "line-opacity": 0.9,
                },
            },
            firstSymbolLayer
        );

            console.log(
                "POI layers:",
                map.getStyle().layers
                    ?.filter((layer) => layer.id.includes("poi"))
                    .map((layer) => layer.id)
            );
        });

        // Click on businesses
        map.on("click", (event) => {
            activeLegPopupRef.current?.remove();
            activeLegPopupRef.current = null;
            const features = map.queryRenderedFeatures(event.point);

            const feature = features.find(
                (item) =>
                    item.sourceLayer === "poi" &&
                    (
                        typeof item.properties?.name === "string" ||
                        typeof item.properties?.["name:en"] === "string"
                    )
            );

            if (!feature) return;

            const properties = feature.properties ?? {};

            const name =
                properties.name ||
                properties["name:en"];

            const rawCategory =
                properties.class ||
                properties.subclass ||
                "Place";

            const category = String(rawCategory)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());

            console.log("Selected business:", name, category);

            const alreadyAdded = stopsRef.current.some((stop) =>
                stop.name.trim().toLowerCase() === String(name).trim().toLowerCase() &&
                stop.latitude !== null &&
                stop.longitude !== null &&
                Math.abs(stop.latitude - event.lngLat.lat) < 0.0005 &&
                Math.abs(stop.longitude - event.lngLat.lng) < 0.0005
            );

            activeLegPopupRef.current?.remove();
            activeLegPopupRef.current = null;

            activeBusinessPopupRef.current?.remove();

            const businessPopup = createBusinessPopup(
                String(name),
                category,
                event.lngLat.lat,
                event.lngLat.lng,
                alreadyAdded,
                () => {
                    onAddStopRef.current({
                        name: String(name),
                        category,
                        latitude: event.lngLat.lat,
                        longitude: event.lngLat.lng,
                    });
                }
            )
                .setLngLat(event.lngLat)
                .addTo(map);

            activeBusinessPopupRef.current = businessPopup;

            businessPopup.on("close", () => {
                if (activeBusinessPopupRef.current === businessPopup) {
                    activeBusinessPopupRef.current = null;
                }
            });
               
        });

        map.on("error", (event) => {
            console.error("Map error:", event.error);
        });

        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];

            legMarkersRef.current.forEach((marker) => marker.remove());
            legMarkersRef.current = [];

            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update itinerary markers and transportation legs
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const updateMarkers = () => {
            activeLegPopupRef.current?.remove();
            activeLegPopupRef.current = null;
            activeBusinessPopupRef.current = null;

            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];

            legMarkersRef.current.forEach((marker) => marker.remove());
            legMarkersRef.current = [];

            const locatedStops = stops.filter(
                (stop) =>
                    stop.latitude !== null &&
                    stop.longitude !== null
            );

            const legFeatures = [];

            for (let i = 0; i < stops.length - 1; i++) {
                const from = stops[i];
                const to = stops[i + 1];

                if (
                    from.latitude === null ||
                    from.longitude === null ||
                    to.latitude === null ||
                    to.longitude === null
                ) {
                    continue;
                }

                const distanceKm = getDistanceKm(from, to);

                const selectedMode =
                    legModes[getLegKey(from.id, to.id)] ?? "automatic";

                const mode = resolveTravelMode(
                    selectedMode,
                    distanceKm
                );

                const estimatedMinutes = estimateTravelMinutes(
                    distanceKm,
                    mode
                );

                legFeatures.push({
                    type: "Feature" as const,
                    properties: {
                        mode,
                        minutes: estimatedMinutes,
                    },
                    geometry: {
                        type: "LineString" as const,
                        coordinates: [
                            [from.longitude, from.latitude],
                            [to.longitude, to.latitude],
                        ],
                    },
                });

                const midpoint: [number, number] = [
                    (from.longitude + to.longitude) / 2,
                    (from.latitude + to.latitude) / 2,
                ];

                const color = getModeColor(mode);

                const dot = document.createElement("button");

                dot.type = "button";
                dot.title = `${getModeLabel(mode)} · ${estimatedMinutes} min`;

                dot.style.width = "16px";
                dot.style.height = "16px";
                dot.style.borderRadius = "50%";
                dot.style.background = color;
                dot.style.border = "3px solid white";
                dot.style.boxShadow = "0 1px 6px rgba(0,0,0,0.3)";
                dot.style.cursor = "pointer";

                // Create transportation popup content
                const popupContent = document.createElement("div");

                popupContent.style.width = "220px";
                popupContent.style.maxWidth = "100%";
                popupContent.style.boxSizing = "border-box";
                popupContent.style.overflowWrap = "anywhere";
                popupContent.style.padding = "4px 2px";
                popupContent.style.fontFamily = "Arial, sans-serif";
                popupContent.style.color = "#34483B";

                const categoryLabel = document.createElement("div");
                categoryLabel.textContent = "TRANSPORTATION";
                categoryLabel.style.fontSize = "10px";
                categoryLabel.style.fontWeight = "700";
                categoryLabel.style.letterSpacing = "1.5px";
                categoryLabel.style.color = "#C97955";
                categoryLabel.style.marginBottom = "7px";

                const heading = document.createElement("h3");
                heading.textContent = getModeLabel(mode);
                heading.style.fontSize = "16px";
                heading.style.fontWeight = "700";
                heading.style.lineHeight = "1.3";
                heading.style.margin = "0 0 4px";
                heading.style.color = "#34483B";

                const routeLabel = document.createElement("div");
                routeLabel.textContent =
                    `${from.name || "Stop"} → ${to.name || "Stop"}`;
                routeLabel.style.fontSize = "12px";
                routeLabel.style.color = "#85877D";
                routeLabel.style.marginBottom = "13px";

                const summaryBox = document.createElement("div");
                summaryBox.style.background = "#F7F5EF";
                summaryBox.style.borderRadius = "10px";
                summaryBox.style.padding = "10px";
                summaryBox.style.marginBottom = "12px";

                const timeLabel = document.createElement("div");
                timeLabel.textContent = `Approximately ${estimatedMinutes} min`;
                timeLabel.style.fontSize = "14px";
                timeLabel.style.fontWeight = "700";
                timeLabel.style.color = "#34483B";

                const distanceLabel = document.createElement("div");
                distanceLabel.textContent =
                    `${distanceKm.toFixed(1)} km straight-line distance`;
                distanceLabel.style.fontSize = "11px";
                distanceLabel.style.color = "#85877D";
                distanceLabel.style.marginTop = "5px";

                summaryBox.append(timeLabel, distanceLabel);

                const estimateNote = document.createElement("div");
                estimateNote.textContent = "Approximate travel estimate";
                estimateNote.style.fontSize = "10px";
                estimateNote.style.color = "#929187";

                popupContent.append(
                    categoryLabel,
                    heading,
                    routeLabel,
                    summaryBox,
                    estimateNote
                );

                // Create a single active popup for transportation markers.
                dot.addEventListener("click", (event) => {
                    event.stopPropagation();

                    // Close any previously opened transportation popup.
                    activeLegPopupRef.current?.remove();

                    const popup = new Popup({
                        offset: 12,
                        closeButton: true,
                        closeOnClick: false,
                        maxWidth: "260px",
                        className: "transport-popup",
                    })
                        .setLngLat(midpoint)
                        .setDOMContent(popupContent)
                        .addTo(map);

                    activeLegPopupRef.current = popup;

                    popup.on("close", () => {
                        if (activeLegPopupRef.current === popup) {
                            activeLegPopupRef.current = null;
                        }
                    });
                });

                const legMarker = new Marker({
                    element: dot,
                    anchor: "center",
                })
                    .setLngLat(midpoint)
                    .addTo(map);

                legMarker.getElement().style.zIndex = "10";

                legMarkersRef.current.push(legMarker);
            }

            const routeSource = map.getSource(
                "itinerary-route"
            ) as GeoJSONSource | undefined;

            if (routeSource) {
                routeSource.setData({
                    type: "FeatureCollection",
                    features: legFeatures,
                });
            }

            if (locatedStops.length === 0) return;

            const bounds = new LngLatBounds();

            stops.forEach((stop, index) => {
                if (
                    stop.latitude === null ||
                    stop.longitude === null
                ) {
                    return;
                }

                const coordinates: [number, number] = [
                    stop.longitude,
                    stop.latitude,
                ];

                const markerElement = document.createElement("div");

                markerElement.textContent = String(index + 1);
                markerElement.style.width = "34px";
                markerElement.style.height = "34px";
                markerElement.style.borderRadius = "50%";
                markerElement.style.background = "#34483B";
                markerElement.style.color = "#FFFFFF";
                markerElement.style.border = "3px solid white";
                markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
                markerElement.style.display = "flex";
                markerElement.style.alignItems = "center";
                markerElement.style.justifyContent = "center";
                markerElement.style.fontSize = "14px";
                markerElement.style.fontWeight = "700";

                const marker = new Marker({
                    element: markerElement,
                    anchor: "bottom",
                })
                    .setLngLat(coordinates)
                    .addTo(map);

                markersRef.current.push(marker);
                bounds.extend(coordinates);
            });

            if (locatedStops.length === 1) {
                map.flyTo({
                    center: [
                        locatedStops[0].longitude!,
                        locatedStops[0].latitude!,
                    ],
                    zoom: 15,
                });
            } else {
                map.fitBounds(bounds, {
                    padding: 60,
                    maxZoom: 15,
                    duration: 800,
                });
            }
        };

        if (map.isStyleLoaded()) {
            updateMarkers();
        } else {
            map.once("load", updateMarkers);
        }

        return () => {
            map.off("load", updateMarkers);
        };
    }, [stops, legModes]);

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E8E3D8]">
            <div
                ref={mapContainer}
                style={{
                    height: "650px",
                    width: "100%",
                    minHeight: "350px",
                    position: "relative",
                }}
            />
        </div>
    );
}
