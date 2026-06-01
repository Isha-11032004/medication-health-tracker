import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI_STANDARD || process.env.MONGODB_URI;

if (!uri) {
  console.error('No MONGODB_URI in server/.env');
  process.exit(1);
}

if (uri.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

console.log('Testing connection...');
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const count = await mongoose.connection.db.collection('users').countDocuments();
  console.log('OK — connected. Users in database:', count);
  await mongoose.disconnect();
  process.exit(0);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exit(1);
}
