#!/bin/sh
set -e

# Build a URL-encoded DATABASE_URL from MYSQL_* so passwords with @, ;, etc. work.
if [ -n "$MYSQL_USER" ] && [ -n "$MYSQL_PASSWORD" ] && [ -n "$MYSQL_DATABASE" ]; then
  export DATABASE_URL="$(node -e "
    const user = process.env.MYSQL_USER;
    const pass = encodeURIComponent(process.env.MYSQL_PASSWORD);
    const db = process.env.MYSQL_DATABASE;
    const host = process.env.MYSQL_HOST || 'mysql';
    const port = process.env.MYSQL_PORT || '3306';
    process.stdout.write(\`mysql://\${user}:\${pass}@\${host}:\${port}/\${db}\`);
  ")"
fi

pnpm --filter @forgecms/database run db:push --skip-generate
exec node apps/api/dist/main.js
