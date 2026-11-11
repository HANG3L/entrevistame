// Niveles de experiencia (se usan tanto en el servidor como en el navegador).
export const LEVELS = [
  { value: "junior", label: "Junior", hint: "0 a 2 años de experiencia" },
  { value: "semi", label: "Semi senior", hint: "2 a 5 años" },
  { value: "senior", label: "Senior", hint: "Más de 5 años" },
] as const;

export type Level = (typeof LEVELS)[number]["value"];
