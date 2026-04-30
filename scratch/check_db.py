import mysql.connector
import sys

def check_db():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="password",
            database="travelmaster",
            port=3306
        )
        cursor = conn.cursor(dictionary=True)
        
        print("--- Checking Recent Tasks ---")
        cursor.execute("SELECT id, status, itinerary_id, user_id, created_at FROM itinerary_tasks ORDER BY created_at DESC LIMIT 5")
        tasks = cursor.fetchall()
        for t in tasks:
            print(f"TASK ID: {t['id']}, STATUS: {t['status']}, ITIN_ID: {t['itinerary_id']}, USER: {t['user_id']}")
            
        print("\n--- Checking Recent Itineraries ---")
        cursor.execute("SELECT id, title, user_id, created_at FROM itineraries ORDER BY created_at DESC LIMIT 5")
        itins = cursor.fetchall()
        for i in itins:
            print(f"ITIN ID: {i['id']}, TITLE: {i['title']}, USER: {i['user_id']}")
            
        conn.close()
    except Exception as e:
        print(f"FAILED to connect to DB: {e}")

if __name__ == "__main__":
    check_db()
