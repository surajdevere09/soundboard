"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // Handle sidebar visibility
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen); // Toggle sidebar on mobile

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div
      className={`h-full ${
        isOpen ? "w-64" : "w-20"
      } transition-width duration-300 bg-gray-800 text-white`}
    >
      {/* Toggle button on mobile */}
      <button
        onClick={toggleSidebar}
        className="sm:hidden text-white absolute top-5 right-5"
      >
        {/* <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg> */}
      </button>

      {/* Sidebar Links */}
      <div className="flex flex-col items-center mt-10 space-y-6">
        <Link legacyBehavior href="/dashboard">
          <a className="text-lg text-white hover:text-gray-300">
            {isOpen ? "Dashboard" : "🏠"}
          </a>
        </Link>

        <Link className="text-blue-600 underline" href="/room/new">
          Create New Room
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Log Out
      </button>
    </div>
  );
};

export default Sidebar;
