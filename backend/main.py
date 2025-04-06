# Mind Map/backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import time # Added time import

app = FastAPI()

# --- CORS Configuration --- 
# Allow requests from the frontend development server
origins = [
    "http://localhost:5173", # Default Vite dev server port for Mind Map
    "http://127.0.0.1:5173",
    # Add other origins if needed (e.g., deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class WordNode(BaseModel):
    id: str # Could be the word itself or a unique ID
    word: str
    parent_id: Optional[str] = None # ID of the word it connects to

class GameState(BaseModel):
    game_id: str
    puzzle_id: str
    start_word: str
    theme: str
    time_limit_seconds: int
    start_time: Optional[float] = None # To track elapsed time
    nodes: Dict[str, WordNode] = {} # Stores the mind map nodes (id: node)
    connections: List[tuple[str, str]] = [] # Stores connections (parent_id, child_id)
    score: int = 0
    is_active: bool = True

class ConnectionRequest(BaseModel):
    parent_node_id: str
    new_word: str

# --- Placeholder Data & Game State ---

# In a real app, this would come from a database
initial_puzzles = {
    "puzzle_1": {
        "start_word": "Technology",
        "theme": "General",
        "time_limit_seconds": 180, # 3 minutes
    },
    "puzzle_daily_free": {
        "start_word": "Nature",
        "theme": "Daily Free",
        "time_limit_seconds": 120, # 2 minutes
    },
    # Add more puzzles, potentially loading from a file/DB
}

# In-memory storage for active games (replace with DB later)
active_games: Dict[str, GameState] = {}
next_game_id = 1 # Simple counter for unique game IDs

# --- API Endpoints --- 

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Mind Map Game Backend!"}

@app.get("/puzzles/{puzzle_id}")
async def get_puzzle_data(puzzle_id: str):
    """Endpoint to fetch data for a specific puzzle (e.g., start word, time limit)."""
    if puzzle_id in initial_puzzles:
        return initial_puzzles[puzzle_id]
    # TODO: Add logic to fetch from database for other puzzle IDs
    # TODO: Check if puzzle is premium and if user has access
    # raise HTTPException(status_code=404, detail="Puzzle not found or not accessible")
    # Return 404 if puzzle not found in placeholder data
    raise HTTPException(status_code=404, detail="Puzzle not found")

# --- Endpoint to START a game, which creates a GameState ---
# Example placeholder for how starting a game might look:
@app.post("/puzzles/{puzzle_id}/start", response_model=GameState)
async def start_game(puzzle_id: str):
    global next_game_id # Ensure we modify the global counter
    if puzzle_id not in initial_puzzles:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    puzzle_data = initial_puzzles[puzzle_id]
    game_id = f"game_{next_game_id}"
    next_game_id += 1

    # Simple ID = word for now, ensure it's unique within the game context
    start_node_id = puzzle_data["start_word"]
    start_node = WordNode(id=start_node_id, word=puzzle_data["start_word"])

    new_game = GameState(
        game_id=game_id,
        puzzle_id=puzzle_id,
        start_word=puzzle_data["start_word"],
        theme=puzzle_data["theme"],
        time_limit_seconds=puzzle_data["time_limit_seconds"],
        start_time=time.time(), # Record the start time
        nodes={start_node.id: start_node}, # Initialize with the start node
        connections=[],
        is_active=True # Game starts as active
    )
    active_games[game_id] = new_game # Store the new game state
    print(f"Started game {game_id} for puzzle {puzzle_id}") # Optional: Log game start
    return new_game

# --- Helper Functions (Add Validation Logic Here) ---

def validate_connection_logic(parent_word: str, new_word: str) -> bool:
    """Placeholder for validating the logical connection between two words.

    TODO: Implement actual validation logic.
    Examples:
    - Check if new_word exists in a dictionary (e.g., using nltk, PyDictionary).
    - Check semantic relatedness (e.g., using word embeddings, thesaurus API).
    - Check against puzzle theme rules.
    """
    # Basic placeholder: Check length (e.g., > 2 characters)
    if len(new_word) <= 2:
        print(f"Validation failed: Word '{new_word}' is too short.")
        return False

    # Basic placeholder: Prevent simple plurals (add 's') - very naive
    if new_word.lower() == parent_word.lower() + 's':
         print(f"Validation failed: Word '{new_word}' is just a plural of '{parent_word}'.")
         return False

    # Assume valid for now if basic checks pass
    print(f"Validation PASSED (placeholder) for: {parent_word} -> {new_word}")
    return True

# --- NEW Endpoint to add a word connection ---
@app.post("/games/{game_id}/connect", response_model=GameState)
async def add_connection(game_id: str, connection: ConnectionRequest):
    """Endpoint to add a new word connection to an active game."""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")

    game = active_games[game_id]

    # --- Time limit check --- # Check this *before* checking is_active potentially?
    # If the game has a start time and limit, check if time is up.
    if game.start_time and game.time_limit_seconds > 0: # Check if time limit is actually set
        elapsed_time = time.time() - game.start_time
        if elapsed_time > game.time_limit_seconds:
            if game.is_active: # Only update and log once
                print(f"Game {game_id} ended due to time limit.")
                game.is_active = False
                 # Potentially save final state to DB here in a real app
            raise HTTPException(status_code=400, detail="Time limit exceeded")

    # Now check if the game is marked inactive for other reasons (or became inactive due to time)
    if not game.is_active:
        raise HTTPException(status_code=400, detail="Game is no longer active")

    # --- TODO: Time limit check --- # Removed comment as it's now implemented above
    # if time.time() - game.start_time > game.time_limit_seconds:
    #     game.is_active = False
    #     raise HTTPException(status_code=400, detail="Time limit exceeded")

    parent_node_id = connection.parent_node_id
    new_word = connection.new_word.strip().lower() # Standardize to lower case

    if parent_node_id not in game.nodes:
        raise HTTPException(status_code=400, detail=f"Parent node '{parent_node_id}' not found in the map")

    parent_node = game.nodes[parent_node_id]

    if not new_word:
        raise HTTPException(status_code=400, detail="New word cannot be empty")

    # --- Simple Validation Logic Checks ---
    if new_word == parent_node.word.lower(): # Compare lower case
         raise HTTPException(status_code=400, detail="Cannot connect a word to itself")

    # Check if word already exists in the map (using lower case for comparison)
    # Use the word itself as the ID for simplicity for now (standardized to lower case)
    new_node_id = new_word
    if new_node_id in game.nodes:
         raise HTTPException(status_code=400, detail=f"Word '{new_word}' already exists in the map")

    # --- Advanced Validation Logic (Using Placeholder Function) ---
    if not validate_connection_logic(parent_node.word, new_word):
        # Use a more specific error message if desired, based on validation failure reason
        raise HTTPException(status_code=400, detail=f"Connection between '{parent_node.word}' and '{new_word}' is not considered valid.")

    # --- Update Game State ---
    # new_node_id is already defined above (as lower case new_word)
    new_node = WordNode(id=new_node_id, word=connection.new_word.strip(), parent_id=parent_node_id) # Store original case word
    game.nodes[new_node_id] = new_node
    game.connections.append((parent_node_id, new_node_id))

    # --- Scoring Logic ---
    # Award points based on the length of the new word
    word_score = len(new_node.word)
    game.score += word_score
    print(f"Game {game_id}: Added '{new_node.word}' connected to '{parent_node.word}'. Score +{word_score} (Total: {game.score})")

    return game

# --- TODO: Add more endpoints later --- 
# POST /validate_connection: Check if a new word connection is valid (logic TBD - AI? Dictionary? Simple check?)
# POST /submit_score: Record player scores
# POST /users/register: User registration
# POST /token: User login (OAuth2 password flow)
# GET /users/me: Get current user info
# GET /puzzles/premium: List available premium puzzles
# POST /subscribe: Handle Stripe checkout/subscription

# --- Run the application (for local development) ---
if __name__ == "__main__":
    import uvicorn
    print(f"Starting Mind Map Backend server on http://127.0.0.1:8001") # Use a different port
    uvicorn.run(app, host="127.0.0.1", port=8001) # Note: Port 8001 