#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Локальный сервер для игры: раздаёт файлы + принимает логи забегов.
Запуск: python serve.py   →  http://localhost:8000/index.html
Логи забегов: POST /api/log → Data\run-log.json (последние 50)
"""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(ROOT, "Data", "run-log.json")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            path = "/index.html"
        if path == "/api/log":
            return self._send(200, b"[]", "application/json")
        fp = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
        if not fp.startswith(ROOT) or not os.path.isfile(fp):
            return self._send(404, b"not found", "text/plain")
        ext = os.path.splitext(fp)[1].lower()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json",
        }.get(ext, "application/octet-stream")
        with open(fp, "rb") as f:
            return self._send(200, f.read(), ctype)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/log":
            return self._send(404, b"not found", "text/plain")
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n).decode("utf-8", "replace")
        try:
            entry = json.loads(body)
        except Exception:
            return self._send(400, b"bad json", "text/plain")
        entry["received"] = time.strftime("%Y-%m-%d %H:%M:%S")
        logs = []
        if os.path.isfile(LOG):
            try:
                with open(LOG, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []
        logs.append(entry)
        while len(logs) > 50:
            logs.pop(0)
        with open(LOG, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=1)
        return self._send(200, b"ok", "text/plain")

    def _send(self, code, data, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("serving http://localhost:%d/index.html  (logs -> Data\\run-log.json)" % port)
    srv.serve_forever()