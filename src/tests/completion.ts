async function testChatCompletion() {
  try {
    // 1. Get the API key
    const apiKeyResponse = await fetch(
      'http://localhost:8000/api-key/keys/OpenAI?user_token=199516'
    );
    const apiKeyData = await apiKeyResponse.json();
    const apiKey = apiKeyData.data.api_key;

    // 2. Make chat completion request
    const chatResponse = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Act like you are a Chromia AI Agent and answer the following question: Why use Chromia?'
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const chatData = await chatResponse.json();
    console.log(chatData.choices[0].message.content);

  } catch (error) {
    console.error('Error:', error);
  }
}

testChatCompletion();