# Base44 development notes

- Run the app with `docker compose -f docker-compose.base44.yml up -d`; the Express API and Vite middleware share port 3000.
- Runtime data is a seeded JSON database at `/app/data/casacontrole-db.json`, persisted in the `app_data` Docker volume rather than the repository.
- `GEMINI_API_KEY` is optional at boot. Without it, the inventory and household-management features work, while AI endpoints report that configuration is missing.
- Verify the stack with `curl http://localhost:3000/api/health` and `curl -H 'Host: external-preview.example.com' http://localhost:3000/`.
- Type-check with `docker compose -f docker-compose.base44.yml exec -T app npm run lint`.
