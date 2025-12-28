// Convert Google Drive share link to direct image URL
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  
  console.log('Converting URL:', url);
  
  // Check if it's a Google Drive link
  if (url.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    // Format: https://drive.google.com/file/d/FILE_ID/view...
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      // Use thumbnail format which works better for public images
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      console.log('Converted to:', directUrl);
      return directUrl;
    }
  }
  
  // Return original URL if not a Google Drive link
  return url;
}
