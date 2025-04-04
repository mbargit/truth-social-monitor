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
import sys
import signal
import subprocess
import atexit
import logging
from logging.handlers import RotatingFileHandler
import daemon
import daemon.pidfile

# Set up logging
log_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'monitor.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5),  # 10MB per file, keep 5 files
        logging.StreamHandler()  # Also print to console
    ]
)
logger = logging.getLogger(__name__)

# Set the name of our shared library
lib_name = 'tlsexpert'

# Telegram configuration
TELEGRAM_BOT_TOKEN = "7841049730:AAHUvJpCgaEClEvWVqHw-MlKwxAwKze5n-k"
TELEGRAM_CHAT_IDS = [
    "-1002393083645",  # First chat ID
    "-1002589438564",  # Second chat ID (replace with your actual chat ID)
    "-1002314755584"   # Third chat ID (replace with your actual chat ID)
]

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

def send_telegram_message(bot_token, chat_ids, text, media_url=None, inline_keyboard=None):
    """Send a message to multiple Telegram chats"""
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    # Ensure chat_ids is a list
    if not isinstance(chat_ids, list):
        chat_ids = [chat_ids]
    
    success_count = 0
    for chat_id in chat_ids:
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        
        if media_url:
            # If there's media, send it as a photo/video
            if media_url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                endpoint = f"{base_url}/sendPhoto"
                data['photo'] = media_url
                data['caption'] = text
            elif media_url.lower().endswith(('.mp4', '.mov', '.avi')):
                endpoint = f"{base_url}/sendVideo"
                data['video'] = media_url
                data['caption'] = text
            else:
                # If media type is unknown, send as text with link
                endpoint = f"{base_url}/sendMessage"
                data['text'] = f"{text}\n\nMedia: {media_url}"
        else:
            endpoint = f"{base_url}/sendMessage"
        
        # Add inline keyboard if provided
        if inline_keyboard:
            data['reply_markup'] = json.dumps({
                'inline_keyboard': inline_keyboard
            })
        
        try:
            response = requests.post(endpoint, data=data)
            response.raise_for_status()
            logger.info(f"Successfully sent to Telegram chat {chat_id}")
            success_count += 1
        except Exception as e:
            logger.error(f"Error sending Telegram message to chat {chat_id}: {str(e)}")
    
    # Return True only if all messages were sent successfully
    return success_count == len(chat_ids)

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
        
        logger.info(f"\nProcessing post {post_id}...")
        logger.info(f"Post time: {post_time}")
        logger.info(f"Content: {post.get('content', '')[:100]}...")  # First 100 chars
        
        # Calculate time difference between post creation and alert
        post_datetime = datetime.strptime(post_time.split('.')[0], '%Y-%m-%dT%H:%M:%S')
        alert_datetime = datetime.strptime(current_time, '%Y-%m-%d %H:%M:%S')
        time_diff_seconds = (alert_datetime - post_datetime).total_seconds()
        
        logger.info(f"Time difference: {time_diff_seconds:.2f} seconds")
        
        # Only process posts created within the last 20 seconds
        if time_diff_seconds > 20:
            logger.info(f"Post is too old ({time_diff_seconds:.2f} seconds). Skipping alert.")
            return
        
        # Safely check for card data
        card = post.get('card')
        logger.info(f"Has card: {card is not None}")
        if card:
            logger.info(f"Card type: {card.get('type', 'unknown')}")
            logger.info(f"Card URL: {card.get('url', 'unknown')}")
        
        logger.info(f"Has media: {'media_attachments' in post and len(post.get('media_attachments', [])) > 0}")
        
        # Prepare message content
        content = clean_html(post.get('content', ''))
        media_attachments = post.get('media_attachments', [])
        
        # Create message text with timestamps
        message_text = f"🆕 New Post Detected!\n"
        
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
                    # For videos, include both the video URL and preview image
                    video_url = media.get('url')
                    preview_url = media.get('preview_url')
                    if video_url:
                        message_text += f"\n🎥 Video: {video_url}\n"
                    if preview_url:
                        media_url = preview_url
                    break
        
        # Create inline keyboard with Truth Social link
        inline_keyboard = [[{
            'text': '🔗 View on Truth Social',
            'url': f'https://truthsocial.com/@realDonaldTrump/posts/{post_id}'
        }]]
        
        # Send to all Telegram chats
        if send_telegram_message(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS, message_text, media_url, inline_keyboard):
            logger.info("Successfully sent to all Telegram chats")
        else:
            logger.warning("Failed to send to one or more Telegram chats")
            
    except Exception as e:
        logger.error(f"Error processing post: {str(e)}")
        logger.error(f"Post data: {json.dumps(post, indent=2)}")

def signal_handler(signum, frame):
    """Handle termination signals gracefully"""
    if signum == signal.SIGINT:
        # Ignore Ctrl+C, just log it
        logger.info("Received Ctrl+C. Script will continue running in the background.")
        logger.info("To stop the script, use: kill $(cat monitor.pid)")
        return
    else:
        # For other signals, clean up and exit
        logger.info(f"Received signal {signum}. Cleaning up...")
        # Clean up PID file
        pid_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'monitor.pid')
        if os.path.exists(pid_file):
            os.remove(pid_file)
        sys.exit(0)

def restart_script():
    """Restart the script"""
    logger.info("Restarting script...")
    python = sys.executable
    os.execl(python, python, *sys.argv)

def run_monitor():
    """Main monitoring function"""
    url = "https://truthsocial.com/api/v1/accounts/107780257626128497/statuses?exclude_replies=true&only_replies=false&with_muted=true"
    
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
        logger.error("No proxies found in proxies.txt")
        sys.exit(1)

    logger.info(f"Loaded {len(proxies)} proxies")

    # Store the most recent post ID we've seen
    last_seen_id = None
    
    # Proxy rotation state
    current_proxy_index = -1  # -1 means no proxy
    last_proxy_switch_time = 0
    PROXY_TIMEOUT = 180  # 3 minutes in seconds
    
    # Error tracking
    consecutive_errors = 0
    MAX_CONSECUTIVE_ERRORS = 5
    
    while True:
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Determine if we should switch back to no proxy
            if current_proxy_index >= 0 and time.time() - last_proxy_switch_time >= PROXY_TIMEOUT:
                logger.info("Switching back to no proxy after timeout...")
                current_proxy_index = -1
            
            # Prepare proxy URL if needed
            proxy_url = ""
            if current_proxy_index >= 0:
                proxy = proxies[current_proxy_index]
                host, port, username, password = proxy.split(':')
                proxy_url = f"http://{username}:{password}@{host}:{port}"
                logger.info(f"Using proxy: {host}:{port}")
            else:
                logger.info("Using no proxy")
            
            logger.info(f"Making request at {current_time}")
            
            res = request(url, "GET", "Chrome_83", proxy_url, "", headers, 5000, True)
            if 'status' in res:
                logger.info(f"Status Code: {res['status']}")
                
                # Handle rate limiting (429)
                if res['status'] == 429:
                    logger.warning("Rate limited detected, switching to next proxy...")
                    current_proxy_index = (current_proxy_index + 1) % len(proxies)
                    last_proxy_switch_time = time.time()
                    continue  # Retry immediately with new proxy
                
                # Handle other error status codes
                if res['status'] == 7:
                    logger.warning("Status code 7 detected, switching to next proxy...")
                    current_proxy_index = (current_proxy_index + 1) % len(proxies)
                    last_proxy_switch_time = time.time()
                    continue  # Retry immediately with new proxy
            
            # Parse the response body if it exists
            if 'body' in res and res['body']:
                try:
                    posts = json.loads(res['body'])
                    if isinstance(posts, list) and posts:
                        logger.info(f"Processing {len(posts)} posts...")
                        
                        # Get the current most recent post ID
                        current_most_recent_id = posts[0].get('id')
                        
                        if last_seen_id is None:
                            # First run - just store the most recent ID
                            logger.info(f"First run - storing most recent ID: {current_most_recent_id}")
                            last_seen_id = current_most_recent_id
                        elif current_most_recent_id != last_seen_id:
                            # New posts detected - process all posts up to the last seen ID
                            logger.info(f"New posts detected! Processing posts from {current_most_recent_id} to {last_seen_id}")
                            
                            # Process all posts until we hit the last seen ID
                            for post in posts:
                                post_id = post.get('id')
                                if post_id == last_seen_id:
                                    break
                                process_post(post, current_time)
                            
                            # Update the last seen ID
                            last_seen_id = current_most_recent_id
                        else:
                            logger.info("No new posts detected")
                except json.JSONDecodeError:
                    logger.error("Could not parse response body as JSON")
                    consecutive_errors += 1
            
            # Reset error counter on successful request
            consecutive_errors = 0
            
            logger.info("Waiting 1 second before next request...")
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error occurred: {str(e)}")
            consecutive_errors += 1
            
            # If we've had too many consecutive errors, restart the script
            if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                logger.error(f"Too many consecutive errors ({consecutive_errors}). Restarting script...")
                restart_script()
            
            time.sleep(5)  # Wait 5 seconds before retrying

if __name__ == '__main__':
    # Create PID file path
    pid_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'monitor.pid')
    
    # Check if script is already running
    if os.path.exists(pid_file):
        with open(pid_file, 'r') as f:
            old_pid = int(f.read().strip())
            try:
                # Check if process is still running
                os.kill(old_pid, 0)
                logger.error(f"Script is already running with PID {old_pid}")
                sys.exit(1)
            except OSError:
                # Process not running, remove stale PID file
                os.remove(pid_file)
    
    # Write current PID to file
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # Termination signal
    signal.signal(signal.SIGHUP, signal_handler)   # Hangup signal
    
    logger.info(f"Script started with PID {os.getpid()}")
    logger.info("Press Ctrl+C to detach (script will continue running)")
    logger.info("To stop the script, use: kill $(cat monitor.pid)")
    
    try:
        run_monitor()
    except KeyboardInterrupt:
        # This should never happen now, but just in case
        logger.info("Script will continue running in the background")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        restart_script()
    finally:
        # Clean up PID file only if we're actually exiting
        if os.path.exists(pid_file) and signal.SIGINT not in [signal.SIGINT]:
            os.remove(pid_file)
