# RUNI Market

Campus marketplace for Reichman University students. Students can browse, list, save, and message about second-hand items for in-person exchange on campus.

## Current Home Experience

The home page uses a compact hero followed by five category shortcuts:

- Tickets, highlighted as a special RUNI Tickets entry
- Furniture
- Electronics
- Dorm Accessories
- Sports & Outdoors

The non-ticket shortcuts link into the existing `/browse` filters. The Tickets shortcut links to `/tickets`, a placeholder page for the future RUNI Tickets product area.

## Product Translation

Listing titles and descriptions auto-translate between English and Hebrew through the `translate-listing` Supabase Edge Function. The function caches translated text in `listing_translations`, and the cache is cleared automatically when a seller edits a listing title or description.

Required Supabase setup:

```sh
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase functions deploy translate-listing
```

Optional model override:

```sh
supabase secrets set OPENAI_TRANSLATION_MODEL=gpt-4o-mini
```

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## Development

```sh
npm install
npm run dev
npm run build
npm run test
```
