import { prisma } from "./src/lib/prisma";
import { decrypt } from "./src/lib/encryption";
import { config } from "dotenv";
config({ path: ".env.local" });

async function testFetchRaw() {
  const cred = await prisma.leetCodeCredential.findFirst();
  if (!cred) return console.log("No credentials found");

  const session = decrypt(cred.encryptedSession);
  const csrfToken = decrypt(cred.encryptedCsrfToken);

  const query = `
    query recentSubmissions($username: String!, $limit: Int!) {
      recentSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
        runtime
        memory
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${session}; csrftoken=${csrfToken}`,
        "x-csrftoken": csrfToken,
        Referer: "https://leetcode.com/",
      },
      body: JSON.stringify({ query, variables: { username: cred.leetcodeUsername, limit: 20 } }),
    });

    const json = await response.json();
    console.log(`RAW GRAPHQL RESULT:`, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
  process.exit(0);
}

testFetchRaw();
