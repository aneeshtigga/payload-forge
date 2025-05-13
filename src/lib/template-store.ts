
import type { PayloadFormValues } from './payload-schema';
import { nanoid } from 'nanoid'; // Changed from uuid

const TEMPLATES_STORAGE_KEY = 'payloadForgeTemplates';

export interface StoredTemplate {
  id: string;
  name: string;
  description?: string; // Optional description
  data: PayloadFormValues;
  createdAt: string;
  updatedAt: string;
}

export function getTemplates(): StoredTemplate[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return templatesJson ? JSON.parse(templatesJson) : [];
  } catch (error) {
    console.error("Error fetching templates from localStorage:", error);
    return [];
  }
}

export function getTemplateById(id: string): StoredTemplate | undefined {
  const templates = getTemplates();
  return templates.find(template => template.id === id);
}

export function saveTemplate(
  templateData: PayloadFormValues,
  name: string,
  description?: string,
  id?: string
): StoredTemplate | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    let templates = getTemplates();
    const now = new Date().toISOString();
    let templateToSave: StoredTemplate | undefined;

    if (id) { // Editing existing template
      const existingIndex = templates.findIndex(template => template.id === id);
      if (existingIndex > -1) {
        templates[existingIndex] = {
          ...templates[existingIndex],
          name,
          description,
          data: templateData,
          updatedAt: now,
        };
        templateToSave = templates[existingIndex];
      } else {
        // If ID provided but not found, create a new one with the given ID (or generate new if that's preferred logic)
        // For now, let's assume if ID is given, it should exist, or it's an error.
        // To be safe, let's create a new one if not found, using the provided ID if it was intended.
        // However, standard practice would be to generate a new ID if it's truly a "new" entry.
        // Let's stick to nanoid for any new ID.
        const newId = nanoid(); // Generate new nanoid
        const newTemplate: StoredTemplate = { id: newId, name, description, data: templateData, createdAt: now, updatedAt: now };
        templates.push(newTemplate);
        templateToSave = newTemplate;
      }
    } else { // Creating new template
      const newId = nanoid(); // Use nanoid for new templates
      const newTemplate: StoredTemplate = { id: newId, name, description, data: templateData, createdAt: now, updatedAt: now };
      templates.push(newTemplate);
      templateToSave = newTemplate;
    }

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return templateToSave || null;
  } catch (error) {
    console.error("Error saving template to localStorage:", error);
    return null;
  }
}

export function deleteTemplate(id: string): boolean {
   if (typeof window === 'undefined') {
    return false;
  }
  try {
    let templates = getTemplates();
    const newTemplates = templates.filter(template => template.id !== id);
    if (templates.length === newTemplates.length) return false; // Not found

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
    return true;
  } catch (error) {
    console.error("Error deleting template from localStorage:", error);
    return false;
  }
}

// Helper to add a default template if none exist (for initial setup)
export function initializeDefaultTemplate() {
  if (typeof window === 'undefined') return;
  const templates = getTemplates();
  if (templates.length === 0) {
    const { defaultPayloadFormValues } = require('./payload-schema'); // Lazy import
    // saveTemplate will now use nanoid internally for the ID
    saveTemplate(defaultPayloadFormValues, "Default Spark Job", "A pre-configured Spark job template.");
  }
}
