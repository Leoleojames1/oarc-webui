# example_minecraft_assistant.py

import os
import sys

# Add the parent directory to Python path to find the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ollama_chatbot_base import ollama_chatbot_base

def run_minecraft_assistant():
    # Initialize the base chatbot
    minecraft_bot = ollama_chatbot_base()
    
    # Basic configuration
    minecraft_bot.set_model("llama2")  # or your preferred model
    
    # Enable vision mode for Minecraft
    minecraft_bot.llava_flag = True
    minecraft_bot.vision_model = "llava"  # Set default vision model
    
    # Load Minecraft agent prompts
    minecraft_bot.agent_prompt_library()
    minecraft_bot.agent_dict = minecraft_bot.minecraft_agent
    minecraft_bot.LLM_SYSTEM_PROMPT_FLAG = True
    minecraft_bot.LLM_BOOSTER_PROMPT = True
    minecraft_bot.VISION_SYSTEM_PROMPT = True
    minecraft_bot.VISION_BOOSTER_PROMPT = True
    
    # Optional: Set up voice with C3PO
    minecraft_bot.set_voice("fine_tuned", "C3PO")
    minecraft_bot.leap_flag = False  # Enable TTS
    
    print("Minecraft Assistant Ready!")
    print("Available commands:")
    minecraft_bot.cmd_list()
    
    # Main interaction loop
    while True:
        try:
            # Take screenshot before each interaction
            if minecraft_bot.llava_flag:
                minecraft_bot.screen_shot_flag = minecraft_bot.screen_shot_collector_instance.get_screenshot()
            
            # Get user input
            user_input = input("> ")
            
            # Check if it's a command
            if user_input.startswith('/'):
                cmd_result = minecraft_bot.command_select(user_input)
                if cmd_result:
                    continue
            
            # Send to LLM and get response
            response = minecraft_bot.send_prompt(user_input)
            print(f"Assistant: {response}")
            
        except KeyboardInterrupt:
            print("\nShutting down...")
            break
        except Exception as e:
            print(f"Error: {e}")
            continue

if __name__ == "__main__":
    run_minecraft_assistant()
    
    
    
    
"""
Here's how to create variations for different purposes:

For a voice-only assistant:

# Configure voice-only mode
assistant = ollama_chatbot_base()
assistant.set_model("phi3")
assistant.listen_flag = True
assistant.set_voice("reference", "assistant")
assistant.leap_flag = False
assistant.setup_hotkeys()  # Enable hotkey controls

For a LaTeX math tutor:

# Configure LaTeX support
tutor = ollama_chatbot_base()
tutor.set_model("phi3")
tutor.latex_flag = True
tutor.agent_dict = tutor.phi3_speed_chat_agent

For a multi-modal navigator:
# Configure vision + speech
navigator = ollama_chatbot_base()
navigator.llava_flag = True
navigator.listen_flag = True
navigator.leap_flag = False
"""