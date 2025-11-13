import axios from 'axios';

const SMUGMUG_API_BASE = 'https://api.smugmug.com/api/v2';

interface SmugMugAlbum {
  Uri: string;
  Name: string;
  AlbumKey: string;
  ImageCount: number;
}

interface SmugMugImage {
  Uri: string;
  FileName: string;
  ArchivedUri: string;
  Uris: {
    LargestImage: {
      Uri: string;
    };
  };
}

export class SmugMugAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUserAlbums(username: string): Promise<SmugMugAlbum[]> {
    try {
      const response = await axios.get(
        `${SMUGMUG_API_BASE}/user/${username}!albums`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.Response.Album || [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  async getAlbumImages(albumKey: string): Promise<SmugMugImage[]> {
    try {
      const response = await axios.get(
        `${SMUGMUG_API_BASE}/album/${albumKey}!images`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.Response.AlbumImage || [];
    } catch (error) {
      console.error('Error fetching album images:', error);
      throw error;
    }
  }

  async getImageDownloadUrl(imageUri: string): Promise<string> {
    try {
      const response = await axios.get(
        `${SMUGMUG_API_BASE}${imageUri}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const largestImageUri = response.data.Response.Image.Uris.LargestImage.Uri;

      const imageResponse = await axios.get(
        `${SMUGMUG_API_BASE}${largestImageUri}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return imageResponse.data.Response.LargestImage.Url;
    } catch (error) {
      console.error('Error fetching image URL:', error);
      throw error;
    }
  }
}
