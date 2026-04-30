import redis
import sys

def check_redis():
    try:
        r = redis.from_url("redis://localhost:6379/0")
        stream_key = "travelmaster:ai:tasks"
        
        print(f"--- Checking Redis Stream: {stream_key} ---")
        # Check if stream exists
        if not r.exists(stream_key):
            print(f"Error: Stream '{stream_key}' does not exist!")
            return

        # Get last 5 messages
        messages = r.xrevrange(stream_key, count=5)
        print(f"Found {len(messages)} recent messages:")
        for msg_id, data in messages:
            print(f"  ID: {msg_id}, Data: {data}")
            
        print("--- End of Report ---")
    except Exception as e:
        print(f"FAILED to connect to Redis: {e}")

if __name__ == "__main__":
    check_redis()
