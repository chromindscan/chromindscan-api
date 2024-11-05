import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create API Types
  const apiTypes = [
    {
      name: 'OpenAI',
      base_url: 'https://api.openai.com/v1/chat/completions',
    },
    {
      name: 'Groq',
      base_url: 'https://api.groq.com/openai/v1/chat/completions',
    },
    {
      name: 'x-Grok',
      base_url: 'https://api.x.ai/v1/chat/completions',
    },
    {
      name: 'OpenRouter',
      base_url: 'https://openrouter.ai/api/v1/chat/completions',
    },
    {
      name: 'TogetherAI',
      base_url: 'https://api.together.xyz/v1/completions',
    },
  ];

  console.log('Seeding API types...');

  for (const apiType of apiTypes) {
    await prisma.apiType.upsert({
      where: { name: apiType.name },
      update: apiType,
      create: apiType,
    });
    console.log(`Seeded: ${apiType.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });