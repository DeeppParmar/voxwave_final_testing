
from pytubefix import Search

def generate_token():
    print("Initializing YouTube OAuth flow...")
    print("You will be asked to open a URL and enter a code.")
    
    # Trigger search to start OAuth
    try:
        s = Search("test query", use_oauth=True, allow_oauth_cache=True)
        # Accessing .videos triggers the actual fetch and auth
        results = s.videos
        print("\nSUCCESS! OAuth token generated and cached.")
        print("Please check for a 'tokens.json' or 'cache' folder in your directory.")
        print("You MUST commit this file/folder to GitHub for it to work on Render.")
    except Exception as e:
        print(f"\nError during OAuth: {e}")

if __name__ == "__main__":
    generate_token()
