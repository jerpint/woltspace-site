"""Static server with HTTP Range support (needed for video playback)."""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        if not os.path.isfile(path):
            return super().send_head()

        rng = self.headers.get("Range")
        size = os.path.getsize(path)
        ctype = self.guess_type(path)

        if not rng or not rng.startswith("bytes="):
            f = open(path, "rb")
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return f

        try:
            spec = rng.split("=", 1)[1].split(",")[0].strip()
            start_s, end_s = spec.split("-")
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else size - 1
            if end >= size:
                end = size - 1
            if start > end:
                raise ValueError
        except Exception:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        length = end - start + 1
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return RangeReader(f, length)


class RangeReader:
    def __init__(self, f, length):
        self.f = f
        self.left = length

    def read(self, n=-1):
        if self.left <= 0:
            return b""
        if n < 0 or n > self.left:
            n = self.left
        data = self.f.read(n)
        self.left -= len(data)
        return data

    def close(self):
        self.f.close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 8000))
    with ThreadingHTTPServer(("0.0.0.0", port), RangeHandler) as httpd:
        print(f"serving with Range support on :{port}")
        httpd.serve_forever()
