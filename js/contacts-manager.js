// /js/contacts-manager.js
// Contact Management System for Old Laurentian RFC
// FIXED: Auto-initializes from localStorage, proper Netlify Blobs sync

class ContactsManager {
  constructor() {
    this.storageKey = 'olrfc_contacts';
    this.contacts = [];
    this.isInitialized = false;
    
    // Predefined categories with colors
    this.defaultCategories = [
      { name: 'Club Leadership', color: 'maroon', emoji: '🏉' },
      { name: 'Senior Section', color: 'green', emoji: '🏆' },
      { name: 'Coaching Staff', color: 'green', emoji: '📋' },
      { name: 'Minis & Juniors Section', color: 'gold', emoji: '👦' },
      { name: 'Safeguarding & Welfare', color: 'green', emoji: '🛡️' },
      { name: 'Operations & Facilities', color: 'green', emoji: '⚙️' },
      { name: 'Communications & Media', color: 'green', emoji: '📣' }
    ];

    // 🔧 FIX: Auto-initialize from localStorage on construction
    this.autoInitialize();
  }

  // 🔧 NEW: Auto-initialize synchronously from localStorage
  autoInitialize() {
    console.log('📥 Auto-initializing contacts manager...');
    
    // Load from localStorage immediately (synchronous)
    const stored = localStorage.getItem(this.storageKey);
    this.contacts = stored ? JSON.parse(stored) : [];
    this.isInitialized = true;
    
    console.log(`✅ Loaded ${this.contacts.length} contacts from localStorage`);
  }

  // Initialize - can still be called manually to sync from Netlify
  async initialize(syncFromNetlify = false) {
    console.log('📥 Initializing contacts manager...');
    
    // Reload from localStorage
    const stored = localStorage.getItem(this.storageKey);
    this.contacts = stored ? JSON.parse(stored) : [];
    
    console.log(`✅ Loaded ${this.contacts.length} contacts from localStorage`);
    
    // If requested, sync from Netlify Blobs
    if (syncFromNetlify || this.contacts.length === 0) {
      console.log('🌐 Syncing from Netlify Blobs...');
      await this.syncFromNetlify();
    }
    
    this.isInitialized = true;
    return this.contacts;
  }

  // Sync FROM Netlify Blobs
  async syncFromNetlify() {
    try {
      console.log('🌐 Syncing contacts from Netlify Blobs...');
      
      const response = await fetch('/.netlify/functions/contacts', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Netlify: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const contacts = result.data || [];

        // Save to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(contacts));
        this.contacts = contacts;
        
        console.log(`✅ Synced ${contacts.length} contacts from Netlify Blobs`);
        
        return contacts;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error syncing contacts from Netlify:', error);
      console.log('Using localStorage data as fallback');
      return this.contacts;
    }
  }

  // Sync TO Netlify Blobs (save all contacts)
  async syncToNetlify() {
    try {
      console.log('💾 Syncing contacts to Netlify Blobs...');
      
      const response = await fetch('/.netlify/functions/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: this.contacts
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save to Netlify: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Synced ${this.contacts.length} contacts to Netlify Blobs`);
        return result;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error syncing to Netlify:', error);
      throw error;
    }
  }

  // Load contacts from localStorage (internal use)
  loadContactsFromStorage() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Save contacts to localStorage AND Netlify Blobs
  async saveContacts() {
    // Save to localStorage immediately
    localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
    console.log(`💾 Saved ${this.contacts.length} contacts to localStorage`);
    
    // Sync to Netlify Blobs
    try {
      await this.syncToNetlify();
    } catch (error) {
      console.warn('⚠️ Failed to sync to Netlify (will retry later):', error.message);
      // Don't throw - localStorage save succeeded, Netlify sync can be retried
    }
  }

  // Get all contacts - 🔧 FIX: Ensure data is loaded
  getAllContacts() {
    // If somehow not initialized, reload from localStorage
    if (!this.isInitialized || this.contacts.length === 0) {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.contacts = JSON.parse(stored);
      }
    }
    return this.contacts;
  }

  // Get contacts by category
  getContactsByCategory(category) {
    return this.getAllContacts()
      .filter(c => c.category === category && c.active !== false)
      .sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
  }

  // Get all unique categories
  getCategories() {
    const contacts = this.getAllContacts();
    const categories = [...new Set(contacts
      .filter(c => c.active !== false)
      .map(c => c.category))];
    
    return categories.map(cat => {
      const defaultCat = this.defaultCategories.find(dc => dc.name === cat);
      return defaultCat || { name: cat, color: 'green', emoji: '👤' };
    });
  }

  // Get single contact by ID
  getContact(contactId) {
    return this.getAllContacts().find(c => c.id === contactId);
  }

  // Add new contact
  async addContact(contactData) {
    try {
      // Generate unique ID
      const contactId = 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Get category info
      const categoryInfo = this.defaultCategories.find(dc => dc.name === contactData.category) || 
                          { color: 'green', emoji: '👤' };
      
      // Create contact object
      const contact = {
        id: contactId,
        name: contactData.name,
        role: contactData.role,
        category: contactData.category,
        categoryColor: categoryInfo.color,
        categoryEmoji: categoryInfo.emoji,
        email: contactData.email || '',
        phone: contactData.phone || '',
        photo: contactData.photo || '',
        bio: contactData.bio || '',
        displayOrder: contactData.displayOrder || 999,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to array
      this.contacts.push(contact);

      // Save to localStorage AND Netlify Blobs
      await this.saveContacts();

      console.log('✅ Contact added:', contactId);
      return { success: true, contactId: contactId, contact: contact };

    } catch (error) {
      console.error('❌ Error adding contact:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(contactId, contactData) {
    try {
      const index = this.contacts.findIndex(c => c.id === contactId);
      
      if (index === -1) {
        throw new Error('Contact not found: ' + contactId);
      }

      // Get category info
      const categoryInfo = this.defaultCategories.find(dc => dc.name === contactData.category) || 
                          { color: 'green', emoji: '👤' };

      // Update contact - preserve existing fields not in update
      this.contacts[index] = {
        ...this.contacts[index],
        name: contactData.name,
        role: contactData.role,
        category: contactData.category,
        categoryColor: categoryInfo.color,
        categoryEmoji: categoryInfo.emoji,
        email: contactData.email || '',
        phone: contactData.phone || '',
        photo: contactData.photo || this.contacts[index].photo,
        bio: contactData.bio || '',
        displayOrder: contactData.displayOrder !== undefined ? contactData.displayOrder : this.contacts[index].displayOrder,
        active: contactData.active !== undefined ? contactData.active : this.contacts[index].active,
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage AND Netlify Blobs
      await this.saveContacts();

      console.log('✅ Contact updated:', contactId);
      return { success: true, contact: this.contacts[index] };

    } catch (error) {
      console.error('❌ Error updating contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(contactId) {
    try {
      const index = this.contacts.findIndex(c => c.id === contactId);

      if (index === -1) {
        throw new Error('Contact not found: ' + contactId);
      }

      const deletedContact = this.contacts[index];

      // 1. CLOUD-FIRST: Build array without the deleted contact and sync to cloud
      const contactsWithoutDeleted = this.contacts.filter(c => c.id !== contactId);

      const response = await fetch('/.netlify/functions/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: contactsWithoutDeleted })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Cloud deletion failed');
      }

      // 2. Only update local data AFTER cloud succeeds
      this.contacts = contactsWithoutDeleted;
      localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));

      console.log('Contact deleted:', contactId);
      return { success: true, deletedContact };

    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Export contacts to JSON
  exportToJSON() {
    const exportData = {
      contacts: this.contacts.filter(c => c.active !== false),
      exportDate: new Date().toISOString(),
      totalContacts: this.contacts.filter(c => c.active !== false).length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olrfc_contacts_${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Export contacts to CSV
  exportToCSV() {
    const contacts = this.contacts.filter(c => c.active !== false);

    // CSV headers
    const headers = ['Name', 'Role', 'Category', 'Email', 'Phone', 'Display Order'];
    
    // CSV rows
    const rows = contacts.map(c => [
      c.name,
      c.role,
      c.category,
      c.email,
      c.phone,
      c.displayOrder
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olrfc_contacts_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Get stats
  getStats() {
    const active = this.getAllContacts().filter(c => c.active !== false);
    const categories = this.getCategories();

    return {
      totalContacts: active.length,
      totalCategories: categories.length,
      contactsWithPhotos: active.filter(c => c.photo).length,
      contactsWithEmail: active.filter(c => c.email).length,
      contactsWithPhone: active.filter(c => c.phone).length,
      byCategory: categories.map(cat => ({
        category: cat.name,
        count: active.filter(c => c.category === cat.name).length
      }))
    };
  }

  // Reorder contacts within a category
  async reorderContacts(categoryName, orderedContactIds) {
    orderedContactIds.forEach((contactId, index) => {
      const contact = this.contacts.find(c => c.id === contactId);
      if (contact) {
        contact.displayOrder = index + 1;
        contact.updatedAt = new Date().toISOString();
      }
    });

    await this.saveContacts();
  }
}

// Initialize global instance
const contactsManager = new ContactsManager();

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format UK mobile: 07XXX XXXXXX
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    return cleaned.replace(/(\d{5})(\d{6})/, '$1 $2');
  }
  
  // Format UK landline
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    return cleaned;
  }
  
  return phone;
}

// Helper function to validate email
function isValidEmail(email) {
  if (!email) return true; // Empty is valid (optional field)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}