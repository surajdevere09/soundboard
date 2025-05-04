/* eslint-disable @typescript-eslint/no-unused-vars */
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

// Initialize Uploadthing
const f = createUploadthing();

// Fake auth function (replace with real authentication logic)
const auth = (req: Request) => ({ id: "fakeId" }); // Replace with your actual user authentication logic

// Define the FileRouter for audio uploads
export const ourFileRouter = {
  audioUploader: f({
    audio: {
      maxFileSize: "16MB", // Adjust max file size for audio
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req); // Authentication check
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id }; // Return user metadata
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }; // Send file URL to client
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
