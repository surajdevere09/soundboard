import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate the UploadButton component based on the file router
export const UploadButton = generateUploadButton<OurFileRouter>();
