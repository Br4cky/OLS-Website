// OLS 103: Permission Wrapper for Admin CRUD Operations
// Wraps all create/edit/delete functions with permission checks

(function() {
    'use strict';

    console.log('🔒 Loading Permission Wrappers...');

    // Wait for adminPermissions to be available
    function waitForPermissions(callback) {
        if (window.adminPermissions) {
            callback();
        } else {
            setTimeout(() => waitForPermissions(callback), 100);
        }
    }

    waitForPermissions(() => {
        console.log('✅ Wrapping CRUD operations with permission checks');

        // ============================================================
        // WRAP showSection() - Verify section access
        // ============================================================
        const originalShowSection = window.showSection;
        if (originalShowSection) {
            window.showSection = function(sectionId) {
                console.log(`🔍 Checking access to section: ${sectionId}`);
                
                // Allow dashboard always
                if (sectionId === 'dashboard') {
                    return originalShowSection.call(this, sectionId);
                }
                
                // Check permission
                if (!window.adminPermissions.verifySectionAccess(sectionId)) {
                    console.log(`❌ Access denied to section: ${sectionId}`);
                    return;
                }
                
                return originalShowSection.call(this, sectionId);
            };
        }

        // ============================================================
        // NEWS OPERATIONS
        // ============================================================
        
        // Wrap saveNews() for CREATE
        const originalSaveNews = window.saveNews;
        if (originalSaveNews) {
            window.saveNews = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'news articles')) {
                    return;
                }
                return originalSaveNews.call(this);
            };
        }

        // Wrap editNews() for EDIT
        const originalEditNews = window.editNews;
        if (originalEditNews) {
            window.editNews = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'news articles')) {
                    return;
                }
                return originalEditNews.call(this, index);
            };
        }

        // Wrap deleteNews() for DELETE
        const originalDeleteNews = window.deleteNews;
        if (originalDeleteNews) {
            window.deleteNews = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'news articles')) {
                    return;
                }
                return originalDeleteNews.call(this, index);
            };
        }

        // ============================================================
        // FIXTURE OPERATIONS
        // ============================================================
        
        const originalSaveFixture = window.saveFixture;
        if (originalSaveFixture) {
            window.saveFixture = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'fixtures')) {
                    return;
                }
                return originalSaveFixture.call(this);
            };
        }

        const originalEditFixture = window.editFixture;
        if (originalEditFixture) {
            window.editFixture = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'fixtures')) {
                    return;
                }
                return originalEditFixture.call(this, index);
            };
        }

        const originalDeleteFixture = window.deleteFixture;
        if (originalDeleteFixture) {
            window.deleteFixture = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'fixtures')) {
                    return;
                }
                return originalDeleteFixture.call(this, index);
            };
        }

        // ============================================================
        // GALLERY OPERATIONS
        // ============================================================
        
        const originalSaveGallery = window.saveGallery;
        if (originalSaveGallery) {
            window.saveGallery = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'gallery photos')) {
                    return;
                }
                return originalSaveGallery.call(this);
            };
        }

        const originalDeleteGallery = window.deleteGallery;
        if (originalDeleteGallery) {
            window.deleteGallery = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'gallery photos')) {
                    return;
                }
                return originalDeleteGallery.call(this, index);
            };
        }

        // ============================================================
        // PLAYER OPERATIONS
        // ============================================================
        
        const originalSavePlayer = window.savePlayer;
        if (originalSavePlayer) {
            window.savePlayer = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'players')) {
                    return;
                }
                return originalSavePlayer.call(this);
            };
        }

        const originalEditPlayer = window.editPlayer;
        if (originalEditPlayer) {
            window.editPlayer = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'players')) {
                    return;
                }
                return originalEditPlayer.call(this, index);
            };
        }

        const originalDeletePlayer = window.deletePlayer;
        if (originalDeletePlayer) {
            window.deletePlayer = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'players')) {
                    return;
                }
                return originalDeletePlayer.call(this, index);
            };
        }

        // ============================================================
        // TEAM OPERATIONS
        // ============================================================
        
        const originalSaveTeam = window.saveTeam;
        if (originalSaveTeam) {
            window.saveTeam = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'teams')) {
                    return;
                }
                return originalSaveTeam.call(this);
            };
        }

        const originalEditTeam = window.editTeam;
        if (originalEditTeam) {
            window.editTeam = function(teamId) {
                if (!window.adminPermissions.verifyPermission('edit', 'teams')) {
                    return;
                }
                return originalEditTeam.call(this, teamId);
            };
        }

        const originalDeleteTeam = window.deleteTeam;
        if (originalDeleteTeam) {
            window.deleteTeam = async function(teamId, teamName) {
                if (!window.adminPermissions.verifyPermission('delete', 'teams')) {
                    return;
                }
                return originalDeleteTeam.call(this, teamId, teamName);
            };
        }

        // ============================================================
        // SHOP OPERATIONS
        // ============================================================
        
        const originalSaveShopItem = window.saveShopItem;
        if (originalSaveShopItem) {
            window.saveShopItem = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'shop products')) {
                    return;
                }
                return originalSaveShopItem.call(this);
            };
        }

        const originalEditShopItem = window.editShopItem;
        if (originalEditShopItem) {
            window.editShopItem = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'shop products')) {
                    return;
                }
                return originalEditShopItem.call(this, index);
            };
        }

        const originalDeleteShopItem = window.deleteShopItem;
        if (originalDeleteShopItem) {
            window.deleteShopItem = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'shop products')) {
                    return;
                }
                return originalDeleteShopItem.call(this, index);
            };
        }

        // ============================================================
        // SPONSOR OPERATIONS
        // ============================================================
        
        const originalSaveSponsor = window.saveSponsor;
        if (originalSaveSponsor) {
            window.saveSponsor = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'sponsors')) {
                    return;
                }
                return originalSaveSponsor.call(this);
            };
        }

        const originalEditSponsor = window.editSponsor;
        if (originalEditSponsor) {
            window.editSponsor = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'sponsors')) {
                    return;
                }
                return originalEditSponsor.call(this, index);
            };
        }

        const originalDeleteSponsor = window.deleteSponsor;
        if (originalDeleteSponsor) {
            window.deleteSponsor = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'sponsors')) {
                    return;
                }
                return originalDeleteSponsor.call(this, index);
            };
        }

        // ============================================================
        // CONTACT OPERATIONS
        // ============================================================
        
        const originalSaveContact = window.saveContact;
        if (originalSaveContact) {
            window.saveContact = async function() {
                if (!window.adminPermissions.verifyPermission('create', 'contacts')) {
                    return;
                }
                return originalSaveContact.call(this);
            };
        }

        const originalEditContact = window.editContact;
        if (originalEditContact) {
            window.editContact = function(index) {
                if (!window.adminPermissions.verifyPermission('edit', 'contacts')) {
                    return;
                }
                return originalEditContact.call(this, index);
            };
        }

        const originalDeleteContact = window.deleteContact;
        if (originalDeleteContact) {
            window.deleteContact = async function(index) {
                if (!window.adminPermissions.verifyPermission('delete', 'contacts')) {
                    return;
                }
                return originalDeleteContact.call(this, index);
            };
        }

        // ============================================================
        // ADMIN USER OPERATIONS (Super-Admin Only)
        // ============================================================
        
        const originalSaveAdminUser = window.saveAdminUser;
        if (originalSaveAdminUser) {
            window.saveAdminUser = async function() {
                if (!window.adminPermissions.verifyPermission('manageUsers', 'admin users')) {
                    return;
                }
                return originalSaveAdminUser.call(this);
            };
        }

        const originalEditAdminUser = window.editAdminUser;
        if (originalEditAdminUser) {
            window.editAdminUser = function(userId) {
                if (!window.adminPermissions.verifyPermission('manageUsers', 'admin users')) {
                    return;
                }
                return originalEditAdminUser.call(this, userId);
            };
        }

        const originalDeleteAdminUserConfirm = window.deleteAdminUserConfirm;
        if (originalDeleteAdminUserConfirm) {
            window.deleteAdminUserConfirm = async function(userId, username) {
                if (!window.adminPermissions.verifyPermission('manageUsers', 'admin users')) {
                    return;
                }
                return originalDeleteAdminUserConfirm.call(this, userId, username);
            };
        }

        const originalOpenResetPasswordModal = window.openResetPasswordModal;
        if (originalOpenResetPasswordModal) {
            window.openResetPasswordModal = function(userId, username, email) {
                if (!window.adminPermissions.verifyPermission('manageUsers', 'user passwords')) {
                    return;
                }
                return originalOpenResetPasswordModal.call(this, userId, username, email);
            };
        }

        // ============================================================
        // SITE SETTINGS OPERATIONS
        // ============================================================
        
        const originalSaveSiteSettings = window.saveSiteSettings;
        if (originalSaveSiteSettings) {
            window.saveSiteSettings = async function() {
                if (!window.adminPermissions.verifyPermission('manageSiteSettings', 'site settings')) {
                    return;
                }
                return originalSaveSiteSettings.call(this);
            };
        }

        const originalUpdateSiteSetting = window.updateSiteSetting;
        if (originalUpdateSiteSetting) {
            window.updateSiteSetting = async function(key, value) {
                if (!window.adminPermissions.verifyPermission('manageSiteSettings', 'site settings')) {
                    return;
                }
                return originalUpdateSiteSetting.call(this, key, value);
            };
        }

        console.log('✅ All CRUD operations wrapped with permission checks');
    });

})();