import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "dist-electron/**",
      "release/**",
      "storage/**",
      ".next/**",
      // Salida de la exportación estática: es código generado, no fuente.
      "out/**",
      "next-env.d.ts",
      // Copia literal de las habilidades oficiales. No es código nuestro y no debe modificarse:
      // su valor está justamente en ser byte a byte igual al original (ver skillManifestHash.test.ts).
      "skills/**",
    ],
  },
];

export default eslintConfig;
