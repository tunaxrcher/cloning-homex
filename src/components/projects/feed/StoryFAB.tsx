"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Video, X } from "lucide-react";
import type { StoryFABProps } from "@/lib/type";

export default function StoryFAB({ onUploadVideo, onRecordVideo }: StoryFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.05 }}
                onClick={() => {
                  setIsOpen(false);
                  onRecordVideo();
                }}
                className="flex items-center gap-3 bg-white dark:bg-zinc-800 shadow-lg rounded-full pl-4 pr-5 py-3 hover:bg-default-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Video size={20} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-default-700 whitespace-nowrap">
                  ถ่าย
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0 }}
                onClick={() => {
                  setIsOpen(false);
                  onUploadVideo();
                }}
                className="flex items-center gap-3 bg-white dark:bg-zinc-800 shadow-lg rounded-full pl-4 pr-5 py-3 hover:bg-default-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Upload size={20} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-default-700 whitespace-nowrap">
                  อัปโหลดวิดีโอ
                </span>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen((v) => !v)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
            isOpen
              ? "bg-default-800 dark:bg-zinc-600"
              : "bg-primary"
          }`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <Plus size={24} className="text-white" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
