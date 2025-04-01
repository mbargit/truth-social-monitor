import ctypes
import os
import json
import platform
import time
from datetime import datetime
import random
import requests
from bs4 import BeautifulSoup
import re

# Set the name of our shared library
lib_name = 'tlsexpert'

VALID_CLIENT_HELLOS = [
  'Firefox_55',
  'Firefox_56',
  'Firefox_63',
  'Firefox_65',
  'Chrome_58',
  'Chrome_62',
  'Chrome_70',
  'Chrome_72',
  'Chrome_83',
  'IOS_11_1',
  'IOS_12_1',
]

# Figure out shared library extension
uname = platform.uname()
ext = '.dll'
bdir = '../linux'
if uname.system == 'Darwin':
    bdir = '../mac'
    ext = '.dylib'
if uname.system == 'Windows':
    bdir = '../win'
    ext = '.dll'

dir_path = os.path.dirname(os.path.realpath(__file__))
lib = ctypes.cdll.LoadLibrary(os.path.join(dir_path, bdir, lib_name+ext))

go_request = lib.request
go_request.argtypes = [ctypes.c_char_p]
go_request.restype = ctypes.c_char_p

go_download = lib.download
go_download.argtypes = [ctypes.c_char_p]
go_download.restype = ctypes.c_char_p

def request(url, method, cHello, proxy, body, headers, timeout, followRedirects):
  enc = json.dumps({"url":url,"method":method,"cHello":cHello,"proxy":proxy,"body":body,"headers":headers,"timeout":timeout,"followRedirects":followRedirects,"fileName":""})
  value = go_request(ctypes.c_char_p(enc.encode('utf8')))
  if not isinstance(value, bytes):
      value = value.encode('utf-8')
  return json.loads(value.decode())

def download(url, method, cHello, proxy, body, headers, timeout, followRedirects, fileName):
  enc = json.dumps({"url":url,"method":method,"cHello":cHello,"proxy":proxy,"body":body,"headers":headers,"timeout":timeout,"followRedirects":followRedirects,"fileName":fileName})
  value = go_download(ctypes.c_char_p(enc.encode('utf8')))
  if not isinstance(value, bytes):
      value = value.encode('utf-8')
  return json.loads(value.decode())

def send_telegram_message(bot_token, chat_id, text, media_url=None):
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    if media_url:
        # If there's media, send it as a photo/video
        if media_url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
            endpoint = f"{base_url}/sendPhoto"
            data = {
                'chat_id': chat_id,
                'photo': media_url,
                'caption': text,
                'parse_mode': 'HTML'
            }
        elif media_url.lower().endswith(('.mp4', '.mov', '.avi')):
            endpoint = f"{base_url}/sendVideo"
            data = {
                'chat_id': chat_id,
                'video': media_url,
                'caption': text,
                'parse_mode': 'HTML'
            }
        else:
            # If media type is unknown, send as text with link
            endpoint = f"{base_url}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': f"{text}\n\nMedia: {media_url}",
                'parse_mode': 'HTML'
            }
    else:
        # If no media, send as text only
        endpoint = f"{base_url}/sendMessage"
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
    
    try:
        response = requests.post(endpoint, data=data)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Error sending Telegram message: {str(e)}")
        return False

def clean_html(html_content):
    # Remove HTML tags but preserve line breaks
    soup = BeautifulSoup(html_content, 'html.parser')
    # Replace <br> and </p> with newlines
    for br in soup.find_all('br'):
        br.replace_with('\n')
    for p in soup.find_all('p'):
        if p.next_sibling:
            p.append('\n')
    text = soup.get_text()
    # Clean up multiple newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def extract_urls_from_html(html_content):
    # Extract URLs from HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    urls = []
    for link in soup.find_all('a'):
        if link.get('href'):
            urls.append(link['href'])
    return urls

def process_post(post, current_time):
    """Process a single post and send it to Telegram"""
    try:
        post_id = post.get('id')
        post_time = post.get('created_at')
        
        print(f"\nProcessing post {post_id}...")
        print(f"Post time: {post_time}")
        print(f"Content: {post.get('content', '')[:100]}...")  # First 100 chars
        
        # Safely check for card data
        card = post.get('card')
        print(f"Has card: {card is not None}")
        if card:
            print(f"Card type: {card.get('type', 'unknown')}")
            print(f"Card URL: {card.get('url', 'unknown')}")
        
        print(f"Has media: {'media_attachments' in post and len(post.get('media_attachments', [])) > 0}")
        
        # Prepare message content
        content = clean_html(post.get('content', ''))
        media_attachments = post.get('media_attachments', [])
        
        # Create message text
        message_text = f"🆕 New Post Detected!\n\n"
        
        # Handle content
        if content:
            message_text += f"{content}\n"
        
        # Handle card (link preview)
        media_url = None
        if card:
            # If there's content and a link, add a separator
            if content:
                message_text += "\n"
            message_text += f"🔗 Link Preview:\n"
            message_text += f"Title: {card.get('title', 'N/A')}\n"
            message_text += f"Description: {card.get('description', 'N/A')}\n"
            message_text += f"URL: {card.get('url', 'N/A')}\n"
            
            # If there's an image in the card, use it as media
            if card.get('image'):
                media_url = card.get('image')
        
        # Handle media attachments if no card image
        if not media_url and media_attachments:
            for media in media_attachments:
                if media.get('type') == 'image':
                    media_url = media.get('url')
                    break
                elif media.get('type') == 'video':
                    media_url = media.get('url')
                    break
        
        # Send to Telegram
        if send_telegram_message(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message_text, media_url):
            print("Successfully sent to Telegram")
        else:
            print("Failed to send to Telegram")
            
    except Exception as e:
        print(f"Error processing post: {str(e)}")
        print(f"Post data: {json.dumps(post, indent=2)}")

if __name__ == '__main__':
    url = "https://truthsocial.com/api/v1/accounts/114253527119250506/statuses?exclude_replies=true&only_replies=false&with_muted=true"
    
    # Telegram configuration
    TELEGRAM_BOT_TOKEN = "7841049730:AAHUvJpCgaEClEvWVqHw-MlKwxAwKze5n-k"  # Replace with your bot token
    TELEGRAM_CHAT_ID = "-1002393083645"      # Replace with your chat ID
    
    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'authorization': 'Bearer 4hG3pgQLrgApoJzZfIx_BVL4txXoFk0WtNfxr2tqXgE',
        'baggage': 'sentry-environment=production,sentry-public_key=341951a6e21a4c929c321aa2720401f5,sentry-trace_id=783ebc420be14dc2bbda1bc76b7cfc91',
        'priority': 'u=1, i',
        'referer': 'https://truthsocial.com/@trickzy',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sentry-trace': '783ebc420be14dc2bbda1bc76b7cfc91-a3d8ced1d338a816',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
    }

    # Read proxies from file
    proxy_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'proxies.txt')
    with open(proxy_file, 'r') as f:
        proxies = [line.strip() for line in f if line.strip()]

    if not proxies:
        print("No proxies found in proxies.txt")
        exit(1)

    print(f"Loaded {len(proxies)} proxies")

    # Store the most recent post ID we've seen
    last_seen_id = None
    
    while True:
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Select a random proxy
            proxy = random.choice(proxies)
            host, port, username, password = proxy.split(':')
            proxy_url = f"http://{username}:{password}@{host}:{port}"
            
            print(f"\nMaking request at {current_time}")
            print(f"Using proxy: {host}:{port}")
            
            res = request(url, "GET", "Chrome_83", proxy_url, "", headers, 5000, True)
            if 'status' in res:
                print(f"Status Code: {res['status']}")
                if res['status'] == 7:
                    print("Status code 7 detected, retrying immediately with different proxy...")
                    continue  # This will skip the sleep and retry with a new proxy
            
            # Parse the response body if it exists
            if 'body' in res and res['body']:
                try:
                    posts = json.loads(res['body'])
                    if isinstance(posts, list) and posts:
                        print(f"\nProcessing {len(posts)} posts...")
                        
                        # Get the current most recent post ID
                        current_most_recent_id = posts[0].get('id')
                        
                        if last_seen_id is None:
                            # First run - just store the most recent ID
                            print(f"First run - storing most recent ID: {current_most_recent_id}")
                            last_seen_id = current_most_recent_id
                        elif current_most_recent_id != last_seen_id:
                            # New posts detected - process all posts up to the last seen ID
                            print(f"New posts detected! Processing posts from {current_most_recent_id} to {last_seen_id}")
                            
                            # Process all posts until we hit the last seen ID
                            for post in posts:
                                post_id = post.get('id')
                                if post_id == last_seen_id:
                                    break
                                process_post(post, current_time)
                            
                            # Update the last seen ID
                            last_seen_id = current_most_recent_id
                        else:
                            print("No new posts detected")
                except json.JSONDecodeError:
                    print("Could not parse response body as JSON")
            
            print("\nWaiting 1 second before next request...")
            time.sleep(1)
            
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            time.sleep(5)  # Still wait 5 seconds even if there's an error
