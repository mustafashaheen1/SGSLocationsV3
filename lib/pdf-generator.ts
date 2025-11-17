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
  console.log(`Starting PDF generation for ${property.name} with ${images.length} images`);

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
  const nameLines = pdf.splitTextToSize(property.name, contentWidth);
  pdf.text(nameLines, margin, currentY);
  currentY += (nameLines.length * 10);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(property.city, margin, currentY);
  currentY += 15;

  const imagesPerRow = 2;
  const imageWidth = (contentWidth - 10) / 2;
  const imageHeight = imageWidth * 0.67;
  const gap = 10;

  let imagesProcessed = 0;
  let imagesFailed = 0;
  let currentRow = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const col = i % imagesPerRow;
    const row = Math.floor(i / imagesPerRow);

    const x = margin + (col * (imageWidth + gap));
    const y = currentY + ((row - currentRow) * (imageHeight + gap + 5));

    if (y + imageHeight + 10 > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      currentRow = row;
      const newY = currentY + ((row - currentRow) * (imageHeight + gap + 5));

      const adjustedY = currentY;
      await addImageToPDF(pdf, image, x, adjustedY, imageWidth, imageHeight);
      continue;
    }

    const success = await addImageToPDF(pdf, image, x, y, imageWidth, imageHeight);
    if (success) {
      imagesProcessed++;
    } else {
      imagesFailed++;
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

  console.log(`PDF generation complete: ${imagesProcessed} successful, ${imagesFailed} failed`);

  return pdf.output('blob');
}

async function addImageToPDF(
  pdf: jsPDF,
  image: PropertyImage,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<boolean> {
  try {
    console.log(`Loading image: ${image.url.substring(0, 60)}...`);

    const response = await fetch('/api/fetch-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: image.url })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      throw new Error(error.error || 'Failed to fetch image');
    }

    const data = await response.json();

    if (!data.base64) {
      throw new Error('No base64 data returned');
    }

    pdf.addImage(data.base64, 'JPEG', x, y, width, height);

    if (image.tags && image.tags.length > 0) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      const label = image.tags.slice(0, 2).join(', ');
      const truncatedLabel = label.length > 40 ? label.substring(0, 37) + '...' : label;
      pdf.text(truncatedLabel, x, y + height + 4);
    }

    console.log(`✓ Image loaded successfully`);
    return true;

  } catch (error: any) {
    console.error(`✗ Failed to load image:`, error.message);

    pdf.setFillColor(230, 230, 230);
    pdf.rect(x, y, width, height, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Image unavailable', x + width/2, y + height/2, { align: 'center' });

    return false;
  }
}
