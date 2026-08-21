"use client";

import { motion } from "motion/react";
import { BookOpen, Sparkles, Star } from "lucide-react";
import { playfairdisplay } from "@/app/fonts";
import TypeWriter from "@/app/ui/Components/TypeWriter";
import BookSections from "@/app/ui/Components/BookSections";
import Image from "next/image";
import GirlReading from "@/public/Librerio/bannerAsset-reading.png";

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
            relative w-full h-auto min-h-56 sm:h-64 md:h-72
            rounded-[2rem] sm:rounded-[2.5rem]
            bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
            flex items-center justify-center sm:justify-between
            px-6 sm:px-8 md:px-16 py-8 sm:py-10 md:py-0
            overflow-hidden
            shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
            box-border
          "
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent,_transparent)]" />

          {/* Decoración del libro (desktop): igual que siempre */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="hidden sm:block absolute -left-2 -top-2 md:-left-12 md:top-5 text-white/20"
          >
            <motion.div
              animate={{ y: [100, 90, 100], x: [0, 3, 0]}}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className=""
            >
              <Star className="absolute -top-22   right-8 text-cyan-200 w-4 h-4 opacity-70" />
              <Star className="absolute -top-22 -right-10 text-white w-6 h-6 opacity-80" />
              <Star className="absolute -top-20  right-1 text-yellow-200 w-5 h-5" />
              <Star className="absolute -top-8   -right-5 text-pink-200 w-4 h-4 opacity-70" />
              <Star className="absolute -bottom-40 -right-10 text-white w-6 h-6 opacity-80" />
              <Star className="absolute -bottom-38 right-10 text-violet-300 w-6 h-6 opacity-80" />
              <Star className="absolute -bottom-20  -right-14 text-blue-400 w-5 h-5" />
              <Star className="absolute -bottom-32   -right-5 text-pink-200 w-4 h-4 opacity-70" />
            </motion.div>
            <BookOpen strokeWidth={0.5} className="w-48 h-48 md:w-64 md:h-64" />
          </motion.div>

{/* Decoración del libro (móvil): versión pequeña en la esquina SUPERIOR
              izquierda, sutil (opacity 10%) — no choca con el texto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="sm:hidden absolute top-2 left-3 text-white/10"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Star className="absolute -top-0.2 -right-3 text-white w-4 h-4 opacity-70" />
              <Star className="absolute -bottom-1 -right-3 text-pink-200 w-2.5 h-2.5 opacity-70" />
              <Star className="absolute -bottom-4 right-1 text-violet-300 w-4 h-4 opacity-80" />
              <Star className="absolute -bottom-2 left-1 text-cyan-200 w-3 h-3 opacity-70" />

              <BookOpen strokeWidth={0.5} className="w-16 h-16" />
            </motion.div>
          </motion.div>

          {/* Imagen del banner (móvil): parte inferior derecha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="sm:hidden absolute bottom-2 right-2"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="absolute top-2 -left-8 text-yellow-200 w-2.5 h-2.5" />
              <Star className="absolute -top-3   right-1 text-pink-200 w-3 h-3 opacity-70" />
              <Star className="absolute -bottom-1 -left-4 text-white w-4 h-4 opacity-80" />
              <Star className="absolute top-6 -left-2 text-violet-300 w-2 h-2 opacity-80" />
              <Star className="absolute top-6   -right-1 text-cyan-200 w-3 h-3 opacity-70" />

              <Image
                src={GirlReading}
                alt="BannerImage"
                className="relative w-28 h-auto z-10 [filter:drop-shadow(0px_6px_10px_rgba(150,100,250,0.6))]"
              />
            </motion.div>
          </motion.div>

          <div
            className={`${playfairdisplay.className} z-10 text-center w-full flex-1`}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="
                text-3xl sm:text-4xl md:text-5xl
                font-[600] text-white
                tracking-wide leading-snug m-0
                font-[family-name:var(--font-playfair)]
                [text-shadow:0_4px_6px_rgba(0,0,0,0.2)]
              "
            >
              Descubre tu{" "}
              <TypeWriter
                options={{
                  strings: [
                    "próxima lectura",
                    "nuevo mundo",
                    "siguiente aventura",
                  ],
                  autoStart: true,
                  loop: true,
                  deleteSpeed: "natural",
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
              animate={{ y: [0, -10, 0], x: [0, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Star className="absolute -top-2 -left-8 text-yellow-200 w-5 h-5" />
              <Star className="absolute top-4   -right-12 text-pink-200 w-4 h-4 opacity-70" />
              <Star className="absolute -bottom-3 -left-4 text-white w-6 h-6 opacity-80" />
              <Star className="absolute top-6 -left-2 text-violet-300 w-6 h-6 opacity-80" />
              <Star className="absolute top-8   -right-6 text-cyan-200 w-4 h-4 opacity-70" />
              <Sparkles className="absolute -bottom-8 right-0 text-yellow-200 w-8 h-8 opacity-60" />

              <div className="w-50 h-50 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
                <Image
                  src={GirlReading}
                  alt="BannerImage"
                  className="relative w-500 h-36 z-10 [filter:drop-shadow(0px_10px_15px_rgba(150,100,250,1))]"
                />
                <motion.div
                  className="absolute -bottom-1 right-0 bg-white p-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
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
