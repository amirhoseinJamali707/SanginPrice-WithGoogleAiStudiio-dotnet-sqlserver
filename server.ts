import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// --- File Storage Setup & Migration ---
const DB_FILE = path.join(process.cwd(), 'data', 'local_db.json');

const default_products_info = [
  { PartName: "پمپ هیدرولیک", OtherNames: "Hydraulic Pump, پمپ اصلی", Id: "CAT-001", PartCollection: "کوماتسو", view_count: 120, views_1month: 40, views_3months: 80, views_6months: 100, views_1year: 120 },
  { PartName: "موتور دیزل", OtherNames: "Engine, موتور اصلی", Id: "CAT-002", PartCollection: "کلو", view_count: 95, views_1month: 30, views_3months: 60, views_6months: 80, views_1year: 95 },
  { PartName: "جک هیدرولیک", OtherNames: "Cylinder, جک بالابر", Id: "CAT-003", PartCollection: "کلمنس", view_count: 75, views_1month: 25, views_3months: 50, views_6months: 65, views_1year: 75 }
];

const default_products_db_list = [
  {
    PartName: "پمپ هیدرولیک",
    OtherNames: "Hydraulic Pump, پمپ اصلی",
    PartID: "CAT-001",
    TargetName: "پمپ هیدرولیک",
    TargetModel: "PC220-7",
    ProductName: "پمپ هیدرولیک PC220-7",
    PartNumber: "708-2L-00300",
    ProductInformation: "پمپ هیدرولیک اصلی کوماتسو سری ۷",
    Id: "PD123456",
    SRTID: "SRT-101",
    Status: "New",
    view_count: 85,
    views_1month: 30,
    views_3months: 60,
    views_6months: 75,
    views_1year: 85
  }
];

const default_product_prices = [
  {
    PartName: "پمپ هیدرولیک",
    OtherNames: "Hydraulic Pump, پمپ اصلی",
    PartID: "CAT-001",
    TargetName: "پمپ هیدرولیک",
    TargetModel: "PC220-7",
    ProductName: "پمپ هیدرولیک PC220-7",
    PartNumber: "708-2L-00300",
    ProductInformation: "پمپ هیدرولیک اصلی کوماتسو سری ۷",
    ProductID: "PD123456",
    SRTID: "SRT-101",
    Status: "New",
    LastPriceUpdateDate: "۱۴۰۳/۰۲/۲۸",
    Price: "120000000",
    Id: "PR99901",
    SupplierName: "فروشگاه مرکزی دنا",
    From: "Admin",
    DailyDollarRate: "64,200",
    PriceValidityDays: 7,
    SRTPriceID: "SRTPR-101",
    CRMID: "CRM-202",
    ShelfNumber: "A-5"
  }
];

const default_roles = [
  { name: 'admin', permissions: ['manage_categories', 'manage_parts', 'manage_quotes', 'manage_users'] },
  { name: 'operator', permissions: ['manage_parts', 'manage_quotes'] },
  { name: 'viewer', permissions: [] }
];

const default_users = [
  { username: 'admin', password: 'Admin', role: 'admin', userID: 'usr-admin', email: 'admin@sanginprice.ir', phone: '09121111111' },
  { username: 'operator', password: 'Password123', role: 'operator', userID: 'usr-operator', email: 'operator@sanginprice.ir', phone: '09122222222' },
  { username: 'viewer', password: 'Password123', role: 'viewer', userID: 'usr-viewer', email: 'viewer@sanginprice.ir', phone: '09123333333' }
];

const default_contacts = [
  {
    _id: "c-1",
    fullName: "امیرحسین رضایی",
    specialty: "متخصص تراش سرسیلندر و قطعات سنگین هیدرولیک",
    landline: "021-55428990",
    phone1: "09121234567",
    phone2: "09351234567",
    address: "تهران، خیابان قزوین، گاراژ بزرگ تراشکاران، پلاک ۴",
    notes: "دارای بیش از ۱۵ سال سابقه در تراش سیلندرهای جک‌های هیدرولیکی لیفتراک و بیل مکانیکی کوماتسو"
  },
  {
    _id: "c-2",
    fullName: "علیرضا سلیمی",
    specialty: "تامین‌کننده کاسه‌نمد و جک‌های هیدرولیک پنوماتیک",
    landline: "021-33948822",
    phone1: "09129876543",
    phone2: "",
    address: "تهران، لاله زار جنوبی، پاساژ صدرا، طبقه همکف، پلاک ۱۸",
    notes: "نمایندگی رسمی برندهای مطرح ایتالیایی و آلمانی کاسه نمد و پکینگ جک‌های راهسازی"
  },
  {
    _id: "c-3",
    fullName: "حسین حسینی",
    specialty: "بازسازی و تعویض روتور و شفت هیدرولیک سنگین",
    landline: "021-66315544",
    phone1: "09123456780",
    phone2: "09191234567",
    address: "اصفهان، شهرک صنعتی امیرکبیر، خیابان شاپور جدید، کارگاه حسینی",
    notes: "آبکاری کروم سخت شفت تا طول ۴ متر بابت سیلندرهای هیدرولیک طویل کوره و سیمان"
  }
];

function loadDb() {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("⚠️ Failed to load local_db.json, recreating defaults:", err);
  }

  const initialDb = {
    part_name: default_products_info,
    product_name: default_products_db_list,
    product_prices: default_product_prices,
    roles: default_roles,
    users: default_users,
    contacts: default_contacts,
    audit_logs: [],
    daily_views: []
  };
  saveDb(initialDb);
  return initialDb;
}

function saveDb(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("⚠️ Failed to write local_db.json:", err);
  }
}

// Function to log actions to audit log list
function logActivity(db: any, username: string, action_type: string, target_id: string, target_type: string, description: string, changes?: any) {
  const cleanUser = String(username || 'admin').trim().toLowerCase();
  const matchedUser = db.users.find((u: any) => u.username.toLowerCase() === cleanUser);
  const u_id = matchedUser ? matchedUser.userID : `usr-${cleanUser}`;

  const logEntry = {
    user_id: u_id,
    action_type,
    target_id,
    target_type,
    description,
    changes,
    created_at: new Date().toISOString()
  };

  db.audit_logs.push(logEntry);
  saveDb(db);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTING (100% MongoDB-Free) ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'لطفا نام کاربری و رمز عبور را وارد کنید' });
      }

      const db = loadDb();
      const inputUsername = username.trim().toLowerCase();
      const matchedUser = db.users.find((u: any) => u.username.toLowerCase() === inputUsername);

      if (!matchedUser || matchedUser.password !== password) {
        return res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      let rolePermissions: string[] = [];
      const roleObj = db.roles.find((r: any) => r.name === matchedUser.role);
      if (roleObj) rolePermissions = roleObj.permissions || [];

      if (matchedUser.role === 'admin') {
        rolePermissions = ['manage_categories', 'manage_parts', 'manage_quotes', 'manage_users'];
      }

      res.json({
        success: true,
        token: `token-user-${matchedUser.username}`,
        username: matchedUser.username,
        role: matchedUser.role,
        permissions: rolePermissions
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'خطای سرور در ورود' });
    }
  });

  // Users Management
  app.get('/api/users', (req, res) => {
    const db = loadDb();
    res.json(db.users);
  });

  app.post('/api/users', (req, res) => {
    try {
      const { username, password, role, email, phone } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'همه فیلدها الزامی هستند' });
      }

      const db = loadDb();
      const cleanUsername = username.trim();
      const lowerUsername = cleanUsername.toLowerCase();

      const exists = db.users.some((u: any) => u.username.toLowerCase() === lowerUsername);
      if (exists) {
        return res.status(400).json({ error: 'کاربری با این نام کاربری قبلا ثبت شده است' });
      }

      const userID = `usr-${lowerUsername}`;
      const newEmail = email ? email.trim() : `${lowerUsername}@sanginprice.ir`;
      const newPhone = phone ? phone.trim() : ('0912' + Math.floor(1000000 + Math.random() * 9000000).toString());

      db.users.push({ username: cleanUsername, password, role, userID, email: newEmail, phone: newPhone });
      saveDb(db);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت کاربر جدید' });
    }
  });

  app.delete('/api/users/:username', (req, res) => {
    try {
      const usernameParam = req.params.username;
      if (usernameParam.toLowerCase() === 'admin') {
        return res.status(400).json({ error: 'کاربر اصلی سیستم قابل حذف نیست' });
      }

      const db = loadDb();
      const index = db.users.findIndex((u: any) => u.username.toLowerCase() === usernameParam.toLowerCase());
      if (index !== -1) {
        db.users.splice(index, 1);
        saveDb(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'کاربر یافت نشد' });
      }
    } catch (err) {
      res.status(500).json({ error: 'خطا در حذف کاربر' });
    }
  });

  // Roles Management
  app.get('/api/roles', (req, res) => {
    const db = loadDb();
    res.json(db.roles);
  });

  app.post('/api/roles', (req, res) => {
    try {
      const { name, permissions } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'نام نقش الزامی است' });
      }

      const db = loadDb();
      const normalizedRoleName = name.trim().toLowerCase();
      const index = db.roles.findIndex((r: any) => r.name === normalizedRoleName);

      if (index !== -1) {
        db.roles[index].permissions = permissions;
      } else {
        db.roles.push({ name: normalizedRoleName, permissions });
      }

      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در تعریف نقش' });
    }
  });

  // Dollar rates proxy (Nobitex)
  app.get('/api/nobitex', async (req, res) => {
    try {
      const response = await fetch('https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls');
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching Nobitex specs:', err.message);
      res.status(500).json({ error: 'Failed to fetch rate stats' });
    }
  });

  // Contact / Cardex Management
  app.get('/api/contacts', (req, res) => {
    try {
      const { searchName, searchSpecialty } = req.query;
      const db = loadDb();
      let results = [...db.contacts];

      if (searchName) {
        const term = String(searchName).trim().toLowerCase();
        results = results.filter((c: any) => c.fullName && c.fullName.toLowerCase().includes(term));
      }
      if (searchSpecialty) {
        const term = String(searchSpecialty).trim().toLowerCase();
        results = results.filter((c: any) => 
          (c.specialty && c.specialty.toLowerCase().includes(term)) || 
          (c.notes && c.notes.toLowerCase().includes(term))
        );
      }
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت اشخاص' });
    }
  });

  app.post('/api/contacts', (req, res) => {
    try {
      const { fullName, specialty, landline, phone1, phone2, address, notes } = req.body;
      if (!fullName) {
        return res.status(400).json({ error: 'نام و نام خانوادگی الزامی است' });
      }

      const db = loadDb();
      const newContact = {
        _id: `c-${Date.now()}`,
        fullName,
        specialty,
        landline,
        phone1,
        phone2,
        address,
        notes
      };

      db.contacts.push(newContact);
      saveDb(db);
      res.json(newContact);
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت شخص جدید' });
    }
  });

  app.put('/api/contacts/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, specialty, landline, phone1, phone2, address, notes } = req.body;
      if (!fullName) {
        return res.status(400).json({ error: 'نام و نام خانوادگی الزامی است' });
      }

      const db = loadDb();
      const idx = db.contacts.findIndex((c: any) => String(c._id) === id);
      if (idx === -1) return res.status(404).json({ error: 'شخص یافت نشد' });

      db.contacts[idx] = {
        ...db.contacts[idx],
        fullName,
        specialty,
        landline,
        phone1,
        phone2,
        address,
        notes
      };

      saveDb(db);
      res.json(db.contacts[idx]);
    } catch (err) {
      res.status(500).json({ error: 'خطا در بروزرسانی اطلاعات' });
    }
  });

  app.delete('/api/contacts/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDb();
      const idx = db.contacts.findIndex((c: any) => String(c._id) === id);
      if (idx === -1) return res.status(404).json({ error: 'شخص یافت نشد' });

      db.contacts.splice(idx, 1);
      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در حذف شخص' });
    }
  });

  app.post('/api/contacts/bulk', (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'فرمت داده باید آرایه باشد' });
      }

      const db = loadDb();
      const results: any[] = [];
      const failedList: any[] = [];

      for (const item of items) {
        const fullName = item.fullName ? String(item.fullName).trim() : '';
        const specialty = item.specialty ? String(item.specialty).trim() : '';
        const landline = item.landline ? String(item.landline).trim() : '';
        const phone1 = item.phone1 ? String(item.phone1).trim() : '';
        const phone2 = item.phone2 ? String(item.phone2).trim() : '';
        const address = item.address ? String(item.address).trim() : '';
        const notes = item.notes ? String(item.notes).trim() : '';

        if (!fullName) {
          failedList.push({ ...item, reason: 'نام و نام خانوادگی الزامی است' });
          continue;
        }

        const duplicate = db.contacts.some((c: any) => c.fullName.toLowerCase() === fullName.toLowerCase());
        if (duplicate) {
          failedList.push({ ...item, reason: 'تکراری (شخصی با این نام قبلاً ثبت شده است)' });
          continue;
        }

        const contactData = {
          _id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          fullName,
          specialty,
          landline,
          phone1,
          phone2,
          address,
          notes
        };

        db.contacts.push(contactData);
        results.push(contactData);
      }

      saveDb(db);
      res.json({
        success: true,
        insertedCount: results.length,
        failedCount: failedList.length,
        inserted: results,
        failedList
      });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت گروهی اشخاص' });
    }
  });

  // Categories / Parts
  app.get('/api/categories', (req, res) => {
    try {
      const { search1, search2 } = req.query;
      const db = loadDb();
      let filtered = [...db.part_name];

      if (search1) {
        const term = String(search1).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.PartName || '').toLowerCase().includes(term) || 
          (p.OtherNames || '').toLowerCase().includes(term)
        );
      }
      
      if (search2) {
        const term = String(search2).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.PartName || '').toLowerCase().includes(term) || 
          (p.OtherNames || '').toLowerCase().includes(term)
        );
      }

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت قطعات اصلی' });
    }
  });

  app.post('/api/categories', (req, res) => {
    try {
      const { PartName, OtherNames, PartCollection } = req.body;
      if (!PartName || !PartName.trim()) {
        return res.status(400).json({ error: 'نام معیار قطعه الزامی است' });
      }

      const db = loadDb();
      const cleanPartName = PartName.trim();
      const cleanOtherNames = OtherNames ? OtherNames.trim() : '';
      const cleanPartCollection = PartCollection ? String(PartCollection).trim() : '';

      const duplicate = db.part_name.some((p: any) => p.PartName.toLowerCase() === cleanPartName.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: 'قطعه‌ای با این نام قبلا ثبت شده است' });
      }

      const Id = `pt${Math.floor(100000 + Math.random() * 900000)}`;
      const newCategory = {
        PartName: cleanPartName,
        OtherNames: cleanOtherNames,
        Id,
        PartCollection: cleanPartCollection,
        view_count: 0, views_1month: 0, views_3months: 0, views_6months: 0, views_1year: 0
      };

      db.part_name.push(newCategory);
      saveDb(db);

      res.status(201).json({ success: true, Id, PartName: cleanPartName, OtherNames: cleanOtherNames, PartCollection: cleanPartCollection });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت قطعه' });
    }
  });

  app.patch('/api/categories/:partId', (req, res) => {
    try {
      const { partId } = req.params;
      const { PartName, OtherNames, PartCollection } = req.body;

      if (!PartName || !PartName.trim()) {
        return res.status(400).json({ error: 'نام معیار قطعه الزامی است' });
      }

      const db = loadDb();
      const idx = db.part_name.findIndex((p: any) => String(p.Id) === String(partId));
      if (idx === -1) return res.status(404).json({ error: 'قطعه پیدا نشد' });

      const cleanPartName = PartName.trim();
      const duplicate = db.part_name.some((p: any) => String(p.Id) !== String(partId) && p.PartName.toLowerCase() === cleanPartName.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: 'قطعه‌ای با این نام قبلا ثبت شده است' });
      }

      db.part_name[idx].PartName = cleanPartName;
      db.part_name[idx].OtherNames = OtherNames || '';
      db.part_name[idx].PartCollection = PartCollection || '';

      db.product_prices.forEach((pr: any) => {
        if (String(pr.PartID) === String(partId)) {
          pr.PartName = cleanPartName;
          pr.OtherNames = OtherNames || '';
        }
      });

      saveDb(db);
      res.json({ success: true, Id: partId, PartName: cleanPartName, OtherNames: OtherNames || '', PartCollection: PartCollection || '' });
    } catch (err) {
      res.status(500).json({ error: 'خطا در بروزرسانی قطعه' });
    }
  });

  app.delete('/api/categories/:partId', (req, res) => {
    try {
      const { partId } = req.params;
      const db = loadDb();

      const idx = db.part_name.findIndex((p: any) => String(p.Id) === String(partId));
      if (idx === -1) return res.status(404).json({ error: 'قطعه پیدا نشد' });

      db.part_name.splice(idx, 1);
      db.product_prices = db.product_prices.filter((p: any) => String(p.PartID) !== String(partId));

      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در حذف قطعه' });
    }
  });

  app.post('/api/categories/bulk', (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
         return res.status(400).json({ error: 'باید آرایه باشد' });
      }

      const db = loadDb();
      const results: any[] = [];
      const skipped: string[] = [];
      const failedList: any[] = [];

      for (const item of items) {
        const nameInput = item.PartName ? String(item.PartName).trim() : '';
        const otherNamesRaw = item.OtherNames ? String(item.OtherNames).trim() : '';
        const partCollectionRaw = item.PartCollection ? String(item.PartCollection).trim() : '';

        if (!nameInput) {
          failedList.push({ ...item, Reason: 'نام معیار قطعه خالی است' });
          continue;
        }

        const duplicate = db.part_name.some((p: any) => p.PartName.toLowerCase() === nameInput.toLowerCase());
        if (duplicate) {
          skipped.push(nameInput);
          failedList.push({ ...item, Reason: 'تکراری' });
          continue;
        }

        const Id = `pt${Math.floor(100000 + Math.random() * 900000)}`;
        const newCat = {
          PartName: nameInput,
          OtherNames: otherNamesRaw,
          Id,
          PartCollection: partCollectionRaw,
          view_count: 0, views_1month: 0, views_3months: 0, views_6months: 0, views_1year: 0
        };

        db.part_name.push(newCat);
        results.push(newCat);
      }

      saveDb(db);
      res.json({
        success: true,
        insertedCount: results.length,
        skippedCount: skipped.length,
        inserted: results,
        skipped,
        failedList
      });
    } catch (err) {
      res.status(500).json({ error: 'خطا در آپلود دسته‌جمعی قطعات' });
    }
  });

  // Extra specific endpoints for Advanced Products management
  app.get('/api/machine-parts/new', (req, res) => {
    try {
      const { search } = req.query;
      const db = loadDb();
      let filtered = db.product_name.filter((p: any) => p.Status === 'New');

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.ProductName || '').toLowerCase().includes(term) ||
          (p.TargetName || '').toLowerCase().includes(term) ||
          (p.TargetModel || '').toLowerCase().includes(term) ||
          (p.PartNumber || '').toLowerCase().includes(term)
        );
      }
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لیست محصولات جدید' });
    }
  });

  app.get('/api/machine-parts/unlinked', (req, res) => {
    try {
      const { search } = req.query;
      const db = loadDb();
      let filtered = db.product_name.filter((p: any) => (!p.PartID || String(p.PartID) === '0' || String(p.PartID) === '') && p.Status !== 'deleted');

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.ProductName || '').toLowerCase().includes(term) ||
          (p.TargetName || '').toLowerCase().includes(term) ||
          (p.TargetModel || '').toLowerCase().includes(term) ||
          (p.PartNumber || '').toLowerCase().includes(term)
        );
      }
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لیست محصولات فاقد دسته‌بندی' });
    }
  });

  app.get('/api/machine-parts/all-products', (req, res) => {
    try {
      const { search } = req.query;
      const db = loadDb();
      let filtered = db.product_name.filter((p: any) => p.Status !== 'deleted');

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.ProductName || '').toLowerCase().includes(term) ||
          (p.TargetName || '').toLowerCase().includes(term) ||
          (p.TargetModel || '').toLowerCase().includes(term) ||
          (p.PartNumber || '').toLowerCase().includes(term)
        );
      }
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لیست کل محصولات' });
    }
  });

  app.get('/api/machine-parts/deleted', (req, res) => {
    try {
      const { search } = req.query;
      const db = loadDb();
      let filtered = db.product_name.filter((p: any) => p.Status === 'deleted');

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.ProductName || '').toLowerCase().includes(term) ||
          (p.TargetName || '').toLowerCase().includes(term) ||
          (p.TargetModel || '').toLowerCase().includes(term) ||
          (p.PartNumber || '').toLowerCase().includes(term)
        );
      }
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لیست محصولات حذف شده' });
    }
  });

  // Machine Parts
  app.get('/api/machine-parts', (req, res) => {
    try {
      const { category, search } = req.query;
      const db = loadDb();

      const info = db.part_name.find((p: any) => p.PartName === category);
      if (!info) return res.json([]);

      let filtered = db.product_name.filter((p: any) => String(p.PartID) === String(info.Id) && p.Status !== 'deleted');

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.ProductName || '').toLowerCase().includes(term) ||
          (p.TargetName || '').toLowerCase().includes(term) ||
          (p.TargetModel || '').toLowerCase().includes(term)
        );
      }

      const results = filtered.map((item: any) => ({
        name: item.ProductName,
        srtId: item.SRTID,
        productId: item.Id,
        id: item.Id,
        targetName: item.TargetName,
        targetModel: item.TargetModel,
        partNumber: item.PartNumber,
        productInformation: item.ProductInformation,
        PartID: item.PartID,
        PartName: item.PartName,
        OtherNames: item.OtherNames
      }));

      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لیست محصولات' });
    }
  });

  app.post('/api/machine-parts', (req, res) => {
    try {
      const { PartName, OtherNames, PartID, TargetName, TargetModel, ProductName, PartNumber, ProductInformation, Id, SRTID } = req.body;
      const actingUsername = String(req.headers['x-username'] || 'admin');

      const db = loadDb();
      const existing = db.product_name.find((p: any) => p.ProductName === ProductName && p.Status !== 'deleted');
      if (existing) {
        return res.status(400).json({ error: 'محصولی با این نام قبلا ثبت شده است' });
      }

      const newProduct = {
        PartName,
        OtherNames,
        PartID,
        TargetName,
        TargetModel,
        ProductName,
        PartNumber,
        ProductInformation,
        Id: Id || `PD${Math.floor(100000 + Math.random() * 900000)}`,
        SRTID,
        Status: 'New',
        view_count: 0, views_1month: 0, views_3months: 0, views_6months: 0, views_1year: 0
      };

      db.product_name.push(newProduct);
      logActivity(db, actingUsername, 'insert_product', newProduct.Id, 'Product', `کاربر ${actingUsername} محصول جدید "${ProductName}" را ثبت کرد.`);

      res.json({ success: true, product: newProduct });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت محصول' });
    }
  });

  app.patch('/api/machine-parts/:productId', (req, res) => {
    try {
      const { productId } = req.params;
      const { 
        TargetName, 
        TargetModel, 
        ProductName, 
        PartNumber, 
        ProductInformation, 
        SRTID, 
        PartID, 
        PartName, 
        OtherNames, 
        Status 
      } = req.body;
      const actingUsername = String(req.headers['x-username'] || 'admin');

      const db = loadDb();
      const existing = db.product_name.find((p: any) => p.ProductName === ProductName && String(p.Id || p.id || p.ProductID || p.productId) !== String(productId) && p.Status !== 'deleted');
      if (existing) {
        return res.status(400).json({ error: 'محصولی با این نام قبلا ثبت شده است' });
      }

      const oldDoc = db.product_name.find((p: any) => String(p.Id || p.id || p.ProductID || p.productId) === String(productId));
      if (!oldDoc) return res.status(404).json({ error: 'محصول یافت نشد' });

      // Automatically sync PartName and OtherNames if PartID was updated but those name fields were not explicitly supplied
      let resolvedPartName = PartName;
      let resolvedOtherNames = OtherNames;
      if (PartID !== undefined) {
        const catDoc = db.part_name.find((cat: any) => String(cat.Id) === String(PartID));
        if (catDoc) {
          if (resolvedPartName === undefined) resolvedPartName = catDoc.PartName;
          if (resolvedOtherNames === undefined) resolvedOtherNames = catDoc.OtherNames || '';
        }
      }

      db.product_name = db.product_name.map((p: any) => {
        if (String(p.Id || p.id || p.ProductID || p.productId) === String(productId)) {
          const updated = { ...p };
          if (TargetName !== undefined) updated.TargetName = TargetName;
          if (TargetModel !== undefined) updated.TargetModel = TargetModel;
          if (ProductName !== undefined) updated.ProductName = ProductName;
          if (PartNumber !== undefined) updated.PartNumber = PartNumber;
          if (ProductInformation !== undefined) updated.ProductInformation = ProductInformation;
          if (SRTID !== undefined) updated.SRTID = SRTID;
          if (PartID !== undefined) updated.PartID = PartID;
          if (resolvedPartName !== undefined) updated.PartName = resolvedPartName;
          if (resolvedOtherNames !== undefined) updated.OtherNames = resolvedOtherNames;
          if (Status !== undefined) updated.Status = Status;
          return updated;
        }
        return p;
      });

      db.product_prices = db.product_prices.map((p: any) => {
        if (String(p.ProductID || p.productID || p.productId || p.Id || p.id) === String(productId)) {
          const updated = { ...p };
          if (TargetName !== undefined) updated.TargetName = TargetName;
          if (TargetModel !== undefined) updated.TargetModel = TargetModel;
          if (ProductName !== undefined) updated.ProductName = ProductName;
          if (PartNumber !== undefined) updated.PartNumber = PartNumber;
          if (ProductInformation !== undefined) updated.ProductInformation = ProductInformation;
          if (SRTID !== undefined) updated.SRTID = SRTID;
          if (PartID !== undefined) updated.PartID = PartID;
          if (resolvedPartName !== undefined) updated.PartName = resolvedPartName;
          if (resolvedOtherNames !== undefined) updated.OtherNames = resolvedOtherNames;
          if (Status !== undefined) updated.Status = Status;
          return updated;
        }
        return p;
      });

      logActivity(db, actingUsername, 'update_product', productId, 'Product', `کاربر ${actingUsername} مشخصات محصول "${ProductName || oldDoc.ProductName}" را ویرایش نمود.`, { 
        old: oldDoc, 
        new: { 
          TargetName: TargetName !== undefined ? TargetName : oldDoc.TargetName, 
          TargetModel: TargetModel !== undefined ? TargetModel : oldDoc.TargetModel, 
          ProductName: ProductName !== undefined ? ProductName : oldDoc.ProductName, 
          PartNumber: PartNumber !== undefined ? PartNumber : oldDoc.PartNumber, 
          ProductInformation: ProductInformation !== undefined ? ProductInformation : oldDoc.ProductInformation, 
          SRTID: SRTID !== undefined ? SRTID : oldDoc.SRTID,
          PartID: PartID !== undefined ? PartID : oldDoc.PartID,
          PartName: resolvedPartName !== undefined ? resolvedPartName : oldDoc.PartName,
          OtherNames: resolvedOtherNames !== undefined ? resolvedOtherNames : oldDoc.OtherNames,
          Status: Status !== undefined ? Status : oldDoc.Status
        } 
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ویرایش محصول' });
    }
  });

  app.delete('/api/machine-parts/:productId', (req, res) => {
    try {
      const { productId } = req.params;
      const db = loadDb();

      db.product_name = db.product_name.map((p: any) => {
        if (String(p.Id || p.id || p.ProductID || p.productId) === String(productId)) return { ...p, Status: 'deleted' };
        return p;
      });

      db.product_prices = db.product_prices.map((p: any) => {
        if (String(p.ProductID || p.productID || p.productId || p.Id || p.id) === String(productId)) return { ...p, Status: 'deleted' };
        return p;
      });

      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در حذف محصول' });
    }
  });

  app.post('/api/machine-parts/bulk', (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'باید آرایه باشد' });
      }

      const db = loadDb();
      const results: any[] = [];
      const failed: any[] = [];

      for (const item of items) {
        let targetNameRaw = item.TargetName ? String(item.TargetName).trim() : '';
        let targetModelRaw = item.TargetModel ? String(item.TargetModel).trim() : '';
        let productName = `${targetNameRaw} ${targetModelRaw}`.trim();
        const partNumberRaw = item.PartNumber ? String(item.PartNumber).trim() : '';
        const infoRaw = item.ProductInformation ? String(item.ProductInformation).trim() : '';
        const srtidRaw = item.SRTID ? String(item.SRTID).trim() : '';

        if (!targetNameRaw || !targetModelRaw) {
          failed.push({ ...item, Error: 'نام دستگاه و مدل الزامی است' });
          continue;
        }

        const duplicate = db.product_name.some((p: any) => p.ProductName.toLowerCase() === productName.toLowerCase() && p.Status !== 'deleted');
        if (duplicate) {
          failed.push({ ...item, Error: 'تکراری' });
          continue;
        }

        // Match with category
        const matchedCategory = db.part_name.find((cat: any) => {
          const catName = (cat.PartName || '').toLowerCase().trim();
          const target = targetNameRaw.toLowerCase().trim();
          const matchesList = (cat.OtherNames || '').split(/[,،]/).map((n: string) => n.trim().toLowerCase());
          return catName === target || matchesList.includes(target);
        });

        if (!matchedCategory) {
          failed.push({ ...item, Error: 'دسته مادر قطعه برای نام دستگاه یافت نشد' });
          continue;
        }

        const Id = `PD${Math.floor(100000 + Math.random() * 900000)}`;
        const newProd = {
          PartName: matchedCategory.PartName,
          OtherNames: matchedCategory.OtherNames || '',
          PartID: matchedCategory.Id,
          TargetName: targetNameRaw,
          TargetModel: targetModelRaw,
          ProductName: productName,
          PartNumber: partNumberRaw,
          ProductInformation: infoRaw,
          Id,
          SRTID: srtidRaw,
          Status: 'New',
          view_count: 0, views_1month: 0, views_3months: 0, views_6months: 0, views_1year: 0
        };

        db.product_name.push(newProd);
        results.push(newProd);
      }

      saveDb(db);
      res.json({
        success: true,
        insertedCount: results.length,
        failedCount: failed.length,
        inserted: results,
        failed
      });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت گروهی محصولات' });
    }
  });

  // Price Quotes Crud
  app.get('/api/quotes', (req, res) => {
    try {
      const { title, search } = req.query;
      const db = loadDb();

      let filtered = db.product_prices.filter((p: any) => 
        p.ProductName === title && 
        p.Status !== 'deleted' && 
        p.LastPriceUpdateDate !== 'ثبت اولیه'
      );

      if (search) {
        const term = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.SupplierName || '').toLowerCase().includes(term) ||
          (p.From || '').toLowerCase().includes(term) ||
          (p.Material || '').toLowerCase().includes(term) ||
          (p.ProductInformation || '').toLowerCase().includes(term)
        );
      }

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت قیمت‌ها' });
    }
  });

  app.post('/api/quotes', (req, res) => {
    try {
      const data = req.body;
      const actingUsername = String(req.headers['x-username'] || 'admin');

      const db = loadDb();
      const productInfo = db.product_name.find((p: any) => p.ProductName === data.ProductName);
      const newQuote = { ...productInfo, ...data, Id: data.Id || data.PriceId || `PR${Math.floor(100000 + Math.random() * 900000)}` };

      db.product_prices.push(newQuote);
      logActivity(db, actingUsername, 'insert_price', newQuote.Id || 'PRQ_NEW', 'price', `کاربر ${actingUsername} قیمت جدید "${data.Price}" ریال برای محصول "${data.ProductName}" ثبت کرد.`);

      res.json({ success: true, quote: newQuote });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت قیمت جدید' });
    }
  });

  app.patch('/api/quotes/:priceId', (req, res) => {
    try {
      const { priceId } = req.params;
      const updateData = req.body;
      const actingUsername = String(req.headers['x-username'] || 'admin');

      const db = loadDb();
      const oldDoc = db.product_prices.find((p: any) => String(p.Id) === String(priceId) || String(p.PriceId) === String(priceId));

      db.product_prices = db.product_prices.map((p: any) => {
        if (String(p.Id) === String(priceId) || String(p.PriceId) === String(priceId)) return { ...p, ...updateData };
        return p;
      });

      logActivity(db, actingUsername, 'update_price', priceId, 'price', `کاربر ${actingUsername} قیمت محصول "${oldDoc ? oldDoc.ProductName : (updateData.ProductName || '')}" را به "${updateData.Price || ''}" تغییر داد.`);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در بروزرسانی قیمت' });
    }
  });

  app.delete('/api/quotes/:priceId', (req, res) => {
    try {
      const { priceId } = req.params;
      const { status } = req.query;

      const db = loadDb();
      db.product_prices = db.product_prices.map((p: any) => {
        if (String(p.Id) === String(priceId) || String(p.PriceId) === String(priceId)) return { ...p, Status: status || 'deleted' };
        return p;
      });

      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در انجام عملیات غیرفعال‌سازی' });
    }
  });

  app.get('/api/quotes/:id', (req, res) => {
    try {
      const db = loadDb();
      const quote = db.product_prices.find((p: any) => p.Id === req.params.id || p.PriceId === req.params.id);
      if (quote) {
        res.json(quote);
      } else {
        res.status(404).json({ message: 'يافت نشد' });
      }
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت جزئیات قیمت' });
    }
  });

  // Reports
  app.get('/api/reports/stats', (req, res) => {
    try {
      const { range } = req.query;
      const db = loadDb();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let filteredLogs = [...db.audit_logs];
      if (range && range !== 'all') {
        let boundary = new Date(0);
        if (range === 'today') boundary = startOfToday;
        else if (range === 'week') boundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (range === 'month') boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        filteredLogs = filteredLogs.filter((log: any) => new Date(log.created_at) >= boundary);
      }

      const userStats = db.users.map((user: any) => {
        const userLogs = filteredLogs.filter((l: any) => l.user_id === user.userID);
        return {
          userID: user.userID,
          username: user.username,
          role: user.role,
          email: user.email || '-',
          phone: user.phone || '-',
          insert_product_count: userLogs.filter((l: any) => l.action_type === 'insert_product').length,
          update_product_count: userLogs.filter((l: any) => l.action_type === 'update_product').length,
          insert_price_count: userLogs.filter((l: any) => l.action_type === 'insert_price').length,
          update_price_count: userLogs.filter((l: any) => l.action_type === 'update_price').length,
          total_activity: userLogs.length
        };
      }).sort((a: any, b: any) => b.total_activity - a.total_activity);

      const priceUpdatesToday = db.audit_logs.filter((l: any) => l.action_type === 'update_price' && new Date(l.created_at) >= startOfToday).length;

      // Top user calculation
      const todayLogs = db.audit_logs.filter((l: any) => new Date(l.created_at) >= startOfToday);
      const userActivityMap: Record<string, number> = {};
      todayLogs.forEach((l: any) => {
        userActivityMap[l.user_id] = (userActivityMap[l.user_id] || 0) + 1;
      });

      let topUserId = '';
      let topCount = 0;
      Object.entries(userActivityMap).forEach(([uid, cnt]) => {
        if (cnt > topCount) {
          topCount = cnt;
          topUserId = uid;
        }
      });

      let activeUserTodayStr = 'بدون فعالیت';
      if (topUserId && topCount > 0) {
        const uObj = db.users.find((u: any) => u.userID === topUserId);
        if (uObj) activeUserTodayStr = `${uObj.username} (${topCount} فعالیت)`;
      }

      res.json({
        userStats,
        summary: { priceUpdatesToday, activeUserToday: activeUserTodayStr }
      });
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت گزارشات' });
    }
  });

  app.get('/api/audit-logs/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const db = loadDb();

      const userLogs = db.audit_logs
        .filter((log: any) => log.user_id === userId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      res.json(userLogs);
    } catch (err) {
      res.status(500).json({ error: 'خطا در دریافت لاگ‌ها' });
    }
  });

  // Views logger
  app.post('/api/views/:type/:id', (req, res) => {
    try {
      const { type, id } = req.params;
      const todayStr = new Date().toISOString().split('T')[0];
      const db = loadDb();

      let foundId = id;
      if (type === 'part') {
        const category = db.part_name.find((p: any) => p.Id === id || p.PartID === id || p.PartName === id);
        if (!category) return res.status(404).json({ error: 'یافت نشد' });

        foundId = category.Id;
        category.view_count = (category.view_count || 0) + 1;
        category.views_1month = (category.views_1month || 0) + 1;
        category.views_3months = (category.views_3months || 0) + 1;
        category.views_6months = (category.views_6months || 0) + 1;
        category.views_1year = (category.views_1year || 0) + 1;
      } else if (type === 'product') {
        const prod = db.product_name.find((p: any) => p.Id === id || p.ProductID === id || p.ProductName === id);
        if (!prod) return res.status(404).json({ error: 'یافت نشد' });

        foundId = prod.Id;
        prod.view_count = (prod.view_count || 0) + 1;
        prod.views_1month = (prod.views_1month || 0) + 1;
        prod.views_3months = (prod.views_3months || 0) + 1;
        prod.views_6months = (prod.views_6months || 0) + 1;
        prod.views_1year = (prod.views_1year || 0) + 1;
      }

      let localLog = db.daily_views.find((l: any) => l.item_id === foundId && l.date === todayStr);
      if (localLog) {
        localLog.count += 1;
      } else {
        db.daily_views.push({ item_id: foundId, target_id: type, date: todayStr, count: 1 });
      }

      saveDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'خطا در ثبت بازدید' });
    }
  });

  app.get('/api/reports/top-views', (req, res) => {
    try {
      const type = String(req.query.type || 'part');
      const range = String(req.query.range || '3months');
      const pageNum = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limitNum = Math.max(1, parseInt(req.query.limit as string || '30', 10));
      const skipNum = (pageNum - 1) * limitNum;

      let sortField = 'views_3months';
      if (range === '1month') sortField = 'views_1month';
      else if (range === '6months') sortField = 'views_6months';
      else if (range === '1year') sortField = 'views_1year';
      else if (range === 'all') sortField = 'view_count';

      const db = loadDb();
      let source = type === 'part' ? [...db.part_name] : [...db.product_name];

      source.sort((a: any, b: any) => {
        const valA = a[sortField] || 0;
        const valB = b[sortField] || 0;
        return valB - valA;
      });

      const total = source.length;
      const items = source.slice(skipNum, skipNum + limitNum);

      res.json({
        items,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      });
    } catch (err) {
      res.status(500).json({ error: 'خطا در پربازدید ترین ها' });
    }
  });

  // Nightly Pre-aggregation Routine
  const runNightlyPreAggregation = async () => {
    console.log('⏰ Running Nightly Pre-Aggregation Routine...');
    const now = new Date();
    const getPastDateStr = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    const d31 = getPastDateStr(31);
    const d91 = getPastDateStr(91);
    const d181 = getPastDateStr(181);
    const d366 = getPastDateStr(366);

    const db = loadDb();

    // 31 days process
    db.daily_views.filter((v: any) => v.date === d31).forEach((r: any) => {
      if (r.target_id === 'part') {
        const cat = db.part_name.find((c: any) => c.Id === r.item_id || c.PartID === r.item_id);
        if (cat) cat.views_1month = Math.max(0, (cat.views_1month || 0) - r.count);
      } else {
        const prod = db.product_name.find((p: any) => p.Id === r.item_id || p.ProductID === r.item_id);
        if (prod) prod.views_1month = Math.max(0, (prod.views_1month || 0) - r.count);
      }
    });

    // 91 days process
    db.daily_views.filter((v: any) => v.date === d91).forEach((r: any) => {
      if (r.target_id === 'part') {
        const cat = db.part_name.find((c: any) => c.Id === r.item_id || c.PartID === r.item_id);
        if (cat) cat.views_3months = Math.max(0, (cat.views_3months || 0) - r.count);
      } else {
        const prod = db.product_name.find((p: any) => p.Id === r.item_id || p.ProductID === r.item_id);
        if (prod) prod.views_3months = Math.max(0, (prod.views_3months || 0) - r.count);
      }
    });

    // delete older than year
    db.daily_views = db.daily_views.filter((v: any) => v.date >= d366);
    saveDb(db);
    console.log('🧹 Dry nightly pre-aggregation complete.');
  };

  app.post('/api/reports/trigger-nightly-job', async (req, res) => {
    try {
      await runNightlyPreAggregation();
      res.json({ success: true, message: 'عملیات پیش‌تجميع بازدیدها با موفقیت انجام شد.' });
    } catch (err) {
      res.status(500).json({ error: 'خطا در پردازش شبانه' });
    }
  });

  // Periodically trigger pre-aggregation simulation (e.g. Daily)
  setInterval(() => {
    runNightlyPreAggregation().catch(e => console.error(e));
  }, 24 * 60 * 60 * 1000);

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
