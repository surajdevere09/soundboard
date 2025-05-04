import { db } from "@/lib/firebase";
import { doc, increment, setDoc } from "firebase/firestore";

export const updateStats = async (userId: string, field: string) => {
  const statsRef = doc(db, "users", userId, "stats", "global");
  await setDoc(
    statsRef,
    {
      [field]: increment(1),
    },
    { merge: true }
  );
};
