export default function NotesElement() {
  // In Chainlit custom elements, props and updateElement are globally available
  
  const deleteNote = (noteId) => {
    // Filter out the deleted note
    const updatedNotes = props.notes.filter(note => note.id !== noteId);
    // Update the element with the new notes array
    updateElement({...props, notes: updatedNotes});
  };

  return (
    <div className="w-full p-4">
      <h3 className="text-lg font-semibold mb-4">Recorded Notes</h3>
      
      {(!props.notes || props.notes.length === 0) ? (
        <p className="text-gray-500 text-sm italic">
          No notes yet. Add a note by typing "/note" followed by your note text.
        </p>
      ) : (
        <div className="max-h-[500px] overflow-auto pr-4">
          <div className="flex flex-col gap-3">
            {props.notes.map((note) => (
              <div key={note.id} className="border rounded p-3 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <p className="text-sm mb-2">{note.content}</p>
                    <p className="text-xs text-gray-500">{note.timestamp}</p>
                  </div>
                  <button 
                    className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => deleteNote(note.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
