import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';

export const toggleBookmark = async (userId: string, toolId: string, isBookmarked: boolean) => {
  const userRef = doc(db, 'users', userId);
  try {
    if (isBookmarked) {
      await updateDoc(userRef, {
        bookmarks: arrayRemove(toolId)
      });
      toast.success('Bookmark removed');
    } else {
      await updateDoc(userRef, {
        bookmarks: arrayUnion(toolId)
      });
      toast.success('Bookmark added');
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};
