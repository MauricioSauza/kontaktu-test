# Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can check the progress done by redirecting the app to: [http://localhost:3000/contacts](http://localhost:3000/contacts)

## Decisiones tomadas

1. Que priorizaste y por qué? 
R. Tome como prioridad la User Story 10: Cumplimiento ya que considere que dentro del tiempo la complejidad y el aporte al producto esta era la mejor opción.
Priorice el renderizado rápido de los badges de cumplimiento basado en le json especificado

2. Donde se equivocó la IA y cómo lo cazaste? 
R. La IA hizo una correcta planeación usando el modelo opus pero la implementación fue laboriosa usando sonnet ya que el LLM tomo muchas decisiones bastante cuestionables
Mitigue ese error refactorizando la estructura de carpetas y el limpiando el codigo para hacerlo mas legible de la misma manera borre bastante codigo inutil que el LLM produjo.

3. Que haría con un día más?
R. Incluiría la implementación de un LLM con un system prompt fuerte para el parseo del compliance ya que esa parte no es para nada extensible en el tiempo.