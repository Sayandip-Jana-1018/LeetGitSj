import fs from "fs";

async function fetchLeetHub() {
    const res = await fetch("https://raw.githubusercontent.com/QasimWani/LeetHub/master/scripts/leetcode.js");
    const text = await res.text();
    fs.writeFileSync("leethub.js", text);
}
fetchLeetHub();
