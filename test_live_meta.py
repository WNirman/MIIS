import os
import json
import urllib.request
import urllib.parse

# Read .env file
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

token = os.environ.get('FACEBOOK_ACCESS_TOKEN', '')

print("=========================================================")
print(" Testing Live Meta Graph API Token Connection ")
print("=========================================================")

if not token:
    print("Error: FACEBOOK_ACCESS_TOKEN is empty.")
    exit(1)

url = f"https://graph.facebook.com/v19.0/me?fields=id,name,permissions&access_token={token}"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        body = response.read().decode('utf-8')
        data = json.loads(body)
        print(f"HTTP Status: {status_code} SUCCESS!")
        print(f"Authenticated Meta Account Name: {data.get('name')} (ID: {data.get('id')})")
        print("\nGranted Token Permissions:")
        permissions = data.get('permissions', {}).get('data', [])
        for p in permissions:
            print(f" - {p.get('permission')}: {p.get('status')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    error_body = e.read().decode('utf-8')
    print(f"Response Error Body: {error_body}")
except Exception as e:
    print(f"Error connecting to Meta Graph API: {e}")
