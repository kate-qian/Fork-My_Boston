
export type CoordinateStop = {
    latitude: number | null;
    longitude: number | null;
};

export type RouteOptimizationResult<T> = {
    stops: T[];
    originalDistanceKm: number;
    optimizedDistanceKm: number;
    improved: boolean;
};

const EARTH_RADIUS_KM = 6371;

// Calculate the straight-line distance between two coordinates.
function haversineDistance(
    a: CoordinateStop,
    b: CoordinateStop
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

    return 2 * EARTH_RADIUS_KM *
        Math.asin(Math.sqrt(h));
}

// Total distance along an open route (no return to the start).
function calculateRouteDistance<T extends CoordinateStop>(
    route: T[]
): number {
    let total = 0;

    for (let i = 0; i < route.length - 1; i++) {
        total += haversineDistance(route[i], route[i + 1]);
    }

    return total;
}

// Generate an initial route by repeatedly choosing the nearest stop.
function nearestNeighbor<T extends CoordinateStop>(
    stops: T[]
): T[] {
    if (stops.length <= 2) return [...stops];

    const unvisited = new Set(
        Array.from({ length: stops.length - 1 }, (_, i) => i + 1)
    );

    const route = [stops[0]];

    while (unvisited.size > 0) {
        const current = route[route.length - 1];

        let nearestIndex = -1;
        let shortestDistance = Infinity;

        for (const index of unvisited) {
            const distance = haversineDistance(current, stops[index]);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestIndex = index;
            }
        }

        route.push(stops[nearestIndex]);
        unvisited.delete(nearestIndex);
    }

    return route;
}

// Improve the route by reversing segments that shorten the journey.
function twoOpt<T extends CoordinateStop>(
    initialRoute: T[]
): T[] {
    const route = [...initialRoute];

    if (route.length <= 3) return route;

    let improved = true;

    while (improved) {
        improved = false;

        for (let i = 1; i < route.length - 1; i++) {
            for (let k = i + 1; k < route.length; k++) {
                const a = route[i - 1];
                const b = route[i];
                const c = route[k];
                const d = route[k + 1];

                const oldDistance =
                    haversineDistance(a, b) +
                    (d ? haversineDistance(c, d) : 0);

                const newDistance =
                    haversineDistance(a, c) +
                    (d ? haversineDistance(b, d) : 0);

                if (newDistance < oldDistance - 0.000001) {
                    const reversed = route
                        .slice(i, k + 1)
                        .reverse();

                    route.splice(i, k - i + 1, ...reversed);
                    improved = true;
                }
            }
        }
    }

    return route;
}

// Main function: optimize located stops while preserving unlocated slots.
export function optimizeStopOrder<T extends CoordinateStop>(
    stops: T[]
): RouteOptimizationResult<T> {
    const locatedIndices = stops.flatMap((stop, index) =>
        stop.latitude !== null &&
        stop.longitude !== null &&
        Number.isFinite(stop.latitude) &&
        Number.isFinite(stop.longitude)
            ? [index]
            : []
    );

    const locatedStops = locatedIndices.map(
        (index) => stops[index]
    );

    const originalDistanceKm =
        calculateRouteDistance(locatedStops);

    if (locatedStops.length <= 2) {
        return {
            stops: [...stops],
            originalDistanceKm,
            optimizedDistanceKm: originalDistanceKm,
            improved: false,
        };
    }

    const initialRoute = nearestNeighbor(locatedStops);
    const candidateRoute = twoOpt(initialRoute);
    const candidateDistance =
        calculateRouteDistance(candidateRoute);

    // Never replace the original order with a worse route.
    const improved = candidateDistance < originalDistanceKm - 0.001;

    const bestRoute = improved
        ? candidateRoute
        : locatedStops;

    const result = [...stops];

    // Replace only the positions occupied by geographically located stops.
    locatedIndices.forEach((originalIndex, routeIndex) => {
        result[originalIndex] = bestRoute[routeIndex];
    });

    return {
        stops: result,
        originalDistanceKm,
        optimizedDistanceKm: improved
            ? candidateDistance
            : originalDistanceKm,
        improved,
    };
}

export type TransportationSuggestion = {
    mode: "Walk" | "Bike" | "MBTA";
    distanceKm: number;
    estimatedMinutes?: number;
    note: string;
};

export function suggestTransportation(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
): TransportationSuggestion {
    const distanceKm = haversineDistance(a, b);

    // Short trips: walking is usually the simplest option.
    if (distanceKm < 1.2) {
        const estimatedMinutes = Math.max(
            2,
            Math.round((distanceKm * 1.3 / 4.8) * 60)
        );

        return {
            mode: "Walk",
            distanceKm,
            estimatedMinutes,
            note: "A short walk is likely the easiest option.",
        };
    }

    // Medium trips: biking may be convenient.
    if (distanceKm < 4) {
        const estimatedMinutes = Math.max(
            3,
            Math.round((distanceKm * 1.2 / 15) * 60)
        );

        return {
            mode: "Bike",
            distanceKm,
            estimatedMinutes,
            note: "Consider biking between these neighborhoods.",
        };
    }

    // Longer trips: suggest checking actual transit directions.
    return {
        mode: "MBTA",
        distanceKm,
        note: "Check the MBTA for available routes and current service.",
    };
}
