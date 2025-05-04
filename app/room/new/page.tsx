"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreateRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("C");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user) return;

    const roomData = {
      title,
      bpm,
      key,
      isPublic,
      roomCode: generateRoomCode(),
      hostId: user.uid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "rooms"), roomData);
    router.push(`/room/${docRef.id}`);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Create Jam Room</h1>
      <form onSubmit={handleCreateRoom} className="space-y-4">
        <input
          type="text"
          placeholder="Room Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="BPM"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          {["C", "Dm", "F", "G", "Am", "Bb", "D"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public Room
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </form>
    </div>
  );
}
