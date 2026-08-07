<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Basic code rules

The writen code must use an indentation of four spaces.

# Uso de Iconos

Se usan solamente iconos de lucide (lucide-react)

# Concepto de la aplicación.

Aplicacion de nextjs conectada a un servidor backend en spring boot (Actualmente se esta transicionando el backend a Express por terminos economicos y de facilidad de despliegue con vercel), esta aplicacion tiene
el proposito de ser una plataforma de libros libre para buscar recomendaciones, autores y generos.

Tiene el proposito de tener una funcion de un bibliotecario por IA para manejar consultas, recomendaciones
consejos de lectura, busqueda para comprar o donde leerlo por prestamo.

Busca tener un apartado de comunidad para que la propia gente comparta sus lecturas y recomendaciones.

# Rutas principales del proyecto actualmente

-- app/
    -- (Auth)/
        -- Login/
            page.tsx
        -- Registro/
            page.tsx
    -- (Inicio)/
        -- Bibliotecario/
            page.tsx
        -- Comunidad/
            page.tsx
        -- Mi-Biblioteca/
            page.tsx
        layout.tsx
        page.tsx
    -- ui/
        -- Login
            Navbar.tsx
        -- Components
            BookCard.tsx
            BookCarrusel.tsx
            BookSections.tsx
            Nav-links.tsx
            Navbar.tsx
            TypeWriter.tsx
    favicon.ico
    fonts.ts
    globals.css
    layout.tsx

<!-- END:nextjs-agent-rules -->
