import chainlit as cl

@cl.on_chat_start
async def start():
    # Initialize an empty notes list
    notes_element = cl.CustomElement(
        name="NotesElement",
        props={"notes": []},
        display="side"  # This will display the element on the side
    )
    
    # Store the element in the user session for later updates
    cl.user_session.set("notes_element", notes_element)
    
    # Send a welcome message with the notes element attached
    await cl.Message(
        content="Welcome! I'll keep track of your notes on the side panel.",
        elements=[notes_element]
    ).send()

@cl.on_message
async def on_message(message: cl.Message):
    # Get the existing notes element from the session
    notes_element = cl.user_session.get("notes_element")
    
    # Check if the message is adding a note
    if message.content.startswith("/note "):
        # Extract the note content
        note_content = message.content[6:].strip()
        
        # Add the new note to the existing notes
        current_notes = notes_element.props["notes"]
        current_notes.append({
            "id": len(current_notes),
            "content": note_content,
            "timestamp": cl.utils.format_datetime()
        })
        
        # Update the element with the new notes
        await notes_element.update()
        
        await cl.Message(content=f"Note added: '{note_content}'").send()
    else:
        # Normal message processing
        await cl.Message(content=f"Received: {message.content}").send()
