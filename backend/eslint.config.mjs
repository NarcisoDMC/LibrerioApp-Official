import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/**", "node_modules/**", ".vercel/**"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" },
            ],
            // Permitido para augmentar tipos de terceros (p. ej. Express.Locals)
            "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
        },
    },
);