import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";

export const uploadLoop = async (
  roomId: string,
  blob: Blob,
  fileName: string
) => {
  const fileRef = ref(storage, `loops/${roomId}/${fileName}`);
  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);
  return url;
};

export const saveLoopMeta = async (roomId: string, loopData: any) => {
  await addDoc(collection(db, `rooms/${roomId}/loops`), loopData);
};
