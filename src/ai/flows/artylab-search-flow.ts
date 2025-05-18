'use server';
/**
 * @fileOverview A flow to search for JAR files in Artylab by version.
 *
 * - searchArtylabByVersion - A function that invokes the Artylab search logic.
 * - ArtylabSearchInput - The input type for the searchArtylabByVersion function.
 * - ArtylabSearchOutput - The return type for the searchArtylabByVersion function.
 */

import { z } from 'zod';

const ArtylabSearchInputSchema = z.object({
  version: z.string().describe('The JAR version to search for in Artylab (e.g., "45.2.73").'),
});
export type ArtylabSearchInput = z.infer<typeof ArtylabSearchInputSchema>;

const ArtylabSearchOutputSchema = z.array(z.string().describe('A JAR file URL found in Artylab.'));
export type ArtylabSearchOutput = z.infer<typeof ArtylabSearchOutputSchema>;

export async function searchArtylabByVersion(input: ArtylabSearchInput): Promise<ArtylabSearchOutput> {
  ArtylabSearchInputSchema.parse(input);
  return await artylabSearchLogic(input);
}

async function artylabSearchLogic(input: ArtylabSearchInput): Promise<ArtylabSearchOutput> {
  const { version } = input;
  const artylabApiUsername = process.env.ARTYLAB_USERNAME;
  const artylabApiPassword = process.env.ARTYLAB_PASSWORD;

  if (!artylabApiUsername || !artylabApiPassword) {
    console.error("Artylab API credentials are not configured.");
    throw new Error("Please set ARTYLAB_USERNAME and ARTYLAB_PASSWORD in your environment variables.");
  }

  let accessToken: string;
  try {
    const tokenUrl = "https://artylab.expedia.biz/artifactory/api/security/token";
    const basicAuth = Buffer.from(`${artylabApiUsername}:${artylabApiPassword}`).toString('base64');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: 's-UMP-DP-Account',
        scope: 'member-of-groups:readers',
        expires_in: '3600',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Token fetch failed (${tokenResponse.status}): ${tokenResponse.statusText}. ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

    if (!accessToken) throw new Error("Access token not found in response.");
  } catch (error) {
    console.error("Failed to fetch access token:", error);
    throw new Error("Could not authenticate with Artylab. Ensure VPN is connected and credentials are valid.");
  }

  let searchResultsJson: any;
  try {
    const aqlUrl = "https://artylab.expedia.biz/artifactory/api/search/aql";
    const artifactNamePrefix = "ump-analytics-workflows";
    const artifactBasePath = "com/expediagroup/distributedcompute/ump-analytics-workflows";
    const repoName = "expediagroup-maven-snapshot-local";

    const aqlQuery = `items.find({
      "repo": "${repoName}",
      "type": "file",
      "name": {"$match": "${artifactNamePrefix}-${version}-*.jar"},
      "path": {"$match": "${artifactBasePath}/${version}-SNAPSHOT"}
    }).include("name", "repo", "path")`;

    const aqlResponse = await fetch(aqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: aqlQuery,
    });

    if (!aqlResponse.ok) {
      const errorBody = await aqlResponse.text();
      throw new Error(`AQL search failed (${aqlResponse.status}): ${aqlResponse.statusText}. ${errorBody}`);
    }

    searchResultsJson = await aqlResponse.json();
    if (!searchResultsJson?.results) return [];
  } catch (error) {
    console.error("Error during AQL search:", error);
    throw new Error("AQL query failed. Check if the Artylab service is reachable.");
  }

  const baseUrl = "https://artylab.expedia.biz";
  const results = searchResultsJson.results.map((item: any) => {
    if (item.repo && item.path && item.name) {
      const cleanPath = item.path.startsWith('/') ? item.path.slice(1) : item.path;
      return `${baseUrl}/${item.repo}/${cleanPath}/${item.name}`;
    }
    return null;
  }).filter((url: string | null): url is string => url !== null);

  return results;
}
