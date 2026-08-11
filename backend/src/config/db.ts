import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log(`[MongoDB] Connected to external MongoDB URI: ${uri}`);
      return uri;
    }
  } catch (error) {
    console.warn('[MongoDB] Failed to connect to external MONGODB_URI, switching to Memory Server...', error);
  }

  // Fallback to MongoMemoryServer
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`[MongoDB] Connected to MongoMemoryServer at ${memoryUri}`);
  return memoryUri;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
