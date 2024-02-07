import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface';
import { Firestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from '@angular/fire/firestore';
import { Observable, elementAt } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = []
  normalNotes: Note[] = []
  normalMarkedNotes: Note[] = []

  unsubTrash: any;
  unsubNotes: any;
  unsubMarkedNotes: any;


  firestore: Firestore = inject(Firestore)

  constructor() {
    this.unsubTrash = this.subTrashList();
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
  }

  async addNote(item: Note, colId: "notes" | "trash") {
    if(colId == "notes")await addDoc(this.getNotesRef(), item)
    if(colId == "trash")await addDoc(this.getTrashRef(), item)
    
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id)
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        (err) => { console.log(err); }
      ).then()
    }
  }

  async deleteNote(calId: string, docId: string) {
    await deleteDoc(this.getSingleDocRef(calId, docId)).catch(
      (err) => { console.log(err) }
    )
  }

  getColIdFromNote(note: Note) {
    if (note.type == 'note') return 'notes'
    else return 'trash'
  }

  getCleanJson(note: Note) {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    }
  }

  ngonDestroy() {
    this.unsubNotes();
    this.unsubTrash()
    this.unsubMarkedNotes()
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = []
      list.forEach(element => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id))
        console.log(element)
      })
    })
  }

  subNotesList() {
    const q = query(this.getNotesRef(), limit(5))
    return onSnapshot(q, (list) => {
      this.normalNotes = []
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id))
        console.log(element)
      })
    })
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where("marked", "==", true), limit(100))
    return onSnapshot(q, (list) => {
      this.normalMarkedNotes = []
      list.forEach(element => {
        this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id))
        console.log(element)
      })
    })
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id || "",
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false
    }
  }

  getNotesRef() {
    console.log(collection(this.firestore, 'notes'))
    return collection(this.firestore, 'notes')
  }

  getTrashRef() {
    console.log(collection(this.firestore, 'trash'))
    return collection(this.firestore, 'trash')
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId)
  }
}
