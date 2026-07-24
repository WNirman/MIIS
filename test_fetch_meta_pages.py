import os
import json
import urllib.request
import urllib.parse

env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

token = os.environ.get('FACEBOOK_ACCESS_TOKEN', '')

print("Fetching connected Meta Facebook pages...")
url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('data', [])
        print(f"Total Pages Connected: {len(pages)}")
        for page in pages:
            print(f" - Page Name: {page.get('name')} | Category: {page.get('category')} | ID: {page.get('id')}")
except Exception as e:
    print(f"Error: {e}")
