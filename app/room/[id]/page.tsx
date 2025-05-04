/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { generateReactHelpers, UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function RoomPage() {
  const { useUploadThing } = generateReactHelpers<OurFileRouter>();
  const { id } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [loops, setLoops] = useState<any[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const { startUpload } = useUploadThing("audioUploader");

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

  // Listen for loop changes
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

  // Sync playback every 20s
  useEffect(() => {
    if (!playing || loops.length === 0) return;

    const playAll = () => {
      loops.forEach((loop) => {
        const audio = audioRefs.current[loop.id];
        if (audio && loop.isActive && audio.readyState >= 2) {
          audio.currentTime = 0;
          audio.play();
        }
      });
    };

    playAll(); // Play immediately
    const interval = setInterval(playAll, 20000); // Play every 20s

    return () => clearInterval(interval);
  }, [playing, loops]);

  const handleAudioUpload = async (res: any) => {
    const fileUrl = res?.[0]?.ufsUrl;
    if (!fileUrl) return;

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "rooms", id as string, "loops"), {
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      name: `Loop by ${user.email}`,
      audioUrl: fileUrl,
      volume: 1,
      isActive: true,
    });
  };

  const handleRecordLoop = async () => {
    const user = auth.currentUser;
    if (!user || !navigator.mediaDevices) return;

    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setRecording(false);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 20000); // record 20s max
    } catch (err) {
      console.error("Recording error", err);
      setRecording(false);
    }
  };

  const handleManualUpload = async () => {
    if (!previewFile) return;
    const res = await startUpload([previewFile]);
    await handleAudioUpload(res);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    return []; // prevent auto upload
  };

  const handlePlayPause = (loopId: string) => {
    const audio = audioRefs.current[loopId];
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setLoops((prevLoops) =>
        prevLoops.map((loop) =>
          loop.id === loopId ? { ...loop, isPlaying: true } : loop
        )
      );
    } else {
      audio.pause();
      setLoops((prevLoops) =>
        prevLoops.map((loop) =>
          loop.id === loopId ? { ...loop, isPlaying: false } : loop
        )
      );
    }
  };

  const handleVolumeChange = (loopId: string, newVolume: number) => {
    const audio = audioRefs.current[loopId];
    if (!audio) return;

    audio.volume = newVolume; // Set the volume of the audio element
    setLoops((prevLoops) =>
      prevLoops.map((loop) =>
        loop.id === loopId ? { ...loop, volume: newVolume } : loop
      )
    );
  };

  useEffect(() => {
    if (!playing || loops.length === 0) return;

    const playAll = () => {
      loops.forEach((loop) => {
        const audio = audioRefs.current[loop.id];
        if (audio && loop.isActive && loop.isPlaying && audio.readyState >= 2) {
          audio.currentTime = 0;
          audio.play();
        }
      });
    };

    playAll(); // Play immediately
    const interval = setInterval(playAll, 20000); // Play every 20s

    return () => clearInterval(interval);
  }, [playing, loops]);

  const toggleLoopActive = async (loopId: string, current: boolean) => {
    const docRef = doc(db, "rooms", id as string, "loops", loopId);
    await updateDoc(docRef, { isActive: !current });
  };

  const handleDeleteLoop = async (loopId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this loop?");
    if (!confirmDelete) return;

    const docRef = doc(db, "rooms", id as string, "loops", loopId);
    await deleteDoc(docRef);
  };

  if (!room) return <div>Loading room...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">{room.title}</h1>
      <p className="text-gray-600">
        BPM: {room.bpm} | Key: {room.key} |{" "}
        {room.isPublic ? "Public" : "Private"}
      </p>

      <div className="my-6 space-x-4">
        <button
          onClick={handleRecordLoop}
          disabled={recording}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {recording ? "Recording..." : "🎙️ Record 20s"}
        </button>

        {/* File selector (no auto-upload) */}
        {/* @ts-ignore */}
        <UploadButton
          endpoint={"audioUploader"}
          onBeforeUploadBegin={(files: any) =>
            handleFileSelect(files as File[])
          }
          onUploadError={(error: Error) =>
            console.log(`ERROR! ${error.message}`)
          }
        />

        <button
          onClick={() => setPlaying((prev) => !prev)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {playing ? "⏸ Stop Loop" : "▶️ Start Loop"}
        </button>
      </div>

      {/* Audio Preview & Upload Button */}
      {previewUrl && (
        <div className="mt-4">
          <h3 className="font-medium mb-1">Preview</h3>
          <audio controls src={previewUrl} className="w-full" />
          <button
            onClick={handleManualUpload}
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Upload Preview
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2 mt-6">Loops</h2>
      {loops.length === 0 ? (
        <p>No loops yet. Start recording or upload!</p>
      ) : (
        <ul className="space-y-4">
          {/* {loops.map((loop) => (
            <li key={loop.id} className="border p-4 rounded">
              <div className="font-medium">{loop.name}</div>
              <div className="text-sm text-gray-600">By: {loop.userEmail}</div>
              {loop.audioUrl ? (
                <audio
                  controls
                  src={loop.audioUrl}
                  ref={(el) => (audioRefs.current[loop.id] = el)}
                  className="mt-2 w-full"
                />
              ) : (
                <p className="text-red-500 mt-2">No audio</p>
              )}
              <button
                onClick={() => toggleLoopActive(loop.id, loop.isActive)}
                className="mt-2 text-sm text-blue-600 underline"
              >
                {loop.isActive ? "Mute" : "Unmute"}
              </button>
            </li>
          ))} */}
          {loops.length === 0 ? (
            <p>No loops yet. Start recording or upload!</p>
          ) : (
            <ul className="space-y-4">
              {loops.map((loop) => (
                <li key={loop.id} className="border p-4 rounded">
                  <div className="font-medium">{loop.name}</div>
                  <div className="text-sm text-gray-600">
                    By: {loop.userEmail}
                  </div>
                  {loop.audioUrl ? (
                    <div>
                      <audio
                        controls
                        src={loop.audioUrl}
                        ref={(el) => (audioRefs.current[loop.id] = el) as any}
                        className="mt-2 w-full"
                        style={{
                          opacity: loop.isActive ? 1 : 0.5, // Dim the audio if not active
                        }}
                      />
                      <div className="flex space-x-4 mt-2">
                        <button
                          onClick={() => handlePlayPause(loop.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          {loop.isPlaying ? "⏸ Pause" : "▶️ Play"}
                        </button>
                      </div>

                      <div className="mt-2">
                        <label
                          htmlFor={`volume-${loop.id}`}
                          className="block text-sm font-medium text-gray-700"
                        >
                          Volume
                        </label>
                        <input
                          id={`volume-${loop.id}`}
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={loop.volume}
                          onChange={(e) =>
                            handleVolumeChange(
                              loop.id,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-500 mt-2">No audio</p>
                  )}
                  <button
                    onClick={() => toggleLoopActive(loop.id, loop.isActive)}
                    className="mt-2 text-sm text-blue-600 underline"
                  >
                    {loop.isActive ? "Mute" : "Unmute"}
                  </button>
                  {/* <button
                    onClick={() => toggleLoopActive(loop.id, loop.isActive)}
                    className="mt-2 mr-2 text-sm text-blue-600 underline"
                  >
                    {loop.isActive ? "Mute" : "Unmute"}
                  </button> */}

                  <button
                    onClick={() => handleDeleteLoop(loop.id)}
                    className="mt-2 text-sm text-red-600 underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ul>
      )}
    </div>
  );
}
