const fs = require('fs');
const path = require('path');

function normalizeKey(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[-_\s]/g, '');
}

function toSingular(str) {
  if (!str) return '';
  const s = String(str).trim();
  if (s.toLowerCase().endsWith('ies')) {
    return s.slice(0, -3) + 'y';
  }
  if (s.toLowerCase().endsWith('es') && (s.toLowerCase().endsWith('shes') || s.toLowerCase().endsWith('ches') || s.toLowerCase().endsWith('sses'))) {
    return s.slice(0, -2);
  }
  if (s.toLowerCase().endsWith('s') && !s.toLowerCase().endsWith('ss')) {
    return s.slice(0, -1);
  }
  return s;
}

function toPlural(str) {
  if (!str) return '';
  const s = String(str).trim();
  if (s.toLowerCase().endsWith('y') && !/[aeiou]y$/i.test(s)) {
    return s.slice(0, -1) + 'ies';
  }
  if (s.toLowerCase().endsWith('s') || s.toLowerCase().endsWith('sh') || s.toLowerCase().endsWith('ch') || s.toLowerCase().endsWith('x')) {
    return s + 'es';
  }
  return s + 's';
}

function capitalizeWords(str) {
  if (!str) return '';
  const withSpaces = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  return withSpaces
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Standard Modular API Response Formatter
 * Dynamically resolves unique, module-specific response messages
 * from each module's messages.js definition.
 */
class ApiResponse {
  static moduleRegistry = {};
  static messages = {};
  static _initialized = false;

  static initModuleRegistry() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const modulesDir = path.resolve(__dirname, '../modules');
      if (fs.existsSync(modulesDir)) {
        const dirs = fs.readdirSync(modulesDir, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory()) {
            const messagesPath = path.join(modulesDir, dir.name, 'messages.js');
            if (fs.existsSync(messagesPath)) {
              try {
                const modMessages = require(messagesPath);
                this.registerModule(dir.name, modMessages);
              } catch (e) {
                // Silently skip if file fails to load
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  static registerModule(moduleName, messages) {
    if (!moduleName || !messages) return;
    this.initModuleRegistry();

    const raw = String(moduleName).trim();
    const lower = raw.toLowerCase();
    const normalized = normalizeKey(raw);
    const singularNorm = normalizeKey(toSingular(raw));
    const pluralNorm = normalizeKey(toPlural(toSingular(raw)));

    this.moduleRegistry[normalized] = messages;
    this.moduleRegistry[lower] = messages;
    this.moduleRegistry[raw] = messages;
    this.moduleRegistry[singularNorm] = messages;
    this.moduleRegistry[pluralNorm] = messages;

    if (messages.name) {
      this.moduleRegistry[normalizeKey(messages.name)] = messages;
      this.moduleRegistry[messages.name.toLowerCase()] = messages;
    }
    if (messages.module) {
      this.moduleRegistry[normalizeKey(messages.module)] = messages;
      this.moduleRegistry[messages.module.toLowerCase()] = messages;
    }

    this.messages[raw] = messages;
    this.messages[normalized] = messages;
  }

  static getModuleMessages(moduleName) {
    this.initModuleRegistry();
    if (!moduleName) return null;
    const normalized = normalizeKey(moduleName);
    return this.moduleRegistry[normalized] || this.moduleRegistry[String(moduleName).toLowerCase()] || null;
  }

  static resolveModule(res) {
    if (res && res._moduleName) {
      return res._moduleName;
    }

    const req = (res && res.req) ? res.req : (res && res.baseUrl ? res : null);
    if (req) {
      if (req._module) return req._module;

      const url = req.baseUrl || req.originalUrl || req.url || '';
      const match = url.match(/\/api(?:\/v\d+)?\/([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        const seg = match[1].toLowerCase();
        const aliasMap = {
          'organisations': 'organizations',
          'organisation': 'organizations',
          'payment-modes': 'paymentmodes',
          'payment_modes': 'paymentmodes',
          'follow-ups': 'followups',
          'follow_ups': 'followups',
          'promises-to-pay': 'ptp',
          'promises_to_pay': 'ptp',
          'promisestopay': 'ptp',
          'follow-up-tasks': 'ptp',
          'follow_up_tasks': 'ptp',
          'followuptasks': 'ptp'
        };
        return aliasMap[seg] || seg;
      }
    }

    // Call stack trace inspection fallback
    try {
      const stack = new Error().stack;
      if (stack) {
        const match = stack.match(/[\\/]modules[\\/]([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          return match[1].toLowerCase();
        }
      }
    } catch (_) {}

    return 'default';
  }

  static getMessage(moduleName, action = 'created', fallback = null) {
    this.initModuleRegistry();

    const normalized = normalizeKey(moduleName);
    const modMessages = this.moduleRegistry[normalized] || this.moduleRegistry[moduleName];

    if (modMessages && modMessages[action]) {
      return modMessages[action];
    }

    // If action is already a custom multi-word sentence, prefer it
    if (action && typeof action === 'string' && action.includes(' ') && !modMessages?.[action]) {
      return action;
    }

    // Dynamically derive based on moduleName if available
    if (moduleName && moduleName !== 'default') {
      const singular = toSingular(moduleName);
      const capSingular = capitalizeWords(singular);
      const capPlural = capitalizeWords(toPlural(singular));

      const defaults = {
        created: `${capSingular} created`,
        retrieved: `${capSingular} retrieved`,
        list: `${capPlural} retrieved`,
        updated: `${capSingular} updated`,
        statusUpdated: `${capSingular} status updated`,
        deleted: `${capSingular} deleted`,
        success: `${capSingular} retrieved`
      };

      if (defaults[action]) {
        return defaults[action];
      }
    }

    return fallback || (action && typeof action === 'string' ? action : 'Operation completed successfully');
  }

  static getMessageForRequest(res, action, fallback = null, explicitMessage = null) {
    if (explicitMessage && typeof explicitMessage === 'string') {
      const genericLegacyMessages = [
        'Resource created successfully',
        'Operation completed successfully',
        'Records retrieved successfully',
        'Record updated successfully',
        'Record deleted successfully',
        'Resource created',
        'Operation completed',
        'Records retrieved'
      ];
      if (!genericLegacyMessages.includes(explicitMessage)) {
        const mod = this.resolveModule(res);
        const modMsg = this.getModuleMessages(mod);
        if (modMsg && modMsg[explicitMessage]) {
          return modMsg[explicitMessage];
        }
        return explicitMessage;
      }
    }

    const moduleName = this.resolveModule(res);
    return this.getMessage(moduleName, action, fallback);
  }

  static success(res, messageOrData = 'Operation completed successfully', dataOrStatusCode = {}, statusCode = 200) {
    let message;
    let data;
    let status;

    if (typeof messageOrData !== 'string') {
      data = messageOrData !== undefined ? messageOrData : {};
      status = typeof dataOrStatusCode === 'number' ? dataOrStatusCode : 200;
      message = this.getMessageForRequest(res, 'retrieved', 'Operation completed successfully');
    } else {
      status = typeof statusCode === 'number' ? statusCode : 200;
      data = dataOrStatusCode !== undefined ? dataOrStatusCode : {};
      message = this.getMessageForRequest(res, 'retrieved', 'Operation completed successfully', messageOrData);
    }

    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  static created(res, messageOrData = 'Resource created successfully', data = {}) {
    let message;
    let responseData;

    if (typeof messageOrData !== 'string') {
      responseData = messageOrData !== undefined ? messageOrData : {};
      message = this.getMessageForRequest(res, 'created', 'Resource created');
    } else {
      responseData = data !== undefined ? data : {};
      message = this.getMessageForRequest(res, 'created', 'Resource created', messageOrData);
    }

    return res.status(201).json({
      success: true,
      message,
      data: responseData
    });
  }

  static updated(res, messageOrData = 'Record updated successfully', data = {}) {
    let message;
    let responseData;

    if (typeof messageOrData !== 'string') {
      responseData = messageOrData !== undefined ? messageOrData : {};
      message = this.getMessageForRequest(res, 'updated', 'Record updated');
    } else {
      responseData = data !== undefined ? data : {};
      message = this.getMessageForRequest(res, 'updated', 'Record updated', messageOrData);
    }

    return res.status(200).json({
      success: true,
      message,
      data: responseData
    });
  }

  static deleted(res, messageOrData = 'Record deleted successfully', data = null) {
    let message;
    let responseData;

    if (typeof messageOrData !== 'string') {
      responseData = messageOrData !== undefined ? messageOrData : null;
      message = this.getMessageForRequest(res, 'deleted', 'Record deleted');
    } else {
      responseData = data !== undefined ? data : null;
      message = this.getMessageForRequest(res, 'deleted', 'Record deleted', messageOrData);
    }

    const payload = {
      success: true,
      message
    };
    if (responseData !== null && responseData !== undefined) {
      payload.data = responseData;
    }

    return res.status(200).json(payload);
  }

  static paginated(res, messageOrData = 'Records retrieved successfully', dataOrPagination = [], paginationOrStatusCode = {}, statusCode = 200) {
    let message;
    let data;
    let pagination;
    let status;

    if (Array.isArray(messageOrData)) {
      data = messageOrData;
      pagination = dataOrPagination || {};
      status = typeof paginationOrStatusCode === 'number' ? paginationOrStatusCode : 200;
      message = this.getMessageForRequest(res, 'list', 'Records retrieved successfully');
    } else {
      message = this.getMessageForRequest(res, 'list', 'Records retrieved successfully', messageOrData);
      data = Array.isArray(dataOrPagination) ? dataOrPagination : [];
      pagination = paginationOrStatusCode || {};
      status = typeof statusCode === 'number' ? statusCode : 200;
    }

    const { page = 1, limit = 10, totalRecords = 0 } = pagination;
    const totalPages = Math.ceil(totalRecords / limit) || 0;

    return res.status(status).json({
      success: true,
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: Number(totalRecords),
        totalPages
      }
    });
  }

  static error(res, message = 'An error occurred', code = 'INTERNAL_ERROR', details = [], statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code,
        details: Array.isArray(details) ? details : [details]
      }
    });
  }

  static forModule(moduleName) {
    const self = this;
    self.initModuleRegistry();

    return {
      _moduleName: moduleName,
      created(res, messageOrData, data) {
        if (res) res._moduleName = moduleName;
        return self.created(res, messageOrData, data);
      },
      success(res, messageOrData, dataOrStatusCode, statusCode) {
        if (res) res._moduleName = moduleName;
        return self.success(res, messageOrData, dataOrStatusCode, statusCode);
      },
      updated(res, messageOrData, data) {
        if (res) res._moduleName = moduleName;
        return self.updated(res, messageOrData, data);
      },
      deleted(res, messageOrData, data) {
        if (res) res._moduleName = moduleName;
        return self.deleted(res, messageOrData, data);
      },
      paginated(res, messageOrData, dataOrPagination, paginationOrStatusCode, statusCode) {
        if (res) res._moduleName = moduleName;
        return self.paginated(res, messageOrData, dataOrPagination, paginationOrStatusCode, statusCode);
      },
      error(res, message, code, details, statusCode) {
        if (res) res._moduleName = moduleName;
        return self.error(res, message, code, details, statusCode);
      },
      getMessage(action, fallback) {
        return self.getMessage(moduleName, action, fallback);
      }
    };
  }
}

// Pre-initialize registry on require
ApiResponse.initModuleRegistry();

module.exports = ApiResponse;
