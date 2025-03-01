// store/index.js

import StorageService from '../services/storage.service.js';

/**
 * مخزن الحالة المركزي للتطبيق
 * يدير حالة التطبيق بالكامل ويتيح التفاعل معها بطريقة منظمة
 */
export class Store {
  /**
   * إنشاء مخزن الحالة
   * @param {Object} initialState - الحالة الأولية للمخزن
   * @param {boolean} persistState - هل يتم حفظ الحالة في التخزين المحلي
   */
  constructor(initialState = {}, persistState = false) {
    // المستمعون للتغييرات
    this.subscribers = [];
    
    // مفتاح التخزين المحلي
    this.stateKey = 'app_state';
    
    // تفعيل استمرارية التخزين
    this.persistState = persistState;
    
    // تهيئة الحالة
    this.state = this.loadInitialState(initialState);
  }

  /**
   * تحميل الحالة الأولية من التخزين المحلي إذا كانت موجودة
   * @param {Object} defaultState - الحالة الافتراضية
   * @returns {Object} الحالة المحملة
   */
  loadInitialState(defaultState) {
    if (this.persistState) {
      const savedState = StorageService.getItem(this.stateKey);
      return savedState ? { ...defaultState, ...savedState } : defaultState;
    }
    return defaultState;
  }

  /**
   * الحصول على الحالة الكاملة أو جزء محدد منها
   * @param {string} [path] - مسار الحالة المطلوبة (اختياري)
   * @returns {any} الحالة المطلوبة
   */
  getState(path = null) {
    if (!path) {
      return this.state;
    }
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.state);
  }

  /**
   * تعيين حالة جديدة بدمجها مع الحالة الحالية
   * @param {Object} newState - الحالة الجديدة
   * @param {string} [namespace] - مسار القسم المراد تحديثه (اختياري)
   */
  setState(newState, namespace = null) {
    let updatedState;
    
    if (namespace) {
      // تحديث قسم محدد من الحالة
      const namespaceArray = namespace.split('.');
      updatedState = { ...this.state };
      
      let current = updatedState;
      for (let i = 0; i < namespaceArray.length - 1; i++) {
        const key = namespaceArray[i];
        current[key] = current[key] ? { ...current[key] } : {};
        current = current[key];
      }
      
      const lastKey = namespaceArray[namespaceArray.length - 1];
      current[lastKey] = typeof current[lastKey] === 'object' && !Array.isArray(current[lastKey]) ?
        { ...current[lastKey], ...newState } : newState;
    } else {
      // تحديث الحالة بالكامل بالدمج
      updatedState = { ...this.state, ...newState };
    }
    
    // تحديث الحالة
    this.state = updatedState;
    
    // حفظ الحالة محلياً إذا كان مطلوباً
    if (this.persistState) {
      StorageService.setItem(this.stateKey, this.state);
    }
    
    // تنبيه المستمعين بالتغييرات
    this.notifySubscribers();
  }

  /**
   * إعادة تعيين الحالة إلى القيمة المحددة أو قيمة فارغة
   * @param {Object} [initialState={}] - الحالة الأولية
   */
  resetState(initialState = {}) {
    this.state = initialState;
    
    if (this.persistState) {
      StorageService.setItem(this.stateKey, this.state);
    }
    
    this.notifySubscribers();
  }

  /**
   * الاشتراك في تحديثات الحالة
   * @param {Function} callback - الدالة التي ستستدعى عند تحديث الحالة
   * @returns {Function} دالة لإلغاء الاشتراك
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('يجب أن يكون المستمع دالة');
      return () => {};
    }
    
    this.subscribers.push(callback);
    
    // إرجاع دالة لإلغاء الاشتراك
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * تنبيه جميع المستمعين بالتغييرات
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  /**
   * حفظ الحالة الحالية في التخزين المحلي
   */
  persistCurrentState() {
    StorageService.setItem(this.stateKey, this.state);
  }

  /**
   * تفعيل أو تعطيل الحفظ التلقائي للحالة
   * @param {boolean} persist - حالة التفعيل
   */
  setPersistence(persist) {
    this.persistState = persist;
    if (persist) {
      this.persistCurrentState();
    }
  }
}

// إنشاء مثيل وحيد من مخزن الحالة للتطبيق
const initialState = {
  user: null,
  pilgrims: {
    searchResults: [],
    selectedPilgrim: null,
    loading: false,
    error: null
  },
  treatment: {
    cases: [],
    currentCase: null
  },
  death: {
    records: [],
    statistics: {}
  },
  ui: {
    theme: 'light',
    language: 'ar',
    sidebarOpen: true,
    notifications: []
  },
  appSettings: {
    version: '1.0.0',
    lastUpdate: new Date().toISOString()
  }
};

// إنشاء نموذج موحد من المخزن
export const store = new Store(initialState, true);

// توفير واجهة مبسطة للتوافق مع الكود القديم
export default {
  state: store.state,
  getState: (path = null) => store.getState(path),
  setState: (newState, namespace = null) => store.setState(newState, namespace),
  subscribe: callback => store.subscribe(callback),
  resetState: initialState => store.resetState(initialState)
};
