export async function uploadToStreamable(videoBlob) {
  // Create form data
  const formData = new FormData();
  formData.append('file', videoBlob, 'warp-speed.webm');

  // Basic auth credentials
  const username = process.env.VUE_APP_STREAMABLE_EMAIL;
  const password = process.env.VUE_APP_STREAMABLE_PASSWORD;

  if (!username || !password) {
    throw new Error('Streamable credentials not configured');
  }

  const basicAuth = btoa(`${username}:${password}`);

  try {
    console.log('Starting upload to Streamable...');
    const response = await fetch('https://api.streamable.com/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Streamable error response:', errorText);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Streamable response:', data);

    if (!data.shortcode) {
      throw new Error('No shortcode in response');
    }

    return `https://streamable.com/${data.shortcode}`;
  } catch (error) {
    console.error('Detailed upload error:', error);
    throw error;
  }
}