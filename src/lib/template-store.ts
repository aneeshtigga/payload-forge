
import type { PayloadFormValues } from './payload-schema';
import { nanoid } from 'nanoid';
import { db } from './firebase'; // Import Firestore instance
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { defaultPayloadFormValues } from './payload-schema';

const TEMPLATES_COLLECTION = 'payloadForgeTemplates';

export interface StoredTemplate {
  id: string;
  name: string;
  description?: string;
  data: PayloadFormValues;
  createdAt: string | Timestamp; // Store as ISO string or Firestore Timestamp
  updatedAt: string | Timestamp; // Store as ISO string or Firestore Timestamp
}

// Helper to convert Firestore Timestamps to ISO strings
function processTimestamps(template: StoredTemplate): StoredTemplate {
  return {
    ...template,
    createdAt: template.createdAt instanceof Timestamp ? template.createdAt.toDate().toISOString() : template.createdAt as string,
    updatedAt: template.updatedAt instanceof Timestamp ? template.updatedAt.toDate().toISOString() : template.updatedAt as string,
  };
}


export async function getTemplates(): Promise<StoredTemplate[]> {
  try {
    const templatesCollection = collection(db, TEMPLATES_COLLECTION);
    const q = query(templatesCollection, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => processTimestamps({ id: docSnap.id, ...docSnap.data() } as StoredTemplate));
  } catch (error) {
    console.error("Error fetching templates from Firestore:", error);
    return [];
  }
}

export async function getTemplateById(id: string): Promise<StoredTemplate | null> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return processTimestamps({ id: docSnap.id, ...docSnap.data() } as StoredTemplate);
    } else {
      console.log("No such template document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching template by ID from Firestore:", error);
    return null;
  }
}

export async function saveTemplate(
  templateData: PayloadFormValues,
  name: string,
  description?: string,
  id?: string
): Promise<StoredTemplate | null> {
  try {
    const now = serverTimestamp(); // Use Firestore server timestamp for consistency
    
    if (id) { // Editing existing template
      const docRef = doc(db, TEMPLATES_COLLECTION, id);
      const updatedTemplateData = {
        name,
        description: description || "",
        data: templateData,
        updatedAt: now,
      };
      await setDoc(docRef, updatedTemplateData, { merge: true }); // merge: true updates fields or creates if not exist
      // To return the full template, we might need to fetch it again or construct it carefully
      // For simplicity, returning the input details with the ID and assuming server handles timestamps
      // A more robust way would be to refetch or listen for snapshot changes.
      return { id, name, description, data: templateData, createdAt: "N/A (Existing)", updatedAt: new Date().toISOString() }; // Placeholder timestamps
    } else { // Creating new template
      const newId = nanoid(); // Keep nanoid for client-side generated ID if needed, but Firestore can auto-generate.
                             // Using client-side nanoid for consistency with previous implementation.
      const newTemplateData = {
        id: newId, // Store nanoid also in the document if needed for querying by this specific id format
        name,
        description: description || "",
        data: templateData,
        createdAt: now,
        updatedAt: now,
      };
      // Firestore `addDoc` generates its own ID. If we want to use nanoid as the document ID:
      const docRef = doc(db, TEMPLATES_COLLECTION, newId);
      await setDoc(docRef, newTemplateData);
      return { ...newTemplateData, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; // Placeholder timestamps
    }
  } catch (error) {
    console.error("Error saving template to Firestore:", error);
    return null;
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting template from Firestore:", error);
    return false;
  }
}

// Helper to add a default template if none exist (for initial setup)
export async function initializeDefaultTemplate() {
  try {
    const templates = await getTemplates(); // Check if any templates exist
    if (templates.length === 0) {
      console.log("No templates found in Firestore, initializing default template...");
      // saveTemplate will now use nanoid internally for the ID
      await saveTemplate(defaultPayloadFormValues, "Default Spark Job", "A pre-configured Spark job template.");
      console.log("Default template initialized.");
    } else {
      console.log(`${templates.length} templates found in Firestore. No initialization needed.`);
    }
  } catch (error) {
    console.error("Error during default template initialization:", error);
  }
}
