/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
// const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

import { UploadButton } from "@/utils/uploadthing"; // Import UploadButton

export default function RoomPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [loops, setLoops] = useState<any[]>([]);
  const [recording, setRecording] = useState(false);

  // Fetch room info
  useEffect(() => {
    if (!id) return;
    const fetchRoom = async () => {
      const docRef = doc(db, "rooms", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRoom(docSnap.data());
      }
    };
    fetchRoom();
  }, [id]);

  // Poll for loops every 5 seconds (collaboration sync)
  useEffect(() => {
    if (!id) return;
    const loopsQuery = query(collection(db, "rooms", id as string, "loops"));
    const unsubscribe = onSnapshot(loopsQuery, (snapshot) => {
      const newLoops = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLoops(newLoops);
    });
    return () => unsubscribe();
  }, [id]);

  // Handle audio upload
  const handleAudioUpload = async (fileUrl: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "rooms", id as string, "loops"), {
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      name: `Loop by ${user.email}`,
      audioUrl: fileUrl, // Store the URL after upload
      volume: 1,
      isActive: true,
    });
  };

  if (!room) return <div>Loading room...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">{room.title}</h1>
      <p className="text-gray-600">
        BPM: {room.bpm} | Key: {room.key} |{" "}
        {room.isPublic ? "Public" : "Private"}
      </p>

      <div className="my-6">
        <UploadButton
          endpoint="audioUploader"
          onClientUploadComplete={(res: any) => {
            if (res?.fileUrl) {
              handleAudioUpload(res?.fileUrl); // Call to save file URL in Firestore
            }
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}
        />
      </div>

      <h2 className="text-xl font-semibold mb-2">Loops</h2>
      {loops.length === 0 ? (
        <p>No loops yet. Start recording!</p>
      ) : (
        <ul className="space-y-4">
          {loops.map((loop) => (
            <li key={loop.id} className="border p-4 rounded">
              <div className="font-medium">{loop.name}</div>
              <div className="text-sm text-gray-600">By: {loop.userEmail}</div>
              {loop.audioUrl ? (
                <audio controls src={loop.audioUrl} className="mt-2 w-full" />
              ) : (
                <p className="text-sm text-red-500 mt-2">
                  Audio not yet uploaded
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
