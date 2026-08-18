#!/usr/bin/env python3
"""Small static dev server with HTTP Range support (needed for <video>)."""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the console quiet
        pass

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.exists(path):
            return super().send_head()

        m = RANGE_RE.match(rng.strip())
        if not m:
            return super().send_head()

        size = os.path.getsize(path)
        start = int(m.group(1)) if m.group(1) else 0
        end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_error(416)
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()

        # SimpleHTTPRequestHandler copies to EOF, so hand back a bounded reader.
        remaining = end - start + 1
        original_read = f.read

        def bounded(n=-1):
            nonlocal remaining
            if remaining <= 0:
                return b""
            chunk = original_read(min(n, remaining) if n and n > 0 else remaining)
            remaining -= len(chunk)
            return chunk

        f.read = bounded
        return f


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
