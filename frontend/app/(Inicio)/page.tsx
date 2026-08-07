'use client'

import { motion } from "motion/react";
import { BookOpen, Sparkles, Star } from "lucide-react";
import { playfairdisplay } from "@/app/fonts";
import TypeWriter from "@/app/ui/Components/TypeWriter";
import BookSections from "@/app/ui/Components/BookSections";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fdfdfd] pb-20 overflow-hidden font-sans">
      {/* ── Banner Hero ───────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 box-border">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="
            relative w-full h-56 md:h-72
            rounded-[2.5rem]
            bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
            flex items-center justify-between
            px-8 md:px-16
            overflow-hidden
            shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
            box-border
          "
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent,_transparent)]" />

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="absolute -left-12 text-white/20"
          >
            <BookOpen strokeWidth={0.5} className="w-48 h-48 md:w-64 md:h-64" />
          </motion.div>

          <div className={`${playfairdisplay.className} z-10 text-center w-full flex-1`}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="
                text-3xl md:text-5xl
                font-[600] text-white
                tracking-wide leading-tight m-0
                font-[family-name:var(--font-playfair)]
                [text-shadow:0_4px_6px_rgba(0,0,0,0.2)]
              "
            >
              Descubre tu{' '}
              <TypeWriter
                options={{
                  strings: ['próxima lectura', 'nuevo mundo', 'siguiente aventura'],
                  autoStart: true,
                  loop: true,
                  deleteSpeed: 'natural',
                }}
              />
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="z-10 hidden md:flex flex-col items-center justify-center relative lg:right-10"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Star className="absolute -top-8 -left-8 text-yellow-200 w-5 h-5" />
              <Star className="absolute top-4 -right-12 text-pink-200 w-4 h-4 opacity-70" />
              <Star className="absolute -bottom-6 -left-4 text-white w-6 h-6 opacity-80" />
              <Sparkles className="absolute -bottom-8 right-0 text-yellow-200 w-8 h-8 opacity-60" />

              <div className="w-32 h-32 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
                <span className="text-[4.5rem] relative z-10 [filter:drop-shadow(0px_10px_15px_rgba(0,0,0,0.3))]">
                  👩🏻‍🏫
                </span>
                <motion.div
                  className="absolute -bottom-4 right-0 bg-white p-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                  initial={{ rotate: -20 }}
                  animate={{ rotate: 10 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                >
                  <BookOpen className="w-6 h-6 text-[#8553d1] block" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Secciones de libros ────────────────────────────── */}
      <BookSections />
    </div>
  );
}
