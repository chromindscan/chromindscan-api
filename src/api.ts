import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './utils/encryption';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const ApiKeySchema = z.object({
  apiTypeName: z.string(),
  apiKey: z.string().min(1),
  chromiaKeys: z.object({
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
  }).optional(),
});

// Get API keys for a specific user
router.get('/keys', async (req, res) => {
    try {
      // Get user_id from query parameter
      const userId = req.query.user_id as string;
      
      if (!userId) {
        return res.status(400).json({ 
          error: 'user_id is required' 
        });
      }
  
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          user_id: userId,
          is_active: true
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
  
      // Transform the response to include decrypted keys
      const transformedKeys = apiKeys.map(key => ({
        id: key.id,
        user_id: key.user_id,
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

export default router;