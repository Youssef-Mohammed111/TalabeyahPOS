/**
 * Thermal Receipt Printing & ESC/POS Commands Driver
 * Handles 80mm and 58mm thermal receipts, cash drawer kick (RJ11), and silent kiosk printing
 */

export interface ReceiptData {
  branchName: string;
  invoiceNumber: string;
  cashierName: string;
  customerName?: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unit: string;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
}

/**
 * Sends Cash Drawer Kick pulse to receipt printer via ESC/POS command
 * ESC p 0 25 250 (Pin 2 kick) or ESC p 1 25 250 (Pin 5 kick)
 */
export function getDrawerKickCommand(): Uint8Array {
  return new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
}

/**
 * Standard ESC/POS Paper Cut Command
 * GS V 65 0 (Full cut)
 */
export function getCutPaperCommand(): Uint8Array {
  return new Uint8Array([0x1d, 0x56, 0x41, 0x00]);
}

/**
 * Kiosk / Silent Print Shortcut instructions for Windows Desktop PC:
 * "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing "http://localhost:3000"
 */
export const WINDOWS_KIOSK_PRINTING_INSTRUCTIONS = {
  shortcutCommand: 'chrome.exe --kiosk --kiosk-printing',
  benefits: [
    'طباعة فورية بضغطة زر دون ظهور نافذة معاينة الطباعة (Silent Direct Print)',
    'فتح درج النقدية الكهربائي المتصل بالطابعة الحرارية بكابل RJ11 فوراً مع كل إيصال نقدي',
    'قطع الورق آلياً بنهاية كل فاتورة دون تدخل يدوي',
  ],
};
