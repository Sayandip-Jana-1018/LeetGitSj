// background.js

chrome.webRequest.onCompleted.addListener(
  (details) => {
    // The check endpoint returns the status of a submission.
    // e.g. https://leetcode.com/submissions/detail/123456789/check/
    if (details.url.includes("/check/")) {
      const match = details.url.match(/submissions\/detail\/(\d+)\/check/);
      if (match && match[1]) {
        const submissionId = match[1];
        
        // Notify the content script in the tab that a submission was checked.
        chrome.tabs.sendMessage(details.tabId, {
          type: "SUBMISSION_CHECKED",
          submissionId: submissionId,
        }).catch(err => console.log("Failed to send message to tab", err));
      }
    }
  },
  { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
);
