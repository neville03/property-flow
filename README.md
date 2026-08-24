# Rentaly

A rental property management dashboard — track properties, tenants, staff, rent
collection, expenses, and reports across your portfolio. The UI is strictly
black and white; charts are the only place colour is used. All data is mock data
(no backend yet).

## Stack

- TanStack Start (SSR) + TanStack Router
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui + Recharts

## Development

Requires Node.js and a package manager (npm or bun).

```sh
npm install
npm run dev
```

Then open the local URL printed in the terminal.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier

## Structure

- `src/routes/` — file-based routes (`__root.tsx`, `index.tsx`)
- `src/components/RentalManagement.jsx` — the full dashboard (all modules + mock data)
- `src/components/ui/` — shadcn/ui primitives
- `src/server.ts`, `src/start.ts` — SSR entry and request middleware
