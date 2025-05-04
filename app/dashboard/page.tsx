/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface JamRoom {
  id: string;
  title: string;
  bpm: number;
  key: string;
  isPublic: boolean;
  roomCode: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<JamRoom[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const q = query(
          collection(db, "rooms"),
          where("hostId", "==", firebaseUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const roomList: JamRoom[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as JamRoom[];
        setRooms(roomList);
      } else {
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <button
        onClick={handleLogout}
        className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Log Out
      </button>

      <h2 className="text-xl font-semibold mb-2">Your Jam Rooms</h2>
      {rooms.length === 0 ? (
        <p>
          No rooms yet.{" "}
          <Link className="text-blue-600 underline" href="/room/new">
            Create one
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {rooms.map((room) => (
            <li key={room.id} className="border p-4 rounded shadow">
              <div className="font-bold text-lg">{room.title}</div>
              <div className="text-sm text-gray-600">
                BPM: {room.bpm} | Key: {room.key} |{" "}
                {room.isPublic ? "Public" : "Private"}
              </div>
              <div className="mt-2">
                <Link
                  href={`/room/${room.id}`}
                  className="text-blue-600 underline"
                >
                  Open Room
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
