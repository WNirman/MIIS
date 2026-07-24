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

token = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')

print("=========================================================")
print(" Testing Instagram Graph API Hashtag Search Connection ")
print("=========================================================")

if not token:
    print("Error: INSTAGRAM_ACCESS_TOKEN is empty.")
    exit(1)

# Step 1: Get Instagram Business Account ID attached to user's Meta Account
url_me = f"https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token={token}"

try:
    req = urllib.request.Request(url_me)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('data', [])
        print(f"Meta Accounts Found: {len(pages)}")
        
        ig_user_id = None
        for page in pages:
            ig_acc = page.get('instagram_business_account')
            if ig_acc:
                ig_user_id = ig_acc.get('id')
                print(f" -> Found Instagram Business Account ID: {ig_user_id} (Page: {page.get('name')})")

        # Step 2: Test Hashtag Search API for #srilankamarinelife or #srilanka
        hashtag_query = "srilanka"
        if ig_user_id:
            url_ht = f"https://graph.facebook.com/v19.0/ig_hashtag_search?user_id={ig_user_id}&q={hashtag_query}&access_token={token}"
        else:
            url_ht = f"https://graph.facebook.com/v19.0/ig_hashtag_search?q={hashtag_query}&access_token={token}"
            
        print(f"\nSearching Instagram Hashtag ID for '#{hashtag_query}'...")
        req_ht = urllib.request.Request(url_ht)
        with urllib.request.urlopen(req_ht) as resp_ht:
            ht_data = json.loads(resp_ht.read().decode('utf-8'))
            ht_items = ht_data.get('data', [])
            if ht_items:
                ht_id = ht_items[0].get('id')
                print(f"[Success] Found Instagram Hashtag ID for '#{hashtag_query}': {ht_id}")
                
                # Step 3: Fetch recent public Instagram posts with this hashtag
                if ig_user_id:
                    url_media = f"https://graph.facebook.com/v19.0/{ht_id}/recent_media?user_id={ig_user_id}&fields=id,caption,media_type,media_url,permalink,timestamp&access_token={token}"
                    req_media = urllib.request.Request(url_media)
                    with urllib.request.urlopen(req_media) as resp_m:
                        m_data = json.loads(resp_m.read().decode('utf-8'))
                        media_list = m_data.get('data', [])
                        print(f"[Live Instagram Data] Retrieved {len(media_list)} public Instagram posts for #{hashtag_query}!")
                        if media_list:
                            print("\nSample Public Instagram Post Caption:")
                            print(json.dumps(media_list[0], indent=2))
            else:
                print("No hashtag ID returned.")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    error_body = e.read().decode('utf-8')
    print(f"Response Error Body: {error_body}")
except Exception as e:
    print(f"Error testing Instagram Hashtag API: {e}")
