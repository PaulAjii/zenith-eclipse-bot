export const getTTSResponse = async (
  token: string,
  botResponse: any
): Promise<Response> => {
  const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: botResponse,
    }),
  });

  return ttsResponse;
};
