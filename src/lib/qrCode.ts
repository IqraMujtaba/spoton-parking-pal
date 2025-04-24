
import QRCode from 'qrcode';

export interface BookingQRData {
  bookingId: string;
  spotId: string;
  date: string;
  startTime: string;
  endTime: string;
  userId: string;
}

export async function generateQRCode(data: BookingQRData): Promise<string> {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

export function parseQRCode(qrData: string): BookingQRData | null {
  try {
    return JSON.parse(qrData) as BookingQRData;
  } catch (err) {
    console.error('Error parsing QR code data:', err);
    return null;
  }
}
