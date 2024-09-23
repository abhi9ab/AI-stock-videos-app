import { Alert } from 'react-native';
import { Account, Client, ID, Avatars, Databases, Query, Storage } from 'react-native-appwrite';

export const config = {
    endpoint: process.env.EXPO_PUBLIC_ENDPOINT,
    platform: process.env.EXPO_PUBLIC_PLATFORM,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_DATABASE_ID,
    userCollectionId: process.env.EXPO_PUBLIC_USER_COLLECTION_ID,
    videoCollectionId: process.env.EXPO_PUBLIC_VIDEO_COLLECTION_ID,
    storageId: process.env.EXPO_PUBLIC_STORAGE_ID,
};

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint) // Your Appwrite Endpoint
    .setProject(config.projectId) // Your project ID
    .setPlatform(config.platform) // Your application ID or bundle ID.
    ;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if (!newAccount) {
            throw new Error("User not created");
        }

        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password);

        const newUser = await databases.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
            }
        );

        return newUser;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

export async function signIn(email, password) {
    try {
        const session = await account.createEmailPasswordSession(email, password);

        return session;
    } catch (error) {
        throw new Error(error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw Error;
 
        const currentUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        if (!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function getAllPosts() {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.orderDesc("$createdAt")]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
}

export async function getLatestPosts() {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(7)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
}

export async function searchPosts(query) {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.search("title", query)]
      );
  
      if (!posts) throw new Error("Something went wrong");
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
}

export async function getUserPosts(userId) {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.equal("creator", userId), Query.orderDesc("$createdAt"), Query.limit(7)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }

export async function signOut() {
    try {
        const session = await account.deleteSession("current");

        return session;
    } catch (error) {
        throw new Error(error);
    }
}

export async function getFilePreview(fileId, type) {
    let fileUrl;
  
    try {
      if (type === "video") {
        fileUrl = storage.getFileView(config.storageId, fileId);
      } else if (type === "image") {
        fileUrl = storage.getFilePreview(
          config.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        );
      } else {
        throw new Error("Invalid file type");
      }
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }

export async function uploadFile(file, type) {
    if (!file) return;
  
    const asset = { 
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri,
    };
  
    try {
      const uploadedFile = await storage.createFile(
        config.storageId,
        ID.unique(),
        asset
      );
  
      const fileUrl = await getFilePreview(uploadedFile.$id, type);
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }

export async function createVideoPost(form) {
    try {
      const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFile(form.thumbnail, "image"),
        uploadFile(form.video, "video"),
      ]);
      
      const newPost = await databases.createDocument(
        config.databaseId,
        config.videoCollectionId,
        ID.unique(),
        {
          title: form.title,
          thumbnail: thumbnailUrl,
          video: videoUrl,
          prompt: form.prompt,
          creator: form.userId,
          save: [form.userId],
        }
      );
  
      return newPost;
    } catch (error) {
      throw new Error(error);
    }
  }

// Function to check if there is an active session

export const checkActiveSession = async () => {
  try {
    const session = await account.getSession('current'); // Get the current session
    return session !== null; // Return true if there is an active session
  } catch (error) {
    // If there's an error (e.g., no active session), handle it appropriately
    if (error.code === 401) {
      return false; // No active session
    }
    throw error; // Re-throw other unexpected errors
  }
};


// Function to delete all sessions for the current user

export const deleteSessions = async () => {
  try {
    // Get the list of all sessions
    const sessions = await account.listSessions();

    // Delete each session
    await Promise.all(
      sessions.sessions.map(async (session) => {
        await account.deleteSession(session.$id);
      })
    );

    console.log('All sessions deleted successfully');
  } catch (error) {
    console.error('Error deleting sessions:', error.message);
    throw error; // Re-throw the error for further handling
  }
};

export async function savePost(video, userObject) {
  try {
    const postList = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal("video", video)]
    );

    if (postList.total === 0) {
      throw new Error("Post not found");
    }

    const post = postList.documents[0];
    const userSaved = post.save.some(user => user.accountId === userObject.accountId);

    if (userSaved) {
      throw new Error("Already saved");
    }

    const updatedPost = await databases.updateDocument(
      config.databaseId,
      config.videoCollectionId,
      post.$id, 
      {
        save: [...post.save, userObject], 
      }
    );
  
    return updatedPost.save.length; 
  } catch (error) {
    throw new Error(error.message); 
  }
}

export async function getSavedPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId
    );

    const savedPosts = posts.documents.filter(post =>
      post.save.some(user => user.accountId === userId)
    );

    return savedPosts;

  } catch (error) {
    throw new Error(error.message);
  }
}

export async function unSavePost(video, userId) {
  try {
    const postList = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal("video", video)]
    );

    if (postList.total === 0) {
      throw new Error("Post not found");
    }

    const post = postList.documents[0];
    const userSaved = post.save.some(user => user.accountId === userId);

    if (!userSaved) {
      Alert.alert("You have not saved this post");
      throw new Error("Not saved");
    }

    const updatedPost = await databases.updateDocument(
      config.databaseId,
      config.videoCollectionId,
      post.$id, 
      {
        save: post.save.filter(user => user.accountId !== userId), 
      }
    );

    return updatedPost.save.length; 
  } catch (error) {
    throw new Error(error.message); 
  }
} 
