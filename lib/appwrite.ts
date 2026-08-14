import {
  Category,
  CreateUserParams,
  GetMenuParams,
  MenuItem,
  SignInParams,
} from "@/type";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  platform: "com.jsm.foodordering",
  databaseId: "6a7d269a0030399bb583",
  bucketId: "6a7dc22c003e6c6729d1",
  userCollectionId: "user",
  categoriesCollectionId: "categories",
  menuCollectionId: "menu",
  customizationsCollectionId: "customizations",
  menuCustomizationsCollectionId: "menu_customizations",
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({
  email,
  password,
  name,
}: CreateUserParams) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw Error;

    await signIn({ email, password });

    const avatarUrl = avatars.getInitialsURL(name);

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      { email, name, accountId: newAccount.$id, avatar: avatarUrl },
    );
  } catch (e) {
    throw new Error(e as string);
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)],
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
};

export const getMenu = async ({
  category,
  categoryName,
  query,
}: GetMenuParams) => {
  try {
    const menus = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
    );

    const documents = menus.documents as unknown as MenuItem[];
    const searchQuery = query?.toLowerCase().trim();
    const categoryMatches = [category, categoryName].filter(
      (value): value is string => Boolean(value),
    );

    console.log(
      "[getMenu] params:",
      { category, categoryName, query },
      "count:",
      documents.length,
    );
    console.log(
      "[getMenu] first doc keys:",
      Object.keys(documents[0] ?? {}),
    );
    console.log(
      "[getMenu] first 3 docs categories field:",
      JSON.stringify(
        documents
          .slice(0, 3)
          .map((doc) => (doc as unknown as Record<string, unknown>).categories),
      ),
    );

    return documents.filter((item) => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery)) {
        return false;
      }

      if (categoryMatches.length === 0) return true;

      const itemCategory = (item as unknown as Record<string, unknown>)
        .categories;

      if (Array.isArray(itemCategory)) {
        return itemCategory.some((value) => {
          const id = (value as { $id?: string })?.$id ?? value;
          return categoryMatches.includes(id as string);
        });
      }

      if (itemCategory && typeof itemCategory === "object") {
        const { $id, name } = itemCategory as {
          $id?: string;
          name?: string;
        };
        return (
          categoryMatches.includes($id as string) ||
          categoryMatches.includes(name as string)
        );
      }

      return categoryMatches.includes(itemCategory as string);
    });
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getCategories = async () => {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
    );

    return categories.documents as unknown as Category[];
  } catch (e) {
    throw new Error(e as string);
  }
};

// TEMP DEBUG - remove later
export const debugCategories = async () => {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
    );
    console.log(
      "[debugCategories]",
      JSON.stringify(
        categories.documents.map((c) => ({ $id: c.$id, keys: Object.keys(c) })),
      ),
    );
    return categories.documents;
  } catch (e) {
    throw new Error(e as string);
  }
};
