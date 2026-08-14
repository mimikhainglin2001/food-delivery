import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[]; // list of customization names
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

const RATE_LIMIT_MS = 1100;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestAt = 0;
let pending = Promise.resolve();

async function paced<T>(fn: () => Promise<T>): Promise<T> {
  const run = pending.then(async () => {
    const wait = Math.max(0, RATE_LIMIT_MS - (Date.now() - lastRequestAt));
    if (wait > 0) {
      await sleep(wait);
    }
    lastRequestAt = Date.now();
    return fn();
  });

  pending = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

async function clearAll(collectionId: string): Promise<void> {
  const list = await paced(() =>
    databases.listDocuments(appwriteConfig.databaseId, collectionId),
  );

  await Promise.all(
    list.documents.map((doc) =>
      paced(() =>
        databases.deleteDocument(
          appwriteConfig.databaseId,
          collectionId,
          doc.$id,
        ),
      ),
    ),
  );
}

async function clearStorage(): Promise<void> {
  const list = await paced(() => storage.listFiles(appwriteConfig.bucketId));

  await Promise.all(
    list.files.map((file) =>
      paced(() => storage.deleteFile(appwriteConfig.bucketId, file.$id)),
    ),
  );
}

async function uploadImageToStorage(imageUrl: string) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  const fileObj = {
    name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
    type: blob.type,
    size: blob.size,
    uri: imageUrl,
  };

  const file = await paced(() =>
    storage.createFile(appwriteConfig.bucketId, ID.unique(), fileObj),
  );

  return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
}

async function seed(): Promise<void> {
  console.log("🌱 Seeding: clearing existing data...");
  // Delete dependent collections FIRST to avoid "restrict" relationship errors:
  // menu_customizations references menu + customizations
  // menu references categories
  await clearAll(appwriteConfig.menuCustomizationsCollectionId);
  await clearAll(appwriteConfig.menuCollectionId);
  await clearAll(appwriteConfig.customizationsCollectionId);
  await clearAll(appwriteConfig.categoriesCollectionId);
  await clearStorage();

  // 2. Create Categories
  console.log("🌱 Creating categories...");
  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const doc = await paced(() =>
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        ID.unique(),
        cat,
      ),
    );
    categoryMap[cat.name] = doc.$id;
  }

  // 3. Create Customizations
  console.log("🌱 Creating customizations...");
  const customizationMap: Record<string, string> = {};
  for (const cus of data.customizations) {
    const doc = await paced(() =>
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsCollectionId,
        ID.unique(),
        {
          name: cus.name,
          price: cus.price,
          type: cus.type,
        },
      ),
    );
    customizationMap[cus.name] = doc.$id;
  }

  // 4. Create Menu Items
  console.log("🌱 Creating menu items...");
  const menuMap: Record<string, string> = {};
  for (const item of data.menu) {
    const uploadedImage = await uploadImageToStorage(item.image_url);

    const doc = await paced(() =>
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId,
        ID.unique(),
        {
          name: item.name,
          description: item.description,
          image_url: uploadedImage,
          price: item.price,
          rating: item.rating,
          calories: item.calories,
          protein: item.protein,
          categories: categoryMap[item.category_name],
        },
      ),
    );

    menuMap[item.name] = doc.$id;
    console.log(`🌱  created "${item.name}"`);

    // 5. Create menu_customizations
    for (const cusName of item.customizations) {
      await paced(() =>
        databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCustomizationsCollectionId,
          ID.unique(),
          {
            menu: doc.$id,
            customizations: customizationMap[cusName],
          },
        ),
      );
    }
  }

  console.log("✅ Seeding complete.");
}

export default seed;
