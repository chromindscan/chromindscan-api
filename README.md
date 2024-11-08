# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run main.ts
```

This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


# Deploying using pm2

1. Start the server

```bash
pm2 start main.ts --name chromindscan-api
```

2. Check the status

```bash
pm2 status
```

3. Restart the server

```bash
pm2 restart chromindscan-api
```

4. Stop the server

```bash
pm2 stop chromindscan-api
```


# Backend API

1. Create a new API key (POST /api-key/keys):

```bash
curl -X POST http://localhost:8000/api-key/keys \
-H "Content-Type: application/json" \
-d '{
"user_id": "11111",
"api_type": "openai",
"api_key": "sk-11111",
"chromia_keys": {
    "private_key": "private-11111",
    "public_key": "public-11111"
}
}'
```

2. Get all API keys for a user (GET /api-key/keys):

```bash
curl -X GET http://localhost:8000/api-key/keys?user_id=11111
```


3. Get specific API key by type (GET /api-key/keys/:type):

```bash
curl -X GET http://localhost:8000/api-key/keys/openai?user_id=11111
```

4. Update an API key (PUT /api-key/keys/:type):

```bash
curl -X PUT "http://localhost:8000/api-key/keys/openai?user_id=test-user-123" \
-H "Content-Type: application/json" \
-d '{
  "api_key": "sk-new-key-456",
  "chromia_keys": {
    "private_key": "new-private-456",
    "public_key": "new-public-456"
  }
}'
```

5. Delete an API key (DELETE /api-key/keys/:type?user_id=<user_id>):

```bash
curl -X DELETE "http://localhost:8000/api-key/keys/openai?user_id=test-user-123" \
-H "x-admin-key: your-admin-key-here"
```
