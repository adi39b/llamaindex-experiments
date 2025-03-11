import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function NotesElement() {
  // Remember props are globally injected, not passed as arguments
  
  const deleteNote = (noteId) => {
    // Filter out the deleted note
    const updatedNotes = props.notes.filter(note => note.id !== noteId);
    // Update the element with the new notes array
    updateElement({...props, notes: updatedNotes});
  };

  return (
    <div className="w-full p-4">
      <h3 className="text-lg font-semibold mb-4">Recorded Notes</h3>
      
      {props.notes.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          No notes yet. Add a note by typing "/note" followed by your note text.
        </p>
      ) : (
        <ScrollArea className="h-[500px] w-full pr-4">
          <div className="flex flex-col gap-3">
            {props.notes.map((note) => (
              <Card key={note.id} className="p-3">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <p className="text-sm mb-2">{note.content}</p>
                    <p className="text-xs text-muted-foreground">{note.timestamp}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteNote(note.id)}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
