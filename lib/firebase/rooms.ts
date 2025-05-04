/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const createRoom = async (roomData: any) => {
  const docRef = await addDoc(collection(db, "rooms"), {
    ...roomData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
