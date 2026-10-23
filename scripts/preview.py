"""Local-only SPA preview of an existing Vite build; no Node runtime required."""
import argparse
import errno
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

DIST = Path(__file__).resolve().parent.parent / "dist"


class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path.startswith("/api/"):
            self.send_error(501, "API is not implemented in the frontend demo")
            return
        target = Path(self.translate_path(path))
        if (
            not target.exists()
            and not Path(path).suffix
            and "text/html" in self.headers.get("Accept", "")
        ):
            self.path = "/index.html"
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    if not (DIST / "index.html").is_file():
        parser.error("dist/index.html is missing. Build the frontend with npm run build first.")
    handler = partial(SPAHandler, directory=str(DIST))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
        alternative = 4174 if args.port != 4174 else 4175
        parser.exit(
            2,
            f"Порт {args.port} уже занят. Если демо уже запущено, откройте "
            f"http://127.0.0.1:{args.port}\n"
            f"Для запуска на другом порту: python3 scripts/preview.py --port {alternative}\n",
        )
    with server:
        print(f"Local demo: http://127.0.0.1:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
