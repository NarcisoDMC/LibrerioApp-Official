'use client'

import dynamic from "next/dynamic"
import type { Options, TypewriterClass } from "typewriter-effect"

const Typewriter = dynamic(() => import("typewriter-effect"), { ssr: false })

interface TypeWriterProps {
    component?: React.ElementType
    onInit?: (typewriter: TypewriterClass) => void
    options?: Partial<Options>
}

export default function TypeWriter(props: TypeWriterProps) {
    return <Typewriter {...props} />
}
