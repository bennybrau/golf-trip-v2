interface CloudflareImageUploadResponse {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

interface CloudflareImageDeleteResponse {
  success: boolean;
  errors: any[];
  messages: any[];
}

export class CloudflareImages {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    this.apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN!;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
    
    if (!this.accountId || !this.apiToken) {
      throw new Error('Missing Cloudflare Images configuration. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN in your .env file');
    }
  }

  async uploadImage(file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const result: CloudflareImageUploadResponse = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare upload failed: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return {
      id: result.result.id,
      url: `${process.env.CLOUDFLARE_IMG_URL_PREFIX}${result.result.id}/public`
    };
  }

  async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    const result: CloudflareImageDeleteResponse = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare delete failed: ${result.errors.map(e => e.message).join(', ')}`);
    }
  }

  getImageUrl(imageId: string, variant: string = 'public'): string {
    return `https://imagedelivery.net/${this.accountId}/${imageId}/${variant}`;
  }
}

export const cloudflareImages = new CloudflareImages();