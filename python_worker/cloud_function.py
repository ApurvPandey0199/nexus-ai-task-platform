"""
Cloud Background Function (Google Cloud Functions / AWS Lambda Entrypoint)
Triggered asynchronously by Pub/Sub message or Redis Event Stream.
Handles background task dispatch, status transition logging, and Webhook HTTP POST callbacks.
"""

import json
import logging
import requests
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CloudBackgroundFunction")

def process_background_task_event(event, context=None):
    """
    Background Cloud Function Entrypoint
    """
    logger.info(f"Cloud Background Function invoked. Event ID: {getattr(context, 'event_id', 'evt-1001')}")

    try:
        # Parse Pub/Sub or HTTP Event Payload
        if isinstance(event, dict) and "data" in event:
            import base64
            data_str = base64.b64decode(event["data"]).decode("utf-8")
            payload = json.loads(data_str)
        else:
            payload = event

        task_id = payload.get("taskId")
        webhook_url = payload.get("webhookUrl")
        status = payload.get("status", "Success")

        logger.info(f"Processing background task event for Task ID '{task_id}' with status '{status}'")

        # Dispatch Webhook Callback if configured
        if webhook_url:
            logger.info(f"Dispatching Webhook notification to {webhook_url}")
            try:
                resp = requests.post(
                    webhook_url,
                    json={
                        "event": "task.completed",
                        "taskId": task_id,
                        "status": status,
                        "timestamp": payload.get("completedAt"),
                        "metrics": payload.get("metrics")
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
                logger.info(f"Webhook response status: {resp.status_code}")
            except Exception as w_err:
                logger.warning(f"Webhook dispatch failed to {webhook_url}: {w_err}")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "ok": True,
                "taskId": task_id,
                "status": status,
                "processedBy": "CloudBackgroundFunction-v2"
            })
        }

    except Exception as err:
        logger.error(f"Cloud Function execution error: {err}")
        return {
            "statusCode": 500,
            "body": json.dumps({"ok": False, "error": str(err)})
        }
