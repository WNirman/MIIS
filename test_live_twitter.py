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

bearer_token = os.environ.get('TWITTER_BEARER_TOKEN', '')

print("=========================================================")
print(" Testing Live Twitter/X API v2 Authorization & Connection ")
print("=========================================================")

if not bearer_token:
    print("Error: TWITTER_BEARER_TOKEN is empty.")
    exit(1)

query = "Sri Lanka"
url = f"https://api.twitter.com/2/tweets/search/recent?query={urllib.parse.quote(query)}&max_results=10"

req = urllib.request.Request(url, headers={
    "Authorization": f"Bearer {bearer_token}",
    "User-Agent": "v2RecentSearchPython"
})

try:
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        body = response.read().decode('utf-8')
        data = json.loads(body)
        print(f"HTTP Status: {status_code} SUCCESS!")
        print(f"Total live tweets returned: {len(data.get('data', []))}")
        print("\nSample Live Tweet from X:")
        if data.get('data'):
            print(json.dumps(data['data'][0], indent=2))
        else:
            print("No recent tweets matched the exact query string.")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    error_body = e.read().decode('utf-8')
    print(f"Response Error Body: {error_body}")
except Exception as e:
    print(f"Error connecting to Twitter API: {e}")
