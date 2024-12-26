import { db } from '../firebase/firebase';
import { 
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    email: string;
    name: string;
    photoURL?: string;
  };
  timestamp: Timestamp;
  read: boolean;
}

interface ChatUser {
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Send a new chat message
export const sendMessage = async (
  projectId: string, 
  user: ChatUser, 
  content: string
): Promise<void> => {
  try {
    const chatRef = collection(db, 'projects', projectId, 'chat');
    await addDoc(chatRef, {
      content,
      sender: {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL
      },
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to chat messages
export const subscribeToChat = (
  projectId: string, 
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const chatRef = collection(db, 'projects', projectId, 'chat');
  const chatQuery = query(
    chatRef,
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(chatQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage);
    });
    callback(messages.reverse());
  });
};

// Mark messages as read
export const markMessagesAsRead = async (
  projectId: string, 
  messageIds: string[]
): Promise<void> => {
  try {
    const batch = db.batch();
    messageIds.forEach((messageId) => {
      const messageRef = doc(db, 'projects', projectId, 'chat', messageId);
      batch.update(messageRef, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get unread message count
export const getUnreadCount = (
  projectId: string, 
  userEmail: string
): Promise<number> => {
  const chatRef = collection(db, 'projects', projectId, 'chat');
  const unreadQuery = query(
    chatRef,
    where('read', '==', false),
    where('sender.email', '!=', userEmail)
  );

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      resolve(snapshot.size);
      unsubscribe();
    }, reject);
  });
}; 