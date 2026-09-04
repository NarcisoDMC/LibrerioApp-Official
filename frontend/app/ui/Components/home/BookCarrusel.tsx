'use client'

import { useState } from "react";
import { motion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCard, { type Book } from "./BookCard";

export default function BookCarousel({ title, books, categoryKey, loading }: { title: string; books: Book[]; categoryKey: string; loading: boolean }) {
    /* Instancia del carrusel para controlar la navegación */
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    return (
        <div className="w-full max-w-7xl mx-auto mt-12 sm:mt-16 px-4 sm:px-6 lg:px-8 box-border">
            {/* ── Título de la categoría ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-6 sm:mb-8"
            >
                <div className="inline-block bg-gradient-to-r from-[#3157cd] via-purple-400 to-[#af58d8] bg-[length:200%_auto] bg-left text-white px-8 py-3 rounded-full text-lg font-medium shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all duration-200 ease hover:shadow-xl hover:scale-105 hover:bg-right">
                    {title}
                </div>
            </motion.div>

            {/* ── Contenedor del carrusel ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative group/carousel"
            >
                {/* Botón anterior */}
                <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => swiper?.slidePrev()}
                    disabled={isBeginning}
                    className="absolute top-1/2 -translate-y-1/2 left-0 sm:-left-3 z-20 w-10 h-10 sm:w-11 sm:h-11 bg-white/90 hover:bg-white text-[#4a348c] rounded-full flex items-center justify-center shadow-lg border border-purple-200/80 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Botón siguiente */}
                <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => swiper?.slideNext()}
                    disabled={isEnd}
                    className="absolute top-1/2 -translate-y-1/2 right-0 sm:-right-3 z-20 w-10 h-10 sm:w-11 sm:h-11 bg-white/90 hover:bg-white text-[#4a348c] rounded-full flex items-center justify-center shadow-lg border border-purple-200/80 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* ── Slides ──────────────────────────────────── */}
                {/* El wrapper tiene un mask para que los bordes
                     se vean difuminados (efecto fade lateral) */}
                <div className="px-6 sm:px-10 py-5 sm:py-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_4%,black_96%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_4%,black_96%,transparent_100%)]">
                    <Swiper
                        onSwiper={(instance) => {
                            setSwiper(instance);
                            setIsBeginning(instance.isBeginning);
                            setIsEnd(instance.isEnd);
                        }}
                        onSlideChange={(instance) => {
                            setIsBeginning(instance.isBeginning);
                            setIsEnd(instance.isEnd);
                        }}
                        spaceBetween={20}
                        slidesPerView={2}
                        /* Responsive: más slides en pantallas grandes */
                        breakpoints={{
                            480: { slidesPerView: 2.3, spaceBetween: 10 },
                            640: { slidesPerView: 2.8, spaceBetween: 14 },
                            768: { slidesPerView: 3.5, spaceBetween: 20 },
                            1024: { slidesPerView: 4.4, spaceBetween: 28 },
                            1280: { slidesPerView: 5.2, spaceBetween: 28 },
                        }}
                        className="!overflow-visible"
                    >
                        {/* Si está cargando, muestra 6 skeletons.
                             Si no, muestra los libros reales. */}
                        {Array.from({ length: loading ? 6 : books.length }).map((_, idx) => {
                            const book = loading ? null : books[idx];
                            return (
                                <SwiperSlide key={book ? `${categoryKey}-${book.id}` : `skel-${categoryKey}-${idx}`} className="!h-auto flex py-1">
                                    <BookCard book={book} loading={loading} />
                                </SwiperSlide>
                            )
                        })}
                    </Swiper>
                </div>
            </motion.div>
        </div>
    );
}
