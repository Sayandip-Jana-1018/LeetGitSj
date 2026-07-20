import { prisma } from "./src/lib/prisma";
import { decrypt } from "./src/lib/encryption";
import { fetchRecentSubmissions } from "./src/lib/leetcode";
import { config } from "dotenv";
config({ path: ".env.local" });

async function testFetch() {
  const cred = await prisma.leetCodeCredential.findFirst();
  if (!cred) return console.log("No credentials found");

  const session = decrypt(cred.encryptedSession);
  const csrf = decrypt(cred.encryptedCsrfToken);

  console.log(`Testing with user ${cred.leetcodeUsername}...`);

  try {
    const { submissions } = await fetchRecentSubmissions(session, csrf, 5, 0);
    console.log("Recent submissions:");
    for (const sub of submissions) {
      console.log(`- [${sub.statusDisplay}] ${sub.title} (ID: ${sub.id}) - ${sub.timestamp}`);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
  process.exit(0);
}

testFetch();
