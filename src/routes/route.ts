/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - user_token
 *         - api_type
 *         - api_key
 *       properties:
 *         user_token:
 *           type: string
 *           description: User token for authentication
 *         api_type:
 *           type: string
 *           description: Type of API (e.g., OpenAI, Groq, x-Grok)
 *         api_key:
 *           type: string
 *           description: The API key
 *         chromia_keys:
 *           type: object
 *           properties:
 *             private_key:
 *               type: string
 *             public_key:
 *               type: string
 *     ApiKeyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             user_token:
 *               type: string
 *             api_type:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 base_url:
 *                   type: string
 *             api_key:
 *               type: string
 *             chromia_keys:
 *               type: object
 *               properties:
 *                 private_key:
 *                   type: string
 *                 public_key:
 *                   type: string
 *             created_at:
 *               type: string
 *             updated_at:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: API key management endpoints
 */

/**
 * @swagger
 * /api-key/keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKey'
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyResponse'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: API key already exists
 *   
 *   get:
 *     summary: Get all API keys for a user
 *     tags: [API Keys]
 *     parameters:
 *       - in: query
 *         name: user_token
 *         schema:
 *           type: string
 *         required: true
 *         description: User token for authentication
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKeyResponse'
 *       400:
 *         description: user_token is required
 */

/**
 * @swagger
 * /api-key/keys/{type}:
 *   get:
 *     summary: Get specific API key by type
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: API type (e.g., OpenAI)
 *       - in: query
 *         name: user_token
 *         schema:
 *           type: string
 *         required: true
 *         description: User token for authentication
 *     responses:
 *       200:
 *         description: API key details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyResponse'
 *       404:
 *         description: API key not found
 *
 *   put:
 *     summary: Update an API key
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: API type (e.g., OpenAI)
 *       - in: query
 *         name: user_token
 *         schema:
 *           type: string
 *         required: true
 *         description: User token for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - api_key
 *             properties:
 *               api_key:
 *                 type: string
 *               chromia_keys:
 *                 type: object
 *                 properties:
 *                   private_key:
 *                     type: string
 *                   public_key:
 *                     type: string
 *     responses:
 *       200:
 *         description: API key updated successfully
 *       404:
 *         description: API key not found
 *
 *   delete:
 *     summary: Delete an API key (Admin only)
 *     tags: [API Keys]
 *     security:
 *       - adminKey: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: API type (e.g., OpenAI)
 *       - in: query
 *         name: user_token
 *         schema:
 *           type: string
 *         required: true
 *         description: User token for authentication
 *       - in: header
 *         name: x-admin-key
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin key for authorization
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: API key not found
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { decrypt, encrypt } from '../utils/encryption';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateKeySchema = z.object({
  user_token: z.string(),
  api_type: z.string(),
  api_key: z.string(),
  chromia_keys: z.object({
    private_key: z.string().optional(),
    public_key: z.string().optional(),
  }).optional(),
});

const UpdateKeySchema = z.object({
  api_key: z.string(),
  chromia_keys: z.object({
    private_key: z.string().optional(),
    public_key: z.string().optional(),
  }).optional(),
});

// Middleware to check admin status
const isAdmin = (req: any, res: any, next: any) => {
  const isAdminUser = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isAdminUser) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Create new API key
router.post('/keys', async (req, res) => {
  try {
    const { user_token, api_type, api_key, chromia_keys } = CreateKeySchema.parse(req.body);

    // Check if API type exists
    const apiTypeExists = await prisma.apiType.findFirst({
      where: { name: api_type }
    });

    if (!apiTypeExists) {
      return res.status(404).json({ error: 'Invalid API type'});
    }

    // Check for existing key
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        api_type: { name: api_type },
        admin_approved: true
      }
    });

    if (existingKey) {
      return res.status(409).json({ error: 'API key already exists for this user and type' });
    }

    // Create new key
    const newKey = await prisma.apiKey.create({
      data: {
        api_type_id: apiTypeExists.id,
        user_token: user_token,
        api_key: encrypt(api_key),
        chromia_private_key: chromia_keys?.private_key ? encrypt(chromia_keys.private_key) : null,
        chromia_public_key: chromia_keys?.public_key || null,
        admin_approved: true
      },
      include: {
        api_type: {
          select: {
            name: true,
            base_url: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: newKey.id,
        user_token: newKey.user_token,
        api_type: newKey.api_type,
        created_at: newKey.created_at
      }
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Update API key
router.put('/keys/:type', async (req, res) => {
  try {
    const userToken = req.query.user_token as string;
    const apiType = req.params.type;
    const { api_key, chromia_keys } = UpdateKeySchema.parse(req.body);

    if (!userToken || !apiType) {
      return res.status(400).json({ error: 'user_token and API type are required' });
    }

    const updatedKey = await prisma.apiKey.updateMany({
      where: {
        user_token: userToken,
        api_type: { name: apiType },
        admin_approved: true
      },
      data: {
        api_key: encrypt(api_key),
        chromia_private_key: chromia_keys?.private_key ? encrypt(chromia_keys.private_key) : undefined,
        chromia_public_key: chromia_keys?.public_key || undefined,
        updated_at: new Date()
      }
    });

    if (updatedKey.count === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      message: 'API key updated successfully'
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key (admin only)
router.delete('/keys/:type', isAdmin, async (req, res) => {
  try {
    const userToken = req.query.user_token as string;
    const apiType = req.params.type;

    if (!userToken || !apiType) {
      return res.status(400).json({ error: 'user_token and API type are required' });
    }

    const deletedKey = await prisma.apiKey.updateMany({
      where: {
        user_token: userToken,
        api_type: { name: apiType },
        admin_approved: true
      },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    if (deletedKey.count === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get API keys for a specific user
router.get('/keys', async (req, res) => {
  try {
    const userToken = req.query.user_token as string;
    
    if (!userToken) {
      return res.status(400).json({ 
        error: 'user_token is required' 
      });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        user_token: userToken,
        admin_approved: true
      },
      include: {
        api_type: {
          select: {
            name: true,
            base_url: true
          }
        }
      }
    });

    const transformedKeys = apiKeys.map(key => ({
      id: key.id,
      user_token: key.user_token,
      api_type: key.api_type,
      api_key: decrypt(key.api_key),
      chromia_keys: key.chromia_private_key ? {
        private_key: decrypt(key.chromia_private_key),
        public_key: key.chromia_public_key
      } : null,
      created_at: key.created_at,
      updated_at: key.updated_at
    }));

    res.json({
      success: true,
      data: transformedKeys
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ 
      error: 'Failed to fetch API keys'
    });
  }
});

// Get a specific API key by type
router.get('/keys/:type', async (req, res) => {
  try {
    const userToken = req.query.user_token as string;
    const apiType = req.params.type;

    if (!userToken || !apiType) {
      return res.status(400).json({ 
        error: 'user_token and API type are required' 
      });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        user_token: userToken,
        admin_approved: true,
        api_type: {
          name: apiType
        }
      },
      include: {
        api_type: {
          select: {
            name: true,
            base_url: true
          }
        }
      }
    });

    if (!apiKey) {
      return res.status(404).json({ 
        error: `No active API key found for ${apiType}` 
      });
    }

    res.json({
      success: true,
      data: {
        id: apiKey.id,
        user_token: apiKey.user_token,
        api_type: apiKey.api_type,
        api_key: decrypt(apiKey.api_key),
        chromia_keys: apiKey.chromia_private_key ? {
          private_key: decrypt(apiKey.chromia_private_key),
          public_key: apiKey.chromia_public_key
        } : null,
        created_at: apiKey.created_at,
        updated_at: apiKey.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ 
      error: 'Failed to fetch API key'
    });
  }
});

export const apiKeysRouter = router;