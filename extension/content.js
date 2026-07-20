// content.js

let syncingSubmissions = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SUBMISSION_CHECKED") {
    const submissionId = message.submissionId;
    if (!syncingSubmissions.has(submissionId)) {
      syncingSubmissions.add(submissionId);
      handleSubmission(submissionId).catch(err => {
        console.error("LeetGit Sync Error:", err);
      }).finally(() => {
        // Remove from set after a while to allow retries if needed
        setTimeout(() => syncingSubmissions.delete(submissionId), 10000);
      });
    }
  }
});

async function handleSubmission(submissionId) {
  // 1. Check if the submission is actually Accepted
  const checkRes = await fetch(`https://leetcode.com/submissions/detail/${submissionId}/check/`);
  const checkData = await checkRes.json();
  
  // status_code 10 usually means Accepted, state SUCCESS means it finished running
  if (checkData.state !== "SUCCESS" || checkData.status_msg !== "Accepted") {
    console.log(`[LeetGit] Submission ${submissionId} is not Accepted (${checkData.status_msg}). Skipping.`);
    return;
  }

  console.log(`[LeetGit] Detected Accepted submission ${submissionId}. Fetching details...`);

  // 2. Fetch the actual code using GraphQL
  // Since we are in the content script, cookies and Cloudflare clearance are automatically attached!
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        lang {
          name
          verboseName
        }
        question {
          questionId
          titleSlug
          title
        }
        runtime
        runtimeDisplay
        memory
        memoryDisplay
      }
    }
  `;

  // We need the CSRF token from cookies, but since we use fetch() in the same origin, 
  // we can just extract it from document.cookie, or LeetCode might not even strictly need it 
  // if we pass the right headers. Let's try to get it.
  const csrfToken = getCookie("csrftoken");

  const graphqlRes = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrftoken": csrfToken || "",
    },
    body: JSON.stringify({
      operationName: "submissionDetails",
      query: query,
      variables: { submissionId: parseInt(submissionId) }
    })
  });

  const graphqlData = await graphqlRes.json();
  
  if (!graphqlData.data || !graphqlData.data.submissionDetails) {
    console.error("[LeetGit] Failed to fetch submission details via GraphQL.", graphqlData);
    return;
  }

  const details = graphqlData.data.submissionDetails;

  // 3. We also need problem tags and difficulty which are not in submissionDetails.
  // We can fetch them using questionTitle and singleQuestionTopicTags queries.
  const metaQuery = `
    query problemMeta($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  const metaRes = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrftoken": csrfToken || "",
    },
    body: JSON.stringify({
      operationName: "problemMeta",
      query: metaQuery,
      variables: { titleSlug: details.question.titleSlug }
    })
  });

  const metaData = await metaRes.json();
  const difficulty = metaData.data?.question?.difficulty || "Unknown";
  const tags = (metaData.data?.question?.topicTags || []).map(t => t.name);

  // 4. Get settings from Chrome Storage
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(["backendUrl", "extensionSecret"], resolve);
  });

  if (!settings.extensionSecret) {
    console.warn("[LeetGit] Extension Secret is not set. Please configure the extension.");
    return;
  }

  const backendUrl = settings.backendUrl || "https://leetgit.vercel.app";

  // 5. Send to our backend
  console.log(`[LeetGit] Sending submission ${submissionId} to ${backendUrl}/api/extension/sync...`);
  
  const syncRes = await fetch(`${backendUrl}/api/extension/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.extensionSecret}`
    },
    body: JSON.stringify({
      leetcodeSubmissionId: submissionId,
      questionId: details.question.questionId,
      title: details.question.title,
      titleSlug: details.question.titleSlug,
      difficulty: difficulty,
      tags: tags,
      runtime: details.runtimeDisplay || details.runtime,
      memory: details.memoryDisplay || details.memory,
      runtimePercentile: checkData.runtime_percentile || 0,
      memoryPercentile: checkData.memory_percentile || 0,
      code: details.code,
      lang: details.lang.name
    })
  });

  if (syncRes.ok) {
    const syncData = await syncRes.json();
    console.log("[LeetGit] Successfully synced to GitHub!", syncData);
    // Optional: show a small toast notification on the page
    showToast("LeetGit: Solution synced to GitHub successfully!");
  } else {
    const errorText = await syncRes.text();
    console.error("[LeetGit] Failed to sync to GitHub.", syncRes.status, errorText);
    showToast(`LeetGit Error: Failed to sync. (${syncRes.status})`, true);
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function showToast(message, isError = false) {
  const div = document.createElement("div");
  div.textContent = message;
  div.style.position = "fixed";
  div.style.bottom = "20px";
  div.style.right = "20px";
  div.style.padding = "12px 20px";
  div.style.backgroundColor = isError ? "#ef4444" : "#22c55e";
  div.style.color = "white";
  div.style.borderRadius = "8px";
  div.style.fontWeight = "bold";
  div.style.zIndex = "999999";
  div.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";
  div.style.fontFamily = "sans-serif";
  div.style.fontSize = "14px";
  div.style.transition = "opacity 0.5s";
  
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 500);
  }, 4000);
}
