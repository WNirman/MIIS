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

print("=========================================================================")
print(" Fetching Real Live Page Posts & Access Tokens from Meta Graph API ")
print("=========================================================================")

# 1. Get Page Access Token
url_accounts = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"

try:
    req = urllib.request.Request(url_accounts)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('data', [])
        
        if pages:
            page = pages[0]
            page_name = page.get('name')
            page_id = page.get('id')
            page_token = page.get('access_token')
            
            print(f"[Success] Found Connected Meta Page: '{page_name}' (ID: {page_id})")
            
            # 2. Fetch Live Posts from Connected Page
            url_posts = f"https://graph.facebook.com/v19.0/{page_id}/posts?fields=id,message,created_time,full_picture,permalink_url&access_token={page_token}"
            req_posts = urllib.request.Request(url_posts)
            with urllib.request.urlopen(req_posts) as resp_posts:
                posts_data = json.loads(resp_posts.read().decode('utf-8'))
                posts = posts_data.get('data', [])
                print(f"[Live Facebook Data] Retrieved {len(posts)} real live posts from Meta Graph API!")
                
                if posts:
                    print("\nLatest Real Facebook Post Content:")
                    print(json.dumps(posts[0], indent=2))
                else:
                    print("\nNo published posts on this Facebook Page yet. Create a post on your page to see it live!")
        else:
            print("No pages connected.")
except Exception as e:
    print(f"Error fetching live Meta posts: {e}")
