"""清理 Redis Stream 中的所有任务消息"""
import redis

def clean_stream():
    r = redis.Redis(host='localhost', port=6379, db=0)
    
    stream_name = 'travelmaster:ai:tasks'
    
    # 1. 检查 Stream 是否存在
    if not r.exists(stream_name):
        print(f"✅ Stream '{stream_name}' does not exist")
        return
    
    # 2. 获取消息数量
    count = r.xlen(stream_name)
    print(f"📊 Found {count} messages in stream")
    
    # 3. 删除所有消息
    deleted = r.delete(stream_name)
    print(f"🗑️  Deleted {deleted} stream(s)")
    
    # 4. 验证
    remaining = r.xlen(stream_name)
    if remaining == 0:
        print("✅ Stream cleaned successfully!")
    else:
        print(f"⚠️  Warning: {remaining} messages still remain")

if __name__ == "__main__":
    clean_stream()
