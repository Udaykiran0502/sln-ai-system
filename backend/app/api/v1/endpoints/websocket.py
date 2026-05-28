import asyncio
import json
import random
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
  def __init__(self):
    self.active_connections: List[WebSocket] = []
    self.project_states: Dict[str, dict] = {}

  async def connect(self, websocket: WebSocket):
    await websocket.accept()
    self.active_connections.append(websocket)

  def disconnect(self, websocket: WebSocket):
    if websocket in self.active_connections:
      self.active_connections.remove(websocket)

  async def broadcast(self, message: dict, exclude: WebSocket = None):
    payload = json.dumps(message)
    for connection in self.active_connections:
      if connection != exclude:
        try:
          await connection.send_text(payload)
        except Exception:
          # Handle broken connections gracefully
          pass

manager = ConnectionManager()

async def simulate_system_telemetry(websocket: WebSocket):
  """
  Simulate server hardware telemetry to show real-time changes
  on the frontend dials (CPU, RAM, latency, export queue).
  """
  try:
    while True:
      # Generate random realistic developer environment metrics
      cpu = random.randint(12, 45)
      ram = random.randint(34, 62)
      queue = random.randint(0, 2)
      latency = random.randint(8, 25)

      await websocket.send_text(json.dumps({
        "type": "TELEMETRY_UPDATE",
        "payload": {
          "cpuUsage": cpu,
          "ramUsage": ram,
          "queueLength": queue,
          "latency": latency
        }
      }))

      # Send a mock engine status message occasionally
      if random.random() < 0.2:
        await websocket.send_text(json.dumps({
          "type": "LOG_MESSAGE",
          "payload": {
            "text": f"[Engine] HarfBuzz text shaping cache: {random.randint(94, 99)}% hit rate."
          }
        }))

      await asyncio.sleep(4.0)
  except asyncio.CancelledError:
    pass
  except Exception as e:
    print(f"Telemetry simulation error: {e}")

@router.websocket("/ws/production")
async def websocket_production_endpoint(websocket: WebSocket):
  await manager.connect(websocket)
  print(f"[WebSocket] Client connected: {websocket.client}")

  # Spawn the simulated system telemetry task in the background
  telemetry_task = asyncio.create_task(simulate_system_telemetry(websocket))

  try:
    while True:
      data = await websocket.receive_text()
      message = json.loads(data)

      # Log event receipt in terminal
      print(f"[WebSocket] Event: {message.get('type')}")

      if message.get("type") == "INITIAL_SYNC":
        payload = message.get("payload", {})
        project_id = payload.get("projectId")
        
        # Save initial state in cache if not present
        if project_id not in manager.project_states:
          manager.project_states[project_id] = payload.get("sceneGraph", [])
        
        # Acknowledge connection
        await websocket.send_text(json.dumps({
          "type": "LOG_MESSAGE",
          "payload": {
            "text": f"[Server] Sync active for project '{project_id}'."
          }
        }))
        
      elif message.get("type") == "SCENE_UPDATE":
        payload = message.get("payload", {})
        project_id = payload.get("projectId")
        scene_graph = payload.get("sceneGraph", [])
        
        # Update server state cache
        manager.project_states[project_id] = scene_graph
        
        # Broadcast updated scene to all OTHER active designers (Desktop <-> Laptop sync)
        await manager.broadcast({
          "type": "SCENE_SYNC",
          "payload": {
            "projectId": project_id,
            "sceneGraph": scene_graph
          }
        }, exclude=websocket)

  except WebSocketDisconnect:
    manager.disconnect(websocket)
    print(f"[WebSocket] Client disconnected")
  finally:
    # Always cancel background telemetry when client disconnects
    telemetry_task.cancel()
