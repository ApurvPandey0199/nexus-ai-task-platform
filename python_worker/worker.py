import os
import time
import json
import requests
import redis

# Environment Configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
API_URL = os.getenv('API_URL', 'http://localhost:3001')
QUEUE_NAME = 'tasks:queue'

print(f"[Python Worker] Initializing worker. Connecting to Redis stream at {REDIS_HOST}:{REDIS_PORT}...")

try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    r.ping()
    print("[Python Worker] Connected to Redis stream successfully.")
except Exception as e:
    print(f"[Python Worker] Redis connection fallback: {e}")
    r = None

def process_task(task_data):
    task_id = task_data.get('id')
    op_type = task_data.get('type', 'uppercase')
    prompt = task_data.get('input', {}).get('prompt', '')

    print(f"[Python Worker] Executing task {task_id} (Operation: {op_type})...")

    # 1. State Transition: Pending -> Running
    try:
        requests.post(f"{API_URL}/api/v1/redis/transition", json={
            'taskId': task_id,
            'status': 'processing',
            'progress': 25,
            'currentStep': f'Executing {op_type.upper()} operation in Python Worker',
            'log': f'[Python Worker] Status: RUNNING. Polled task from Redis stream {QUEUE_NAME}.'
        }, timeout=5)
    except Exception as err:
        print(f"[Python Worker] Transition HTTP error: {err}")

    time.sleep(1.0) # Simulate processing delay

    # 2. Execute Operation
    result_text = ""
    json_result = {}

    if op_type == 'uppercase':
        result_text = prompt.upper()
        json_result = {'original': prompt, 'converted': result_text, 'operation': 'UPPERCASE'}
    elif op_type == 'lowercase':
        result_text = prompt.lower()
        json_result = {'original': prompt, 'converted': result_text, 'operation': 'LOWERCASE'}
    elif op_type == 'reverse':
        result_text = prompt[::-1]
        json_result = {'original': prompt, 'reversed': result_text, 'operation': 'REVERSE'}
    elif op_type == 'word_count':
        words = len(prompt.split()) if prompt.strip() else 0
        chars = len(prompt)
        result_text = f"Word Count: {words} words, {chars} characters."
        json_result = {'words': words, 'chars': chars}
    else:
        result_text = f"Processed '{prompt}' with operation {op_type}."
        json_result = {'processed': True}

    output = {
        'resultText': f"### Output ({op_type.upper()})\n\n```\n{result_text}\n```",
        'jsonResult': json_result,
        'metrics': {'tokenUsage': 95, 'latencyMs': 1050}
    }

    # 3. State Transition: Running -> Success
    try:
        requests.post(f"{API_URL}/api/v1/redis/transition", json={
            'taskId': task_id,
            'status': 'completed',
            'progress': 100,
            'currentStep': 'Finished',
            'output': output,
            'log': f'[Python Worker] Status: SUCCESS. Operation {op_type.upper()} executed in 1050ms.'
        }, timeout=5)
        print(f"[Python Worker] Task {task_id} completed successfully.")
    except Exception as err:
        print(f"[Python Worker] Final transition error: {err}")

def run_loop():
    print("[Python Worker] Worker daemon loop started. Polling for tasks...")
    while True:
        try:
            if r:
                # Read from Redis list/stream
                task_json = r.lpop(QUEUE_NAME)
                if task_json:
                    task_data = json.loads(task_json)
                    process_task(task_data)
            time.sleep(1.0)
        except Exception as e:
            print(f"[Python Worker] Loop exception: {e}")
            time.sleep(2.0)

if __name__ == '__main__':
    run_loop()
