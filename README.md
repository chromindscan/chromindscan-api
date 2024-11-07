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
