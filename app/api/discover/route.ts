import { NextRequest, NextResponse } from "next/server";

import {
    fetchBostonPlaces,
} from "@/lib/knowledge/connectors/openstreetmap";

import {
    enrichPlacesWithNeighborhoods,
} from "@/lib/knowledge/enrichment";

import {
    getDiscoveryAgent,
} from "../../../lib/mastra/agents/discovery-agent";

export const runtime = "nodejs";

type Candidate = {
    id: string;
    name: string;
    category: string;
    neighborhood: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
    website: string | null;
    cuisine: string[];
};

function inferCategory(query: string) {
    const q = query.toLowerCase();

    if (/cafe|coffee|espresso|bakery/.test(q)) return "cafe";
    if (/restaurant|food|dinner|lunch|brunch/.test(q)) return "restaurant";
    if (/bar|nightlife|club|cocktail/.test(q)) return "nightlife";
    if (/park|garden|green space/.test(q)) return "park";
    if (/museum|art|culture|gallery/.test(q)) return "culture";
    if (/bookstore|book shop/.test(q)) return "bookstore";
    if (/library/.test(q)) return "library";
    if (/attraction|landmark|tourist/.test(q)) return "attraction";

    return undefined;
}

function parseModelResponse(text: string): {
    recommendations: { id: string; reason: string }[];
} {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.recommendations)) {
        throw new Error("The AI returned an invalid recommendation format.");
    }

    return parsed;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const query =
            typeof body.query === "string" ? body.query.trim() : "";

        const preferences =
            typeof body.preferences === "string"
                ? body.preferences.trim()
                : "";

        if (!query) {
            return NextResponse.json(
                { error: "Please provide a discovery query." },
                { status: 400 }
            );
        }

        // 1. Retrieve real places from the existing knowledge pipeline.
        const rawPlaces = await fetchBostonPlaces({
            category: inferCategory(query) as never,
            limit: 100,
            refresh: false,
        });

        // 2. Add neighborhood and geographic information.
        const enrichedPlaces = await enrichPlacesWithNeighborhoods(rawPlaces);

        // 3. Keep only places assigned to a Boston neighborhood.
        const candidates: Candidate[] = enrichedPlaces
            .filter((place) => place.geographicStatus === "assigned")
            .slice(0, 60)
            .map((place) => ({
                id: place.id,
                name: place.name,
                category: place.category,
                neighborhood: place.neighborhood?.name ?? null,
                address: place.address ?? null,
                latitude: place.latitude,
                longitude: place.longitude,
                website: place.normalizedWebsite ?? null,
                cuisine: place.normalizedCuisine ?? [],
            }));

        if (candidates.length === 0) {
            return NextResponse.json({
                recommendations: [],
                message: "No matching Boston places were found in the current knowledge base.",
            });
        }

        // 4. Ask the agent to rank only the candidates we supplied.
        const agent = getDiscoveryAgent();

        const result = await agent.generate(`
You are recommending real places from Fork My Boston's knowledge base.

USER REQUEST:
${query}

USER PREFERENCES:
${preferences || "No additional preferences."}

CANDIDATE PLACES:
${JSON.stringify(candidates)}

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "id": "exact candidate id",
      "reason": "One or two sentences explaining why this place fits."
    }
  ]
}

Rules:
- Recommend up to 5 places.
- Only use IDs that appear in the candidate list.
- Do not invent places, details, amenities, or facts.
- Do not include an address, website, or coordinates in your response.
- If nothing fits, return an empty recommendations array.
- Rank the strongest matches first.
`);

        const parsed = parseModelResponse(result.text);

        // 5. Validate every ID and build cards from our trusted candidate data.
        const candidateById = new Map(
            candidates.map((candidate) => [candidate.id, candidate])
        );

        const seen = new Set<string>();

        const recommendations = parsed.recommendations
            .filter((item) => {
                if (
                    typeof item.id !== "string" ||
                    typeof item.reason !== "string" ||
                    !candidateById.has(item.id) ||
                    seen.has(item.id)
                ) {
                    return false;
                }

                seen.add(item.id);
                return true;
            })
            .slice(0, 5)
            .map((item) => ({
                ...candidateById.get(item.id)!,
                reason: item.reason,
            }));

        return NextResponse.json({ recommendations });

    } catch (error) {
        console.error("Boston discovery error:", error);

        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : "Discovery request failed.",
            },
            { status: 500 }
        );
    }
}