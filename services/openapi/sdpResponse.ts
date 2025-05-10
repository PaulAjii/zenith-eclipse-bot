const baseUrl = 'https://api.openai.com/v1/realtime';
const model = 'gpt-4o-realtime-preview-2024-12-17';

export const getSdpResponse = async (
  token: string,
  offer: RTCSessionDescriptionInit
): Promise<Response> => {
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: 'POST',
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/sdp',
    },
  });

  return sdpResponse;
};
