// utils/export.utils.js
/**
 * مجموعة دوال لتصدير البيانات بتنسيقات مختلفة
 */

/**
 * تصدير البيانات إلى ملف Excel
 * @param {Array|Object} data - البيانات المراد تصديرها
 * @param {Object} options - خيارات التصدير
 * @param {string} options.filename - اسم الملف (الافتراضي: "report.xlsx")
 * @param {string} options.sheetName - اسم ورقة العمل (الافتراضي: "بيانات")
 * @param {Array} options.columns - أعمدة محددة للتصدير (اختياري)
 * @returns {Promise<boolean>} نجاح عملية التصدير
 */
export async function exportToExcel(data, options = {}) {
  try {
    const { 
      filename = "report.xlsx", 
      sheetName = "بيانات", 
      columns = [] 
    } = options;
    
    console.log("تصدير إلى Excel:", { data, filename, sheetName, columns });
    
    // للتنفيذ الفعلي، يمكن استخدام مكتبة مثل SheetJS/xlsx
    // const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');
    
    // تحويل البيانات إلى صفوف وأعمدة
    const processedData = Array.isArray(data) ? data : [data];
    
    // تطبيق تصفية الأعمدة إذا تم تحديدها
    const filteredData = columns.length > 0 
      ? processedData.map(item => {
          const filtered = {};
          columns.forEach(col => {
            if (col.key && item[col.key] !== undefined) {
              filtered[col.label || col.key] = item[col.key];
            }
          });
          return filtered;
        })
      : processedData;
    
    // مستقبلاً: تنفيذ منطق التصدير باستخدام مكتبة مناسبة
    
    return true;
  } catch (error) {
    console.error('خطأ في تصدير البيانات إلى Excel:', error);
    throw new Error('فشل تصدير البيانات: ' + error.message);
  }
}

/**
 * تصدير المحتوى إلى ملف PDF
 * @param {Object} content - محتوى التقرير المراد تصديره
 * @param {Object} options - خيارات التصدير
 * @param {string} options.filename - اسم الملف (الافتراضي: "report.pdf")
 * @param {Object} options.documentOptions - خيارات مستند PDF (الاتجاه، الحجم، إلخ)
 * @returns {Promise<boolean>} نجاح عملية التصدير
 */
export async function exportToPDF(content, options = {}) {
  try {
    const { 
      filename = "report.pdf", 
      documentOptions = {
        orientation: 'portrait',
        format: 'a4'
      } 
    } = options;
    
    console.log("تصدير إلى PDF:", { content, filename, documentOptions });
    
    // للتنفيذ الفعلي، يمكن استخدام مكتبة مثل jsPDF أو pdfmake
    // const pdfMake = await import('https://cdn.jsdelivr.net/npm/pdfmake/build/pdfmake.min.js');
    // const pdfFonts = await import('https://cdn.jsdelivr.net/npm/pdfmake/build/vfs_fonts.js');
    // pdfMake.vfs = pdfFonts.pdfMake.vfs;
    
    // مستقبلاً: تنفيذ منطق التصدير باستخدام مكتبة مناسبة
    
    return true;
  } catch (error) {
    console.error('خطأ في تصدير البيانات إلى PDF:', error);
    throw new Error('فشل تصدير البيانات: ' + error.message);
  }
}

/**
 * تصدير البيانات إلى ملف CSV
 * @param {Array} data - البيانات المراد تصديرها
 * @param {Object} options - خيارات التصدير
 * @param {string} options.filename - اسم الملف (الافتراضي: "report.csv")
 * @param {Array} options.columns - أعمدة محددة للتصدير (اختياري)
 * @param {string} options.delimiter - فاصل الحقول (الافتراضي: ",")
 * @returns {Promise<boolean>} نجاح عملية التصدير
 */
export async function exportToCSV(data, options = {}) {
  try {
    const { 
      filename = "report.csv", 
      columns = [], 
      delimiter = "," 
    } = options;
    
    if (!Array.isArray(data)) {
      throw new Error('يجب أن تكون البيانات مصفوفة');
    }
    
    // تحديد الأعمدة
    let headers = [];
    let dataKeys = [];
    
    if (columns.length > 0) {
      headers = columns.map(col => col.label || col.key);
      dataKeys = columns.map(col => col.key);
    } else if (data.length > 0) {
      dataKeys = Object.keys(data[0]);
      headers = dataKeys;
    }
    
    // إنشاء محتوى CSV
    let csvContent = headers.join(delimiter) + "\n";
    
    // إضافة الصفوف
    data.forEach(item => {
      const row = dataKeys.map(key => {
        // تغليف القيم التي تحتوي على الفاصل أو أسطر جديدة
        let value = item[key]?.toString() || '';
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += row.join(delimiter) + "\n";
    });
    
    // إنشاء ملف وتنزيله
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('خطأ في تصدير البيانات إلى CSV:', error);
    throw new Error('فشل تصدير البيانات: ' + error.message);
  }
}

/**
 * طباعة محتوى معين
 * @param {HTMLElement|string} content - العنصر أو المحتوى المراد طباعته
 * @param {Object} options - خيارات الطباعة
 * @returns {boolean} نجاح عملية الطباعة
 */
export function printContent(content, options = {}) {
  try {
    const { title = "تقرير" } = options;
    
    // إنشاء IFrame مؤقت للطباعة
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    document.body.appendChild(printFrame);
    
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    
    // إنشاء محتوى HTML
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, Tahoma, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          @media print {
            @page { size: A4; margin: 1cm; }
          }
        </style>
      </head>
      <body>`;
      
    // إضافة المحتوى
    if (typeof content === 'string') {
      htmlContent += content;
    } else if (content instanceof HTMLElement) {
      htmlContent += content.outerHTML;
    }
    
    htmlContent += `
      </body>
      </html>`;
    
    frameDoc.write(htmlContent);
    frameDoc.close();
    
    // طباعة
    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      document.body.removeChild(printFrame);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('خطأ في طباعة المحتوى:', error);
    return false;
  }
}
