import 'dotenv/config';
import { DatabaseProvider } from '../../db';
import { AdminUserModel } from '../models/user.schema';
import { seedIndexPage } from './index-page.seed';


async function seedAdmin() {
  const dbProvider = new DatabaseProvider();
  await dbProvider.connect();

  const existing = await AdminUserModel.findOne({ role: 'admin' });
  if (!existing) {
    const admin = new AdminUserModel({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      profilePic: 'https://example.com/profile-pic.png',
      deviceData: 'Windows 10, Chrome 120',
      firstName: 'Default',
      lastName: 'Admin',
      phone: '+1234567890',
      location: '123 Admin Street, Admin City',
    });
    await admin.save();

  } else {
    
  }

  // Seed index page
  await seedIndexPage();
  
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
}); 