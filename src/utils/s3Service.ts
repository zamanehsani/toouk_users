import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || "toouk-market-avatars";
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Upload avatar file to S3 and return the public URL
   */
  async uploadAvatar(file: any, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `avatars/${userId}-${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read", // Make the file publicly accessible
    });

    try {
      await this.s3Client.send(command);
      
      // Return the public URL
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload avatar");
    }
  }

  /**
   * Delete avatar file from S3
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract the key from the URL
      const urlParts = avatarUrl.split("/");
      const key = urlParts.slice(-2).join("/"); // Get "avatars/filename.ext"

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error deleting from S3:", error);
      // Don't throw error for delete failures, just log
    }
  }
}

export const s3Service = new S3Service();
