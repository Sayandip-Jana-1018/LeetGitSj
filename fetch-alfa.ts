import fs from "fs";
import https from "https";

async function fetchAlfa() {
    const res = await fetch("https://raw.githubusercontent.com/alfaarghya/alfa-leetcode-api/master/src/graphql/queries.ts");
    if(res.status === 404) {
        const res2 = await fetch("https://raw.githubusercontent.com/alfaarghya/alfa-leetcode-api/main/src/graphql/queries.ts");
        console.log(await res2.text());
    } else {
        console.log(await res.text());
    }
}
fetchAlfa();
