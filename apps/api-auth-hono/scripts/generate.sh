cd ../api-auth-turso && pnpm dev &
sleep 1
cd ../api-auth-hono && dotenv -e ../../.env -- bash -c 'drizzle-kit generate'
sleep 1
kill $(lsof -t -i:8022)
# npx kill-port 8022