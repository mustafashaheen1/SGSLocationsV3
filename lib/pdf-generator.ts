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

const MAX_IMAGES = 50;
const PARALLEL_FETCHES = 5;

export async function generateLocationPDF(
  property: PropertyData,
  images: PropertyImage[]
): Promise<Blob> {
  const limitedImages = images.slice(0, MAX_IMAGES);

  console.log(`Starting PDF generation for ${property.name}`);
  console.log(`Total images: ${images.length}, Using: ${limitedImages.length}`);

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

  console.log('Fetching images in parallel...');
  const imageDataPromises = fetchImagesInBatches(limitedImages, PARALLEL_FETCHES);
  const imageDataResults = await imageDataPromises;

  console.log(`Fetched ${imageDataResults.length} images`);

  const imagesPerRow = 2;
  const imageWidth = (contentWidth - 10) / 2;
  const imageHeight = imageWidth * 0.67;
  const gap = 10;

  let imagesProcessed = 0;
  let imagesFailed = 0;
  let currentRow = 0;

  for (let i = 0; i < imageDataResults.length; i++) {
    const { image, base64 } = imageDataResults[i];
    const col = i % imagesPerRow;
    const row = Math.floor(i / imagesPerRow);

    const x = margin + (col * (imageWidth + gap));
    const y = currentY + ((row - currentRow) * (imageHeight + gap + 5));

    if (y + imageHeight + 10 > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      currentRow = row;
    }

    const recalculatedY = currentY + ((row - currentRow) * (imageHeight + gap + 5));

    try {
      if (base64) {
        pdf.addImage(base64, 'JPEG', x, recalculatedY, imageWidth, imageHeight);

        if (image.tags && image.tags.length > 0) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.setFont('helvetica', 'normal');
          const label = image.tags.slice(0, 2).join(', ');
          const truncatedLabel = label.length > 40 ? label.substring(0, 37) + '...' : label;
          pdf.text(truncatedLabel, x, recalculatedY + imageHeight + 4);
        }

        imagesProcessed++;
      } else {
        drawPlaceholder(pdf, x, recalculatedY, imageWidth, imageHeight);
        imagesFailed++;
      }
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      drawPlaceholder(pdf, x, recalculatedY, imageWidth, imageHeight);
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

  console.log(`PDF complete: ${imagesProcessed} successful, ${imagesFailed} failed`);

  return pdf.output('blob');
}

async function fetchImagesInBatches(
  images: PropertyImage[],
  batchSize: number
): Promise<Array<{ image: PropertyImage; base64: string | null }>> {
  const results: Array<{ image: PropertyImage; base64: string | null }> = [];

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`);

    const batchResults = await Promise.all(
      batch.map(async (image) => {
        try {
          const response = await fetch('/api/fetch-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: image.url })
          });

          if (!response.ok) {
            console.error(`Failed to fetch ${image.url}: ${response.status}`);
            return { image, base64: null };
          }

          const data = await response.json();
          return { image, base64: data.base64 || null };
        } catch (error: any) {
          console.error(`Error fetching ${image.url}:`, error.message);
          return { image, base64: null };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

function drawPlaceholder(pdf: jsPDF, x: number, y: number, width: number, height: number) {
  pdf.setFillColor(230, 230, 230);
  pdf.rect(x, y, width, height, 'F');

  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Image unavailable', x + width/2, y + height/2, { align: 'center' });
}
