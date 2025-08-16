import requests
import json

def iterate_all(next_url: str, token: str) -> list:
    result = []
    continuue = True
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ token,
    }
    payload = {}
    fuse = 1
    
    while(continuue):
        fuse += 1
        if(fuse > 500):
            break
            
        try:
            response = requests.request("GET", next_url, headers=headers, data=payload)
            
            # Check if response is successful
            if response.status_code != 200:
                print(f"Error: Spotify API returned status {response.status_code}")
                break
                
            res_json = json.loads(response.text)
            
            # Check if response has the expected structure
            if 'items' not in res_json:
                print(f"Error: Response missing 'items' key: {res_json}")
                break
                
            result += res_json['items']
            
            # Check if there's a next page
            if 'next' in res_json and res_json['next']:
                next_url = res_json['next']
            else:
                continuue = False
                
        except Exception as e:
            print(f"Error in iterate_all: {e}")
            print(f"Response text: {response.text if 'response' in locals() else 'No response'}")
            break
    
    return result