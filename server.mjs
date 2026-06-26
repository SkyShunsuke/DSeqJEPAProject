import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const noCacheExt = new Set([".html", ".js", ".css"]);

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function resolvePath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const withoutLeadingSlash = decodedPath.replace(/^\/+/, "");
  const normalizedPath = normalize(withoutLeadingSlash);
  const requestedPath = normalizedPath === "." ? "index.html" : normalizedPath;
  return resolve(rootDir, requestedPath);
}

function isInsideRoot(absolutePath) {
  const rel = relative(rootDir, absolutePath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, "Bad Request");
    return;
  }

  const requestUrl = new URL(req.url, "http://localhost");
  let filePath = resolvePath(requestUrl.pathname);

  if (!isInsideRoot(filePath)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    let fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
      fileStat = await stat(filePath);
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const cacheControl = noCacheExt.has(ext) ? "no-cache" : "public, max-age=86400";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Content-Length": String(fileStat.size),
    });

    createReadStream(filePath).pipe(res);
  } catch {
    const hasExtension = extname(requestUrl.pathname).length > 0;
    if (hasExtension) {
      sendText(res, 404, "Not Found");
      return;
    }

    try {
      const fallback = await readFile(join(rootDir, "index.html"), "utf8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(fallback);
    } catch {
      sendText(res, 404, "Not Found");
    }
  }
});

server.listen(port, () => {
  console.log(`DSeq-JEPA project page is running at http://localhost:${port}`);
});
