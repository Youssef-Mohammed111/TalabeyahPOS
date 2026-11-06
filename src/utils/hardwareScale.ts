/**
 * Web Serial API Driver for Electronic Digital Weighing Scales
 * Compatible with CAS, Toledo, Rongta, Yaohua, Jadever, DIGI, and generic RS-232/USB scales
 */

export interface SerialScaleConfig {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
}

export type WeightCallback = (weightKg: number, isStable: boolean) => void;

class HardwareScaleDriver {
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private listeners: WeightCallback[] = [];

  /**
   * Check if the browser supports Web Serial API (Chrome, Edge, Opera, Electron)
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Connect to physical digital scale via Web Serial API prompt
   */
  public async connect(config: SerialScaleConfig = { baudRate: 9600 }): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'متصفحك لا يدعم Web Serial API. استخدم Google Chrome أو Microsoft Edge على الكمبيوتر للاتصال المباشر بالميزان.',
      };
    }

    try {
      // Request user to select the scale COM port
      const nav = navigator as any;
      this.port = await nav.serial.requestPort();
      await this.port.open({
        baudRate: config.baudRate || 9600,
        dataBits: config.dataBits || 8,
        stopBits: config.stopBits || 1,
        parity: config.parity || 'none',
      });

      this.isReading = true;
      this.startReadingLoop();

      return {
        success: true,
        message: 'تم الاتصال بالميزان الإلكتروني بنجاح وجاري قراءة الوزن الحي.',
      };
    } catch (err: any) {
      this.isReading = false;
      return {
        success: false,
        message: err.name === 'NotFoundError' ? 'تم إلغاء اختيار منفذ الميزان' : `تعذر فتح المنفذ: ${err.message}`,
      };
    }
  }

  /**
   * Disconnect scale
   */
  public async disconnect(): Promise<void> {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn('Error closing serial port', e);
    }
  }

  /**
   * Register listener for continuous weight updates
   */
  public onWeight(callback: WeightCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(weight: number, isStable: boolean) {
    for (const listener of this.listeners) {
      listener(weight, isStable);
    }
  }

  /**
   * Continuous read stream from serial port
   */
  private async startReadingLoop(): Promise<void> {
    if (!this.port || !this.port.readable) return;

    try {
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      let buffer = '';

      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/[\r\n]+/);
          buffer = lines.pop() || '';

          for (const line of lines) {
            this.parseScaleLine(line);
          }
        }
      }
    } catch (error) {
      console.warn('Serial scale read loop interrupted:', error);
    } finally {
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch (_) {}
      }
    }
  }

  /**
   * Parse common retail scale ASCII protocols
   * Examples:
   * - "ST,GS,+  1.250kg" (Toledo/CAS)
   * - "WN001.250kg" (Rongta/Generic)
   * - " 1.250 " (Raw numbers)
   */
  public parseScaleLine(rawLine: string): void {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const isStable = trimmed.includes('ST') || !trimmed.includes('US');

    // Extract decimal number using regex
    const match = trimmed.match(/([+-]?\s*\d+\.\d{2,3})/);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/\s+/g, '');
      const weight = parseFloat(cleanNum);
      if (!isNaN(weight) && weight >= 0 && weight < 150) {
        this.notify(Math.round(weight * 1000) / 1000, isStable);
      }
    }
  }
}

export const hardwareScale = new HardwareScaleDriver();
