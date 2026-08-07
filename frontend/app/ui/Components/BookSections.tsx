'use client'

import { cache, useEffect, useState } from "react";
import BookCarousel from "./BookCarrusel";
import type { Book } from "./BookCard";
import { Key } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sectionCache = new Map<string, Book[]>();

interface Section {
    key: string;
    title: string;
}

const SECTIONS: Section[] = [
    { key: "novedades", title: "Novedades" },
    { key: "fantasia", title: "Fantasía" },
    { key: "terror", title: "Terror" },
];

export default function BookSections() {
    const [booksBySection, setBooksBySection] = useState<Record<string, Book[]>>(() => {
        const initial: Record<string, Book[]> = {};
        for (const section of SECTIONS){
            const cached = sectionCache.get(section.key);
            if (cached) initial[section.key] = cached;
        }
        return initial
    });
    const [loading, setLoading] = useState(() => SECTIONS.some((s) => !sectionCache.has(s.key)));

    useEffect(() => {
        const pending = SECTIONS.filter((s) => !sectionCache.has(s.key));
        if (pending.length === 0) return;

        let cancelled = false;

        Promise.allSettled(
            pending.map(async (section) => {
                const res = await fetch(
                    `${API_URL}/api/books/category/${section.key}?maxResults=10`
                );
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = (await res.json()) as Book[];
                return { key: section.key, data };
            })
        ).then((results) => {
            if (cancelled) return;

            const next: Record<string, Book[]> = {};
            results.forEach((result, index) => {
                const key = pending[index].key;
                if (result.status === "fulfilled") {
                    sectionCache.set(key, result.value.data); // solo los exitosos se guardan en la cache
                    next[key] = result.value.data;
                } else {
                    next[key] = []; // fallos: estado vacío, pero No se cachean se reintentarán
                }
            });

            setBooksBySection((prev) => ({ ...prev, ...next }));
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <>
            {SECTIONS.map((section) => (
                <BookCarousel
                    key={section.key}
                    title={section.title}
                    categoryKey={section.key}
                    books={booksBySection[section.key] ?? []}
                    loading={loading}
                />
            ))}
        </>
    );
}
