import chainlit as cl
from llama_index.core.agent import AgentRunner, ReActAgentWorker
from llama_index.llms.openai import OpenAI
from llama_index.core.tools import FunctionTool

# Define sample tools
def add(a: int, b: int) -> int:
    """Adds two integers and returns the result integer"""
    return a + b

def multiply(a: int, b: int) -> int:
    """Multiplies two integers and returns the result integer"""
    return a * b

@cl.on_chat_start
async def on_chat_start():
    # Initialize LLM
    llm = OpenAI(model="gpt-4")
    
    # Create function tools
    add_tool = FunctionTool.from_defaults(fn=add)
    multiply_tool = FunctionTool.from_defaults(fn=multiply)
    
    # Initialize the agent worker and runner
    agent_worker = ReActAgentWorker.from_tools([add_tool, multiply_tool], llm=llm)
    agent_runner = AgentRunner(agent_worker=agent_worker)
    
    # Store in user session
    cl.user_session.set("agent_runner", agent_runner)

@cl.on_message
async def on_message(message: cl.Message):
    # Get the agent runner from the session
    agent_runner = cl.user_session.get("agent_runner")
    
    # Create a task with the user's message
    task = await cl.make_async(agent_runner.create_task)(message.content)
    
    # Show thinking header
    thinking_msg = cl.Message(content="🤔 Processing your request...")
    await thinking_msg.send()
    
    # Process steps asynchronously
    is_done = False
    step_count = 1
    
    while not is_done:
        # Run a single step asynchronously
        step_output = await cl.make_async(agent_runner.run_step)(task.task_id)
        
        # Create a message with the complete step output text
        step_content = f"**Step {step_count}**\n\n"
        
        # Convert the complete step_output to string
        # This includes all the information without manually extracting components
        step_content += f"``````"
        
        # Send the step message
        step_msg = cl.Message(content=step_content, parent_id=thinking_msg.id)
        await step_msg.send()
        
        # Increment step counter
        step_count += 1
        
        # Check if this is the last step
        is_done = step_output.is_last
    
    # Get final response
    final_response = await cl.make_async(agent_runner.finalize_response)(task.task_id)
    
    # Send the final answer
    final_msg = cl.Message(content=f"**Final Answer**: {str(final_response)}")
    await final_msg.send()
