const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 8787;
const SAMPLE_PATH = path.join(__dirname, "..", "sample", "http_bookmarks.json");

const server = http.createServer((request, response) => {
  if (request.url !== "/http_bookmarks.json") {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    });
    response.end("Not found");
    return;
  }

  const body = fs.readFileSync(SAMPLE_PATH, "utf8");

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  response.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`HTTP sample server listening at http://${HOST}:${PORT}/http_bookmarks.json`);
});
