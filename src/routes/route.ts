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

    // Check for existing key with both user_token and api_type
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        user_token: user_token,
        api_type: { name: api_type },
        admin_approved: true  // Only check for approved keys
      }
    });

    if (existingKey) {
      return res.status(409).json({ 
        error: `API key already exists for user with API type: ${api_type}`,
      });
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
    // Handle Prisma unique constraint error specifically
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'API key already exists for this user and API type',
      });
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