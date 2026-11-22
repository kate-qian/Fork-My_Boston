import { fetchBostonPlaces } from "../lib/knowledge/connectors/openstreetmap";
import { enrichPlacesWithNeighborhoods } from "../lib/knowledge/enrichment";
import { fetchBostonNeighborhoods, findNeighborhood, assignNeighborhood, } from "../lib/knowledge/neighborhoods";
import {
  fetchBostonMunicipalBoundary,
  isInsideBoston,
} from "../lib/knowledge/municipality";

async function main() {
  console.log("\n======================================");
  console.log("     BOSTON KNOWLEDGE PIPELINE TEST");
  console.log("======================================\n");

  // --------------------------------------
  // 0. HELPERS
  // --------------------------------------
  function getCoordinateBounds(
    coordinates: unknown
    ): {
    minLongitude: number;
    maxLongitude: number;
    minLatitude: number;
    maxLatitude: number;
    positionCount: number;
    } {
    const positions: number[][] = [];

    function collect(value: unknown): void {
        if (!Array.isArray(value)) return;

        if (
        value.length >= 2 &&
        typeof value[0] === "number" &&
        typeof value[1] === "number"
        ) {
        positions.push(value);
        return;
        }

        for (const item of value) {
        collect(item);
        }
    }

    collect(coordinates);

    return {
        minLongitude: Math.min(...positions.map((p) => p[0])),
        maxLongitude: Math.max(...positions.map((p) => p[0])),
        minLatitude: Math.min(...positions.map((p) => p[1])),
        maxLatitude: Math.max(...positions.map((p) => p[1])),
        positionCount: positions.length,
    };
    }

  // --------------------------------------
  // 1. FETCH SOURCE DATA
  // --------------------------------------

  console.log("1. Fetching source data...\n");

  const places = await fetchBostonPlaces({
    category: "cafe",
    limit: 50,
  });

  const neighborhoods = await fetchBostonNeighborhoods();
  const municipalBoundary = await fetchBostonMunicipalBoundary();

  console.log("\nMunicipal boundary geometry:");

    console.log(
    getCoordinateBounds(
        municipalBoundary.features[0].geometry.coordinates
    )
    );

  console.log(`Cafes fetched: ${places.length}`);
  console.log(
    `Neighborhoods loaded: ${neighborhoods.features.length}`
  );
  console.log(
    `Municipal boundary features: ${municipalBoundary.features.length}`
  );

  // --------------------------------------
  // 2. TEST KNOWN NEIGHBORHOOD MATCHES
  // --------------------------------------

  console.log("\n2. Testing known neighborhood matches...\n");

  const knownPlaces = [
    {
      name: "Flour",
      latitude: 42.3384778,
      longitude: -71.0745113,
    },
    {
      name: "Render Coffee",
      latitude: 42.3410968,
      longitude: -71.0814336,
    },
    {
      name: "Emmi Bakery and Cafe",
      latitude: 42.3713805,
      longitude: -71.0611746,
    },
    {
      name: "Dine Boston Café",
      latitude: 42.3699588,
      longitude: -71.0196218,
    },
    {
      name: "Thinking Cup",
      latitude: 42.3536887,
      longitude: -71.0638884,
    },
  ];

  console.table(
    knownPlaces.map((place) => ({
      name: place.name,
      neighborhood:
        findNeighborhood(
          place.longitude,
          place.latitude,
          neighborhoods
        )?.name ?? "Unknown",
    }))
  );

  // --------------------------------------
  // 3. TEST MUNICIPAL BOUNDARY INDEPENDENTLY
  // --------------------------------------

  console.log("\n3. Testing Boston municipal boundary...\n");

  const boundaryTestPlaces = [
    {
      name: "Flour",
      latitude: 42.3384778,
      longitude: -71.0745113,
    },
    {
      name: "Render Coffee",
      latitude: 42.3410968,
      longitude: -71.0814336,
    },
    {
      name: "Pavement Coffee House",
      latitude: 42.3498465,
      longitude: -71.1072088,
    },
    {
      name: "Southwestern Boston Starbucks",
      latitude: 42.3032119,
      longitude: -71.1520468,
    },
    {
      name: "Toscanini's",
      latitude: 42.3635462,
      longitude: -71.0994275,
    },
  ];

  console.table(
    boundaryTestPlaces.map((place) => ({
      name: place.name,
      insideBoston: isInsideBoston(
        place.longitude,
        place.latitude,
        municipalBoundary
      ),
    }))
  );

  // --------------------------------------
  // 4. RUN FULL ENRICHMENT
  // --------------------------------------

  console.log("\n4. Running full enrichment...\n");

  const enrichedPlaces = await enrichPlacesWithNeighborhoods(places);

  console.log(`Places enriched: ${enrichedPlaces.length}`);

  // --------------------------------------
  // 5. GEOGRAPHIC CLASSIFICATION SUMMARY
  // --------------------------------------

  console.log("\n5. Geographic classification summary...\n");

  const statusCounts = {
    assigned: 0,
    "outside-boston": 0,
    unmatched: 0,
    unknown: 0,
  };

  for (const place of enrichedPlaces) {
    const status = place.geographicStatus ?? "unknown";

    if (status in statusCounts) {
      statusCounts[status as keyof typeof statusCounts]++;
    }
  }

  console.table(statusCounts);

  // --------------------------------------
  // 6. INDIVIDUAL PLACE RESULTS
  // --------------------------------------

  console.log("\n6. Individual enriched places...\n");

  console.table(
    enrichedPlaces.map((place) => ({
      name: place.name,
      category: place.normalizedCategory,
      neighborhood: place.neighborhood?.name ?? "None",
      geographicStatus: place.geographicStatus ?? "Unknown",
      completeness: `${place.dataCompleteness}%`,
    }))
  );

  // --------------------------------------
  // 7. NEIGHBORHOOD DISTRIBUTION
  // --------------------------------------

  console.log("\n7. Neighborhood distribution...\n");

  const distribution = new Map<string, number>();

  for (const place of enrichedPlaces) {
    const neighborhood = place.neighborhood?.name;

    if (neighborhood) {
      distribution.set(
        neighborhood,
        (distribution.get(neighborhood) ?? 0) + 1
      );
    }
  }

  console.table(
    Array.from(distribution.entries())
      .map(([neighborhood, count]) => ({
        neighborhood,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  );

  // --------------------------------------
  // 8. PLACES NEEDING INVESTIGATION
  // --------------------------------------

  console.log("\n8. Geographic consistency check...\n");

    const geographicDiagnostics = places.map((place) => {
    const neighborhood = assignNeighborhood(
        place,
        neighborhoods
    );

    const insideBoston = isInsideBoston(
        place.longitude,
        place.latitude,
        municipalBoundary
    );

    return {
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        neighborhood: neighborhood?.name ?? "None",
        insideBoston,
        consistent: neighborhood ? insideBoston : true,
    };
    });

    console.table(geographicDiagnostics);

    const neighborhoodBoundaryConflicts =
    geographicDiagnostics.filter(
        (place) =>
        place.neighborhood !== "None" &&
        !place.insideBoston
    );

    console.log(
    "\nNeighborhood matches outside municipal boundary:",
    neighborhoodBoundaryConflicts.length
    );

    console.table(neighborhoodBoundaryConflicts);

  // --------------------------------------
  // 9. FINAL SUMMARY
  // --------------------------------------

  console.log("\n======================================");
  console.log("             TEST COMPLETE");
  console.log("======================================");

  console.log(`Total places: ${enrichedPlaces.length}`);
  console.log(`Assigned: ${statusCounts.assigned}`);
  console.log(`Outside Boston: ${statusCounts["outside-boston"]}`);
  console.log(`Unmatched: ${statusCounts.unmatched}`);
  console.log(`Unknown: ${statusCounts.unknown}`);

  console.log("\n======================================\n");
}

main().catch((error) => {
  console.error("\nKnowledge pipeline test failed:");
  console.error(error);
  process.exitCode = 1;
});
