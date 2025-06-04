#!/usr/bin/env python3
import os
import re
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

class RangeRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with support for HTTP Range requests."""
    
    def do_GET(self):
        """Handle GET requests with range support."""
        path = self.translate_path(self.path)
        
        # Let parent handle directories
        if os.path.isdir(path):
            return super().do_GET()
            
        # Handle file not found
        if not os.path.exists(path):
            self.send_error(404, "File not found")
            return
            
        # Open file and get size
        try:
            f = open(path, 'rb')
            fs = os.fstat(f.fileno())
            file_size = fs.st_size
        except IOError:
            self.send_error(404, "File not found")
            return
            
        # Parse range header
        range_header = self.headers.get('Range')
        
        if range_header:
            # Parse range like "bytes=500-1000" or "bytes=500-"
            match = re.search(r'bytes=(\d*)-(\d*)', range_header)
            if match:
                start_str, end_str = match.groups()
                
                # Handle different range formats
                if start_str == "":
                    # bytes=-500 (last 500 bytes)
                    start = file_size - int(end_str)
                    end = file_size - 1
                else:
                    start = int(start_str)
                    if end_str == "":
                        # bytes=500- (from 500 to end)
                        end = file_size - 1
                    else:
                        # bytes=500-1000
                        end = int(end_str)
                        
                # Validate range
                if start >= file_size or start < 0:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    f.close()
                    return
                    
                # Correct end if needed
                end = min(end, file_size - 1)
                content_length = end - start + 1
                
                # Send 206 Partial Content response
                self.send_response(206)
                self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                self.send_header('Content-Length', str(content_length))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Type', self.guess_type(path))
                self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
                self.end_headers()
                
                # Send requested range
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk_size = min(8192, remaining)
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
                    
            else:
                self.send_error(400, "Invalid range header")
                f.close()
                return
        else:
            # Normal request without range
            self.send_response(200)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
            self.end_headers()
            
            # Send entire file
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                self.wfile.write(chunk)
                
        f.close()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""
    allow_reuse_address = True

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadedHTTPServer(('', port), RangeRequestHandler)
    print(f"Serving HTTP on port {port} with range request support...")
    print(f"Access your files at http://localhost:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown() 