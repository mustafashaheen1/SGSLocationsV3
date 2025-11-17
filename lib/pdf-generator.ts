import jsPDF from 'jspdf';

interface PropertyImage {
  url: string;
  tags: string[];
  order: number;
}

interface PropertyData {
  name: string;
  city: string;
  description: string;
  address: string;
}

export async function generateLocationPDF(
  property: PropertyData,
  images: PropertyImage[]
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = margin;

  pdf.setFillColor(225, 25, 33);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SGS LOCATIONS', margin, 17);

  currentY = 35;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(property.name, margin, currentY);
  currentY += 10;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(property.city, margin, currentY);
  currentY += 15;

  const imagesPerRow = 2;
  const imageWidth = (contentWidth - 10) / 2;
  const imageHeight = imageWidth * 0.67;
  const gap = 10;

  let imageIndex = 0;

  for (const image of images) {
    const col = imageIndex % imagesPerRow;
    const row = Math.floor(imageIndex / imagesPerRow);

    const x = margin + (col * (imageWidth + gap));
    const y = currentY + (row * (imageHeight + gap + 5));

    if (y + imageHeight + 10 > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      imageIndex = 0;
      continue;
    }

    try {
      const imgData = await loadImage(image.url);
      pdf.addImage(imgData, 'JPEG', x, y, imageWidth, imageHeight);

      if (image.tags && image.tags.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const label = image.tags.slice(0, 2).join(', ');
        pdf.text(label, x, y + imageHeight + 4);
      }
    } catch (error) {
      console.error('Failed to load image:', image.url);
      pdf.setFillColor(230, 230, 230);
      pdf.rect(x, y, imageWidth, imageHeight, 'F');
    }

    imageIndex++;

    if (col === imagesPerRow - 1) {
      currentY = y + imageHeight + gap;
    }
  }

  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `www.sgslocations.com | ${property.address}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
