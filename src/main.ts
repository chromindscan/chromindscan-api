import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { openaiRouter } from "./routes/openaiRouter";
import { apiKeysRouter } from "./routes/route";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import path from "path";
const app = express();

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChromindScan API',
      version: '1.0.0',
      description: 'API documentation for ChromindScan API key management',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        adminKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-key',
          description: 'Admin key for protected endpoints'
        }
      }
    }
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './routes/*.js')], // Include both .ts and .js files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/", (req, res) => {
  res.json({"success": true})
});

app.use("/v1", openaiRouter);
app.use("/api-key", apiKeysRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
});