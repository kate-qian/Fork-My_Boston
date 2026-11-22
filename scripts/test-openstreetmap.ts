import { fetchBostonPlaces } from "../lib/knowledge/connectors/openstreetmap";

async function main() {
  console.log("Testing category-specific retrieval...\n");

  console.time("Cafe fetch");

  const cafes = await fetchBostonPlaces({
    category: "cafe",
    limit: 50,
  });

  console.timeEnd("Cafe fetch");

  console.log(`Found ${cafes.length} cafes.\n`);

  cafes.slice(0, 10).forEach((place) => {
    console.log(`${place.name} — ${place.address ?? "Address unavailable"}`);
  });

  console.log("\nTesting cache...\n");

  console.time("Cached cafe fetch");

  const cachedCafes = await fetchBostonPlaces({
    category: "cafe",
    limit: 50,
  });

  console.timeEnd("Cached cafe fetch");

  console.log(`Retrieved ${cachedCafes.length} cafes from cache.`);

  console.log("\nTesting parks...\n");

  const parks = await fetchBostonPlaces({
    category: "park",
    limit: 50,
  });

  console.log(`Found ${parks.length} parks.`);
}

main().catch(console.error);
