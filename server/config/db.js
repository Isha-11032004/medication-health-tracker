import mongoose from 'mongoose';
import dns from 'dns';

/**
 * Connect to MongoDB (Atlas SRV or standard URI from .env)
 */
export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI_STANDARD ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/medication_health_tracker';

  // Windows / some ISPs fail SRV lookups — use Google DNS for mongodb+srv
  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    console.log('MongoDB connected');
  } catch (err) {
    if (err.code === 'ECONNREFUSED' && String(err.syscall || '').includes('querySrv')) {
      console.error(`
Cannot resolve MongoDB Atlas (SRV DNS blocked on this network).

FIX — pick one:

  A) In server\\.env add a STANDARD connection string from Atlas:
     1. Atlas → Connect → Drivers
     2. Choose "Standard connection string" (starts with mongodb:// not mongodb+srv)
     3. Add as: MONGODB_URI_STANDARD=mongodb://...

  B) Change PC DNS to 8.8.8.8 and 1.1.1.1, then run: ipconfig /flushdns

  C) Atlas → Network Access → Add Current IP Address
`);
    }
    throw err;
  }
};
