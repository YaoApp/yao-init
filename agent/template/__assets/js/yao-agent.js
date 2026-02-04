/**
 * Yao Agent Global API
 * Provides theme, locale, and user management for Agent SUI pages
 *
 * @typedef {'light' | 'dark'} Theme
 * @typedef {'zh-CN' | 'en-US'} Locale
 * @typedef {{id?: string|number, user_id?: string|number, name?: string, username?: string, email?: string, avatar?: string, avatar_url?: string}} User
 * @typedef {{theme: Theme}} ThemeChangeEvent
 * @typedef {{locale: Locale}} LocaleChangeEvent
 */

(function (global) {
  "use strict";

  // Storage keys (compatible with CUI/xgen)
  var STORAGE_KEYS = {
    THEME: "xgen:xgen_theme",
    LOCALE: "umi_locale",
    USER: "xgen:xgen_user",
  };

  // Event names
  var EVENTS = {
    THEME_CHANGE: "yao:theme:change",
    LOCALE_CHANGE: "yao:locale:change",
    USER_CHANGE: "yao:user:change",
  };

  /**
   * YaoAgent - Global API for Agent SUI
   */
  var YaoAgent = {
    // ==================== Theme API ====================

    /**
     * Get current theme
     * @returns {Theme} Current theme
     */
    getTheme: function () {
      try {
        var stored = localStorage.getItem(STORAGE_KEYS.THEME);
        if (stored) {
          var data = JSON.parse(stored);
          return data.value || "light";
        }
      } catch (e) {
        console.warn("[YaoAgent] Error reading theme:", e);
      }
      return "light";
    },

    /**
     * Set theme
     * @param {Theme} theme - Theme to set
     */
    setTheme: function (theme) {
      if (theme !== "light" && theme !== "dark") {
        console.error('[YaoAgent] Invalid theme. Use "light" or "dark".');
        return;
      }

      document.documentElement.setAttribute("data-theme", theme);

      try {
        localStorage.setItem(
          STORAGE_KEYS.THEME,
          JSON.stringify({ type: "String", value: theme })
        );
      } catch (e) {
        console.warn("[YaoAgent] Error saving theme:", e);
      }

      // Dispatch event
      this._dispatchEvent(EVENTS.THEME_CHANGE, { theme: theme });

      // Notify CUI parent if embedded
      this._notifyParent("theme:change", { theme: theme });
    },

    /**
     * Toggle theme between light and dark
     * @returns {Theme} New theme
     */
    toggleTheme: function () {
      var newTheme = this.getTheme() === "light" ? "dark" : "light";
      this.setTheme(newTheme);
      return newTheme;
    },

    /**
     * Check if current theme is dark
     * @returns {boolean}
     */
    isDarkTheme: function () {
      return this.getTheme() === "dark";
    },

    // ==================== Locale API ====================

    /**
     * Get current locale
     * @returns {Locale} Current locale
     */
    getLocale: function () {
      // Try cookie first (for SUI server-side consistency)
      var cookieLocale = this._getCookie("locale");
      if (cookieLocale) {
        return this._normalizeLocale(cookieLocale);
      }

      // Try localStorage
      try {
        var stored = localStorage.getItem(STORAGE_KEYS.LOCALE);
        if (stored) {
          return this._normalizeLocale(stored);
        }
      } catch (e) {
        console.warn("[YaoAgent] Error reading locale:", e);
      }

      // Detect from browser
      var browserLang = navigator.language || navigator.userLanguage;
      return this._normalizeLocale(browserLang);
    },

    /**
     * Get cookie value
     * @private
     */
    _getCookie: function (name) {
      var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    },

    /**
     * Set locale
     * @param {string} locale - Locale to set
     * @param {boolean} [reload=false] - Whether to reload page for server-side translation
     */
    setLocale: function (locale, reload) {
      var normalized = this._normalizeLocale(locale);
      var currentLocale = this.getLocale();

      // Skip if same locale
      if (normalized === currentLocale) {
        return;
      }

      try {
        localStorage.setItem(STORAGE_KEYS.LOCALE, normalized);
      } catch (e) {
        console.warn("[YaoAgent] Error saving locale:", e);
      }

      // Set cookie for server-side rendering (SUI reads from cookie)
      document.cookie = "locale=" + normalized + ";path=/;max-age=31536000";

      // Update html lang attribute
      document.documentElement.setAttribute("lang", normalized);

      // Dispatch event
      this._dispatchEvent(EVENTS.LOCALE_CHANGE, { locale: normalized });

      // Notify CUI parent if embedded
      this._notifyParent("locale:change", { locale: normalized });

      // Reload page to apply server-side translations (s:trans)
      if (reload) {
        location.reload();
      }
    },

    /**
     * Toggle locale between zh-CN and en-US
     * @param {boolean} [reload=false] - Whether to reload page for server-side translation
     * @returns {Locale} New locale
     */
    toggleLocale: function (reload) {
      var newLocale = this.getLocale() === "zh-CN" ? "en-US" : "zh-CN";
      this.setLocale(newLocale, reload);
      return newLocale;
    },

    /**
     * Check if current locale is Chinese
     * @returns {boolean}
     */
    isChineseLocale: function () {
      return this.getLocale().toLowerCase().startsWith("zh");
    },

    /**
     * Normalize locale string
     * @private
     * @param {string|null} locale
     * @returns {Locale}
     */
    _normalizeLocale: function (locale) {
      if (!locale) return "en-US";
      var lower = locale.toLowerCase();
      if (lower.startsWith("zh")) return "zh-CN";
      return "en-US";
    },

    // ==================== User API ====================

    /**
     * Get cached user info from localStorage
     * Note: This may be stale. Use checkAuth() for reliable auth status.
     * @returns {User|null} User object or null if not logged in
     */
    getUser: function () {
      try {
        var stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (stored) {
          var data = JSON.parse(stored);
          return data.value || null;
        }
      } catch (e) {
        console.warn("[YaoAgent] Error reading user:", e);
      }
      return null;
    },

    /**
     * Check if user is logged in (based on cached localStorage)
     * Note: This is NOT reliable for HttpOnly cookie auth. Use checkAuth() instead.
     * @returns {boolean}
     * @deprecated Use checkAuth() for reliable auth checking
     */
    isLoggedIn: function () {
      return this.getUser() !== null;
    },

    /**
     * Check authentication status by calling the API
     * This is the reliable way to check auth with HttpOnly cookies
     * Uses OpenAPI client from libsui if available, fallback to fetch
     * @returns {Promise<{authenticated: boolean, user: User|null}>}
     */
    checkAuth: function () {
      var self = this;

      // Use OpenAPI client if available (from libsui.min.js)
      if (typeof OpenAPI !== "undefined") {
        var api = new OpenAPI({ baseURL: "/v1" });
        return api.Get("/user/profile").then(function (response) {
          if (!api.IsError(response) && response.data) {
            self._setUserCache(response.data);
            return { authenticated: true, user: response.data };
          }
          self._clearUserCache();
          return { authenticated: false, user: null };
        });
      }

      // Fallback to fetch
      return fetch("/v1/user/profile", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            return response.json().then(function (user) {
              self._setUserCache(user);
              return { authenticated: true, user: user };
            });
          }
          self._clearUserCache();
          return { authenticated: false, user: null };
        })
        .catch(function (error) {
          console.warn("[YaoAgent] Auth check failed:", error);
          return { authenticated: false, user: null };
        });
    },

    /**
     * Require authentication - redirect to 401 page if not logged in
     * @param {string} [redirectUrl='/agents/401'] - URL to redirect to if not authenticated
     * @returns {Promise<User|null>} - Returns user if authenticated, null if redirected
     */
    requireAuth: function (redirectUrl) {
      var url = redirectUrl || "/agents/401";
      return this.checkAuth().then(function (result) {
        if (!result.authenticated) {
          window.location.href = url;
          return null;
        }
        return result.user;
      });
    },

    /**
     * Update user cache in localStorage
     * @private
     */
    _setUserCache: function (user) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify({ type: "Object", value: user })
        );
        this._dispatchEvent(EVENTS.USER_CHANGE, user);
      } catch (e) {
        console.warn("[YaoAgent] Error saving user:", e);
      }
    },

    /**
     * Clear user cache from localStorage
     * @private
     */
    _clearUserCache: function () {
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        this._dispatchEvent(EVENTS.USER_CHANGE, null);
      } catch (e) {
        console.warn("[YaoAgent] Error clearing user:", e);
      }
    },

    /**
     * Get user ID
     * @returns {string|number|null}
     */
    getUserId: function () {
      var user = this.getUser();
      return user ? user.id || user.user_id || null : null;
    },

    /**
     * Get user name
     * @returns {string|null}
     */
    getUserName: function () {
      var user = this.getUser();
      return user ? user.name || user.username || user.email || null : null;
    },

    /**
     * Get user avatar URL
     * @returns {string|null}
     */
    getUserAvatar: function () {
      var user = this.getUser();
      return user ? user.avatar || user.avatar_url || null : null;
    },

    // ==================== Event Listeners ====================

    /**
     * Add theme change listener
     * @param {function(ThemeChangeEvent): void} callback
     * @returns {function(): void} Unsubscribe function
     */
    onThemeChange: function (callback) {
      return this._addEventListener(EVENTS.THEME_CHANGE, callback);
    },

    /**
     * Add locale change listener
     * @param {function(LocaleChangeEvent): void} callback
     * @returns {function(): void} Unsubscribe function
     */
    onLocaleChange: function (callback) {
      return this._addEventListener(EVENTS.LOCALE_CHANGE, callback);
    },

    /**
     * Add user change listener
     * @param {function(User|null): void} callback
     * @returns {function(): void} Unsubscribe function
     */
    onUserChange: function (callback) {
      return this._addEventListener(EVENTS.USER_CHANGE, callback);
    },

    // ==================== CUI Integration ====================

    /**
     * Check if running inside CUI iframe
     * @returns {boolean}
     */
    isEmbeddedInCUI: function () {
      try {
        return window.parent !== window && !!window.parent.postMessage;
      } catch (e) {
        return false;
      }
    },

    /**
     * Send action to CUI parent
     * @param {string} action - Action name
     * @param {Object} [payload] - Action payload
     */
    sendAction: function (action, payload) {
      if (!this.isEmbeddedInCUI()) {
        console.warn("[YaoAgent] Not embedded in CUI, action ignored:", action);
        return;
      }

      window.parent.postMessage(
        {
          type: "action",
          message: { name: action, payload: payload },
        },
        window.location.origin
      );
    },

    /**
     * Show success notification
     * @param {string} message
     */
    notifySuccess: function (message) {
      this.sendAction("notify.success", { message: message });
    },

    /**
     * Show error notification
     * @param {string} message
     */
    notifyError: function (message) {
      this.sendAction("notify.error", { message: message });
    },

    /**
     * Show warning notification
     * @param {string} message
     */
    notifyWarning: function (message) {
      this.sendAction("notify.warning", { message: message });
    },

    /**
     * Show info notification
     * @param {string} message
     */
    notifyInfo: function (message) {
      this.sendAction("notify.info", { message: message });
    },

    /**
     * Navigate to route
     * @param {string} route - Target route
     * @param {string} [title] - Optional title
     */
    navigate: function (route, title) {
      this.sendAction("navigate", { route: route, title: title });
    },

    /**
     * Navigate back
     */
    navigateBack: function () {
      this.sendAction("navigate.back");
    },

    // ==================== Internal Methods ====================

    /**
     * @private
     */
    _dispatchEvent: function (eventName, detail) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
    },

    /**
     * @private
     */
    _addEventListener: function (eventName, callback) {
      var handler = function (e) {
        callback(e.detail);
      };
      window.addEventListener(eventName, handler);
      return function () {
        window.removeEventListener(eventName, handler);
      };
    },

    /**
     * @private
     */
    _notifyParent: function (action, payload) {
      if (this.isEmbeddedInCUI()) {
        this.sendAction(action, payload);
      }
    },

    /**
     * Initialize - called automatically
     * @private
     */
    _init: function () {
      var self = this;

      // When embedded in CUI, wait for setup message instead of overriding
      // Server-side rendered locale should be used initially
      if (this.isEmbeddedInCUI()) {
        // Listen for CUI setup messages
        window.addEventListener("message", function (e) {
          if (e.origin !== window.location.origin) return;

          if (e.data && e.data.type === "setup") {
            var msg = e.data.message || {};
            if (msg.theme) self.setTheme(msg.theme);
            if (msg.locale) self.setLocale(msg.locale);
            if (msg.user) {
              try {
                localStorage.setItem(
                  STORAGE_KEYS.USER,
                  JSON.stringify({ type: "Object", value: msg.user })
                );
                self._dispatchEvent(EVENTS.USER_CHANGE, msg.user);
              } catch (e) {
                console.warn("[YaoAgent] Error saving user from CUI:", e);
              }
            }
          }
        });
      } else {
        // Standalone mode: apply theme and locale from storage/browser
        var theme = this.getTheme();
        document.documentElement.setAttribute("data-theme", theme);

        var locale = this.getLocale();
        document.documentElement.setAttribute("lang", locale);
      }

      // Storage event listener for cross-tab sync
      window.addEventListener("storage", function (e) {
        if (e.key === STORAGE_KEYS.THEME) {
          var theme = self.getTheme();
          document.documentElement.setAttribute("data-theme", theme);
          self._dispatchEvent(EVENTS.THEME_CHANGE, { theme: theme });
        } else if (e.key === STORAGE_KEYS.LOCALE) {
          var locale = self.getLocale();
          document.documentElement.setAttribute("lang", locale);
          self._dispatchEvent(EVENTS.LOCALE_CHANGE, { locale: locale });
        } else if (e.key === STORAGE_KEYS.USER) {
          self._dispatchEvent(EVENTS.USER_CHANGE, self.getUser());
        }
      });
    },
  };

  // Auto-initialize
  YaoAgent._init();

  // Export to global
  global.YaoAgent = YaoAgent;

  // Backward compatibility aliases
  global.YaoGlobal = YaoAgent;
})(typeof window !== "undefined" ? window : this);
