// api.service.js
import { CONFIG } from '../../config/config.js';

/**
 * خدمة التعامل مع واجهة برمجة التطبيقات
 * تدير جميع طلبات HTTP للاتصال بالخادم
 */
export default class ApiService {
  constructor() {
    // استخدام رابط Google Apps Script المقدم
    this.baseURL = 'https://script.google.com/macros/s/AKfycbxhSNe-Hj-ZO3z2u94yF-loKyn1tEXcaEMJqpQPaJihR3ZdnFMekwxL1z-g2lKapxqd/exec';
  }
  
  /**
   * طلب GET للحصول على البيانات
   * @param {string} endpoint - نقطة النهاية للطلب
   * @param {Object} params - المعلمات المطلوبة (اختياري)
   * @returns {Promise<Object>} البيانات المستلمة
   */
  async get(endpoint, params = {}) {
    try {
      const url = new URL(this.baseURL + endpoint);
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`فشل الطلب: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('خطأ في طلب GET:', error);
      throw error;
    }
  }
  
  /**
   * طلب POST لإرسال البيانات
   * @param {string} endpoint - نقطة النهاية للطلب
   * @param {Object} data - البيانات المراد إرسالها
   * @returns {Promise<Object>} استجابة الخادم
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(this.baseURL + endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`فشل الطلب: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('خطأ في طلب POST:', error);
      throw error;
    }
  }
}
