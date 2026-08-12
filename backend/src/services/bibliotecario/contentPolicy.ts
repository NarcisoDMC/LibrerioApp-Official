// ── Filtro de contenido determinista para la salida del modelo ────────────
// DeepSeek tiene menos restricciones morales que modelos norteamericanos:
// este filtro local por patrones actúa como capa de contención adicional
// sobre la respuesta final ANTES de enviarla al cliente (nunca sustituye al
// system prompt, lo refuerza).
//
// Dos niveles por categoría:
//  - strongPatterns: frases INEQUÍVOCAS (p. ej. "bomba casera") → basta UNA
//  - patterns: términos acumulables (p. ej. "tortura" en discusión literaria
//    de una novela es legítimo; varios términos gráficos juntos no lo son)

type PolicyRule = {
    category: string;
    strongPatterns: RegExp[];
    patterns: RegExp[];
    // coincidencias de patterns (moderadas) necesarias para marcar
    threshold: number;
};

const POLICY_RULES: PolicyRule[] = [
    {
        category: "sexo-explicito",
        strongPatterns: [
            /\bpornograf(í|i)a\s+(infantil|de\s+menores)\b/i,
            /\bsexualmente\s+expl[ií]cito\s+con\s+(menores|ni\wos|ni\was)\b/i,
        ],
        patterns: [
            /\b(penetraci\w+|sexo\s+oral|masturb\w+)\b/i,
            /\b(polla|coño|pene|vagina)\b/i,
            /\bpornograf\w*\b/i,
        ],
        threshold: 2,
    },
    {
        category: "violencia-grafica",
        strongPatterns: [
            /\b(violaci[oó]n|violar)\s+paso\s+a\s+paso\b/i,
            /\binstrucciones\s+para\s+matar\b/i,
            /\b(violar|violaci[oó]n)\s+(a\s+)?(un|una|unos|unas|menores|ni\wos|ni\was)\b/i,
        ],
        patterns: [
            /\btortur\w+\b/i,
            /\bdesmembr\w+\b/i,
            /\bdecapit\w+\b/i,
            /\b(mutilar|mutila\w+)\b/i,
            /\b(violar|violaci[oó]n|abus\w+\s+sexual)\b/i,
            /\b(asesinato\s+gr[aá]fico|sangre\s+gr[aá]fica|detalle\s+gr[aá]fico)\b/i,
        ],
        threshold: 2,
    },
    {
        category: "fabricacion-peligrosa",
        strongPatterns: [
            /\b(bomba\s+casera|explosivo\s+casero)\b/i,
            /\bfabric\w+\s+(una\s+|un\s+|a\s+)?(bomba|explosivo)\b/i,
            /\b(s[ií]ntesis|prepar\w+)\s+de\s+(metanfetamina|anfetamina|mdma|lsd|hero[ií]na)\b/i,
            /\b(ricina|cianuro|veneno)\s+(prepara|dosif|fabrica|instruc)\w*/i,
        ],
        patterns: [],
        threshold: 1,
    },
    {
        category: "fraude-phishing",
        strongPatterns: [
            /\b(robar\s+contrase\w+|phishing|spoofing)\s+paso\s+a\s+paso\b/i,
            /\b(clonar\s+tarjeta|clonaci[oó]n\s+de\s+tarjeta)\b/i,
            /\b(estafa|timar|estafar)\s+(a\s+)?(ancian\w+|bancos?|negocios?)\b/i,
        ],
        patterns: [],
        threshold: 1,
    },
];

export type ContentPolicyResult = { safe: true } | { safe: false; category: string };

// Evalúa el texto; un patrón fuerte o N moderados marcan la categoría.
export function checkContentPolicy(text: string): ContentPolicyResult {
    for (const rule of POLICY_RULES) {
        const strongHit = rule.strongPatterns.some((pattern) => pattern.test(text));
        if (strongHit) return { safe: false, category: rule.category };

        let hits = 0;
        for (const pattern of rule.patterns) {
            if (pattern.test(text)) hits += 1;
        }
        if (hits >= rule.threshold && rule.patterns.length > 0) {
            return { safe: false, category: rule.category };
        }
    }
    return { safe: true };
}

// Respuesta neutra que sustituye a un contenido marcado por el filtro.
export const POLICY_BLOCK_MESSAGE =
    "Lo siento, esa consulta está fuera de lo que puedo responder. " +
    "Si quieres, te ayudo con recomendaciones de libros, autores o temas de lectura.";

// URLs permitidas en los enlaces de la respuesta del modelo (whitelist).
export const ALLOWED_LINK_HOSTS = [
    "casadellibro.com",
    "fnac.es",
    "amazon.es",
    "todoebook.com",
    "libroslowcost.com",
    "buscalibre.es",
    "planetadelibros.com",
    "penguinlibros.com",
];

// Devuelve true si la URL pertenece a un host permitido (o subdominio suyo).
export function isAllowedLink(url: string): boolean {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_LINK_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
}