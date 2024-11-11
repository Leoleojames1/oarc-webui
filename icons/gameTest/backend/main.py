from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ollama import AsyncClient
import json
import asyncio

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GameState:
    def __init__(self):
        self.client = AsyncClient()
        
    async def generate_dialog(self, character_type, situation):
        prompt = f"""You are a {character_type} in a space trading game. 
        Current situation: {situation}
        Respond in character with a short dialog line and if trading, include available items as a JSON list.
        Keep responses under 100 words."""
        
        message = {'role': 'user', 'content': prompt}
        response = ""
        async for part in await self.client.chat(model='llama2', messages=[message], stream=True):
            response += part['message']['content']
        return response

game_state = GameState()

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)
            
            response = await game_state.generate_dialog(
                request.get('character_type', 'friendly alien'),
                request.get('situation', 'trading')
            )
            
            await websocket.send_text(response)
            
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)