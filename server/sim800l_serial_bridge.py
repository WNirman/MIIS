#!/usr/bin/env python3
"""
MIIS Local 2G GSM Modem Bridge (SIM800L / SIM7600 Serial -> MIIS Server)
========================================================================
Zero-subscription Sri Lanka harbour/lab receiver for offshore MIIS1 SMS beacons.
Connect a Rs. ~3,000 SIM800L GSM module (with any Dialog/Mobitel/Hutch SIM) via
USB-TTL to a Raspberry Pi or Windows PC, then run:

    pip install pyserial requests
    python server/sim800l_serial_bridge.py --port COM4 --api http://localhost:5000

How it works:
  - Polls unread GSM SMS messages every 5 seconds using AT+CMGL="REC UNREAD"
  - Filters packets beginning with "MIIS1|"
  - Forwards them to POST /api/sms/webhook/sim800l
  - Optionally sends a short confirmation SMS back to the fisher and clears SIM memory
"""

from __future__ import annotations

import argparse
import os
import re
import time
import urllib.request
import json

try:
    import serial  # type: ignore
except ImportError:
    serial = None


def send_at(ser, cmd: str, wait_s: float = 0.6) -> str:
    ser.write((cmd + "\r\n").encode("ascii"))
    time.sleep(wait_s)
    return ser.read(ser.in_waiting or 4096).decode("ascii", errors="ignore")


def forward_to_miis(api_base: str, secret: str, sender: str, body: str) -> dict:
    url = f"{api_base.rstrip('/')}/api/sms/webhook/sim800l"
    payload = json.dumps({"sender_msisdn": sender, "sms_packet": body}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if secret:
        headers["X-MIIS-SMS-Secret"] = secret
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_cmgl_response(raw: str):
    """Parse AT+CMGL='REC UNREAD' output into (slot_index, sender, body) tuples."""
    results = []
    pattern = re.compile(r'\+CMGL:\s*(\d+),"[^"]*","([^"]*)"[^\r\n]*\r?\n([^\r\n]+)')
    for m in pattern.finditer(raw):
        results.append((int(m.group(1)), m.group(2).strip(), m.group(3).strip()))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="MIIS SIM800L 2G Offshore SMS Bridge")
    parser.add_argument("--port", required=True, help="Serial port (e.g., COM4 on Windows or /dev/ttyUSB0 on Raspberry Pi)")
    parser.add_argument("--baud", type=int, default=9600, help="Modem baud rate (default: 9600)")
    parser.add_argument("--api", default="http://localhost:5000", help="MIIS server base URL")
    parser.add_argument("--poll", type=float, default=5.0, help="Polling interval in seconds")
    args = parser.parse_args()

    if serial is None:
        raise SystemExit("pyserial not installed. Run: pip install pyserial")

    secret = os.environ.get("MIIS_SMS_WEBHOOK_SECRET", "")
    print(f"[MIIS SIM800L] Connecting to {args.port} @ {args.baud} baud -> {args.api}")

    with serial.Serial(args.port, args.baud, timeout=2) as ser:
        send_at(ser, "AT")
        send_at(ser, "AT+CMGF=1")  # Text mode
        print("[MIIS SIM800L] Modem initialized in GSM text mode. Listening for MIIS1 offshore beacons...")

        while True:
            raw = send_at(ser, 'AT+CMGL="REC UNREAD"', wait_s=1.0)
            messages = parse_cmgl_response(raw)
            for slot, sender, body in messages:
                if "MIIS1|" in body.upper():
                    print(f"[MIIS SIM800L] Received offshore beacon from {sender}: {body}")
                    try:
                        resp = forward_to_miis(args.api, secret, sender, body)
                        print(f"[MIIS SIM800L] Ingested -> {resp.get('incident_id')} ({resp.get('decoded', {}).get('district', '')})")
                        send_at(ser, f"AT+CMGD={slot}")  # Free SIM slot after successful ingest
                    except Exception as exc:
                        print(f"[MIIS SIM800L] Forward error (keeping SMS in slot {slot}): {exc}")
            time.sleep(args.poll)


if __name__ == "__main__":
    main()
