"use client";

import { useEffect, useRef } from "react";
import {
    Map as MapLibreMap,
    Marker,
    Popup,
    NavigationControl,
    LngLatBounds,
    setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type MapStop = {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
};

type ItineraryMapProps = {
    stops: MapStop[];
};

export default function ItineraryMap({ stops }: ItineraryMapProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markersRef = useRef<Marker[]>([]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new MapLibreMap({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty",
            center: [-71.0589, 42.3601],
            zoom: 12,
        });

        mapRef.current = map;

        map.addControl(new NavigationControl(), "top-right");
        map.on("load", () => {
            console.log(
                "POI layers:",
                map.getStyle().layers
                    ?.filter((layer) => layer.id.includes("poi"))
                    .map((layer) => layer.id)
            );
        });

        // Click on things
        map.on("click", (event) => {
            const features = map.queryRenderedFeatures(event.point);

            console.log("Clicked features:", features);

            const feature = features.find(
                (item) =>
                    item.sourceLayer === "poi" &&
                    (
                        typeof item.properties?.name === "string" ||
                        typeof item.properties?.["name:en"] === "string"
                    )
            );

            if (!feature) {
                console.log("No named business found at this location.");
                return;
            }

            const properties = feature.properties ?? {};

            const name =
                properties.name ||
                properties["name:en"];

            const category =
                properties.class ||
                properties.subclass ||
                "Place";

            console.log("Selected business:", name, category);

            new Popup({
                offset: 12,
                closeButton: true,
            })
                .setLngLat(event.lngLat)
                .setText(`${name} · ${category}`)
                .addTo(map);
        });

        map.on("error", (event) => {
            console.error("Map error:", event.error);
        });

        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update itinerary markers
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        const locatedStops = stops.filter(
            (stop) =>
                stop.latitude !== null &&
                stop.longitude !== null
        );

        if (locatedStops.length === 0) return;

        const bounds = new LngLatBounds();

        locatedStops.forEach((stop, index) => {
            const coordinates: [number, number] = [
                stop.longitude!,
                stop.latitude!,
            ];

            const marker = new Marker({
                color: "#34483B",
            })
                .setLngLat(coordinates)
                .setPopup(
                    new Popup({ offset: 25 }).setText(
                        stop.name || `Stop ${index + 1}`
                    )
                )
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
    }, [stops]);

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E8E3D8]">
            <div
                ref={mapContainer}
                style={{
                    height: "500px",
                    width: "100%",
                    minHeight: "350px",
                    position: "relative",
                }}
            />
        </div>
    );
}
