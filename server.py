
import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os

PORT = 8092
API_URL = "https://llm.meirl.dev/v1/chat/completions"
# Using the key provided in previous context
API_KEY = "syed" 
MODEL_ID = "qwen3-coder-30B-instruct"

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/generate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse frontend request to get the prompt/messages
                data = json.loads(post_data)
                
                # Construct payload for the LLM API
                # We expect the frontend to send the full messages array or just the location
                # But to preserve the app's logic, let's assume frontend sends the body expected by OpenAI
                # OR we can simplify and just accept { location, difficulty } and do prompt here.
                # Let's stick to proxying the body mostly, but injecting the key.
                
                # Frontend sends: { model, messages, temperature, max_tokens }
                
                req = urllib.request.Request(
                    API_URL,
                    data=post_data, # Pass through the body
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {API_KEY}",
                        "User-Agent": "TravelBingoProxy/1.0"
                    },
                    method="POST"
                )

                try:
                    with urllib.request.urlopen(req) as response:
                        response_body = response.read()
                        self.send_response(response.status)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*') 
                        self.end_headers()
                        self.wfile.write(response_body)
                except urllib.error.HTTPError as e:
                    print(f"Upstream API Error: {e.code}")
                    error_content = e.read()
                    print(f"Error Body: {error_content.decode('utf-8')}")
                    
                    self.send_response(e.code)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(error_content)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print(f"Starting Proxy Server on port {PORT}")
with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    httpd.serve_forever()
