const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { getGridFSBucket } = require('../config/gridfs');
const mongoose = require('mongoose');
const { promisify } = require('util');
const streamToBuffer = require('stream-to-buffer');
const streamToBufferPromise = promisify(streamToBuffer);
const Upload = require('../models/Upload');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfParse = require('pdf-parse');
const DiffLib = require('diff');

/**
 * Generates a PDF document showing changes between versions with inline highlighting
 * that combines content from both documents into a single merged view
 */
async function generatePdfDiff(leftId, rightId, showHighlights = true) {
  try {
    console.log(`Starting combined diff between ${leftId} and ${rightId}`);
    let leftFileId, rightFileId;
    
    // Find documents in Upload collection
    const leftDoc = await Upload.findById(leftId).lean().exec();
    const rightDoc = await Upload.findById(rightId).lean().exec();
    
    if (leftDoc && leftDoc.fileId) {
      leftFileId = leftDoc.fileId;
      console.log(`Found left document, fileId: ${leftFileId}`);
    } else {
      leftFileId = leftId;
      console.log(`Using leftId directly: ${leftFileId}`);
    }
    
    if (rightDoc && rightDoc.fileId) {
      rightFileId = rightDoc.fileId;
      console.log(`Found right document, fileId: ${rightFileId}`);
    } else {
      rightFileId = rightId;
      console.log(`Using rightId directly: ${rightFileId}`);
    }
    
    // Get GridFS bucket and retrieve files
    const gfsBucket = getGridFSBucket();
    
    // Validate ObjectIDs
    if (!mongoose.isValidObjectId(leftFileId) || !mongoose.isValidObjectId(rightFileId)) {
      throw new Error('Invalid file IDs provided');
    }
    
    const leftObjId = new mongoose.Types.ObjectId(leftFileId);
    const rightObjId = new mongoose.Types.ObjectId(rightFileId);
    
    // Get file buffers
    let leftBuffer, rightBuffer;
    
    try {
      const leftStream = gfsBucket.openDownloadStream(leftObjId);
      leftBuffer = await streamToBufferPromise(leftStream);
    } catch (err) {
      console.error('Error reading left file:', err.message);
      throw new Error(`Failed to read previous version file: ${err.message}`);
    }
    
    try {
      const rightStream = gfsBucket.openDownloadStream(rightObjId);
      rightBuffer = await streamToBufferPromise(rightStream);
    } catch (err) {
      console.error('Error reading right file:', err.message);
      throw new Error(`Failed to read current version file: ${err.message}`);
    }
    
    // Load both PDFs for structure/layout analysis
    const leftPdf = await PDFDocument.load(leftBuffer);
    const rightPdf = await PDFDocument.load(rightBuffer);
    
    // Extract text from both PDFs
    let leftText, rightText;
    
    try {
      const leftPdfData = await pdfParse(leftBuffer);
      leftText = leftPdfData.text;
      console.log(`Extracted ${leftText.length} characters from previous version`);
    } catch (err) {
      console.error('Error parsing left PDF:', err.message);
      throw new Error(`Failed to extract text from previous version: ${err.message}`);
    }
    
    try {
      const rightPdfData = await pdfParse(rightBuffer);
      rightText = rightPdfData.text;
      console.log(`Extracted ${rightText.length} characters from current version`);
    } catch (err) {
      console.error('Error parsing right PDF:', err.message);
      throw new Error(`Failed to extract text from current version: ${err.message}`);
    }
    
    // Create a smarter diff that detects modifications
    let diffResult = [];
    // First create a raw diff
    const rawDiff = DiffLib.diffWords(leftText, rightText);
    
    // Process the diff to identify modifications (consecutive remove+add pairs)
    for (let i = 0; i < rawDiff.length; i++) {
      const current = rawDiff[i];
      const next = i + 1 < rawDiff.length ? rawDiff[i + 1] : null;
      
      // Check if we have a remove followed by an add - this indicates modification
      if (current.removed && next && next.added) {
        // Add as a special "modified" item rather than separate remove/add
        diffResult.push({
          modified: true,
          oldValue: current.value,
          newValue: next.value
        });
        i++; // Skip the next item since we've handled it
      } else {
        // Keep the original diff item
        diffResult.push(current);
      }
    }
    
    // Count the changes
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;
    
    diffResult.forEach(part => {
      if (part.modified) modifiedCount++;
      else if (part.added) addedCount++;
      else if (part.removed) removedCount++;
      else unchangedCount++;
    });
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Add a cover page
    const coverPage = pdfDoc.addPage([612, 792]);
    
    // Title box
    coverPage.drawRectangle({
      x: 50,
      y: 642,
      width: 512,
      height: 60,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    // Title
    coverPage.drawText('Combined Document Comparison', {
      x: 70,
      y: 685,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.7),
    });
    
    // Generated date
    coverPage.drawText(`Generated on ${new Date().toLocaleString()}`, {
      x: 70,
      y: 660,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Version information
    if (leftDoc && rightDoc) {
      coverPage.drawText('Versions Being Compared:', {
        x: 70,
        y: 600,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      coverPage.drawText(`Previous: Version ${leftDoc.version || 'N/A'} (${new Date(leftDoc.createdAt).toLocaleDateString() || 'N/A'})`, {
        x: 70,
        y: 570,
        size: 14,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      coverPage.drawText(`Current: Version ${rightDoc.version || 'N/A'} (${new Date(rightDoc.createdAt).toLocaleDateString() || 'N/A'})`, {
        x: 70,
        y: 540,
        size: 14,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    // Change summary
    coverPage.drawText('Document Change Summary:', {
      x: 70,
      y: 490,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Additions summary
    coverPage.drawRectangle({
      x: 70,
      y: 460,
      width: 15,
      height: 15,
      color: rgb(0.8, 1.0, 0.8),
    });
    
    coverPage.drawText(`Additions: ${addedCount} changes`, {
      x: 95,
      y: 465,
      size: 14,
      font: helveticaFont,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    // Deletions summary
    coverPage.drawRectangle({
      x: 70,
      y: 430,
      width: 15,
      height: 15,
      color: rgb(1.0, 0.8, 0.8),
    });
    
    coverPage.drawText(`Deletions: ${removedCount} changes`, {
      x: 95,
      y: 435,
      size: 14,
      font: helveticaFont,
      color: rgb(0.6, 0.2, 0.2),
    });
    
    // Modifications summary
    coverPage.drawRectangle({
      x: 70,
      y: 400,
      width: 15,
      height: 15,
      color: rgb(0.8, 0.8, 1.0), // Light blue
    });
    
    coverPage.drawText(`Modifications: ${modifiedCount} changes`, {
      x: 95,
      y: 405,
      size: 14,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.7), // Darker blue
    });
    
    // Explanation of highlights
    coverPage.drawText('How This Document Works:', {
      x: 70,
      y: 370,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    coverPage.drawText('This comparison merges both versions into a single document with:', {
      x: 70,
      y: 340,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Highlight for additions
    coverPage.drawRectangle({
      x: 90,
      y: 310,
      width: 200,
      height: 20,
      color: rgb(0.8, 1.0, 0.8),
    });
    
    coverPage.drawText('Text added in newer version', {
      x: 95,
      y: 315,
      size: 12,
      font: helveticaFont,
      color: rgb(0.0, 0.0, 0.0),
    });
    
    // Highlight for deletions
    coverPage.drawRectangle({
      x: 90,
      y: 280,
      width: 200,
      height: 20,
      color: rgb(1.0, 0.8, 0.8),
    });
    
    coverPage.drawText('Text removed from previous version', {
      x: 95,
      y: 285,
      size: 12,
      font: helveticaFont,
      color: rgb(0.0, 0.0, 0.0),
    });
    
    // Highlight for modifications
    coverPage.drawRectangle({
      x: 90,
      y: 250,
      width: 200,
      height: 20,
      color: rgb(0.8, 0.8, 1.0), // Light blue
    });
    
    coverPage.drawText('Text modified between versions', {
      x: 95,
      y: 255,
      size: 12,
      font: helveticaFont,
      color: rgb(0.0, 0.0, 0.0),
    });
    
    // Add information about the merged view
    coverPage.drawText('The following pages contain:', {
      x: 70,
      y: 210,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    coverPage.drawText('1. Combined Text View - Shows all text with changes highlighted', {
      x: 90,
      y: 180,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    coverPage.drawText('2. Original Layout - Shows the original document with overlaid highlights', {
      x: 90,
      y: 160,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // PART 1: Combined Text View with highlights
    const textViewPage = pdfDoc.addPage([612, 792]);
    let currentY = 750;
    let currentPage = textViewPage;
    
    // Add a header to the content page
    currentPage.drawText('PART 1: Combined Document Text with Changes', {
      x: 50,
      y: currentY,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.7),
    });
    
    currentY -= 30;
    
    // Helper function to add a new page when needed
    const addNewPage = () => {
      currentPage = pdfDoc.addPage([612, 792]);
      currentY = 750;
      
      // Add header to the new page
      currentPage.drawText('Combined Document Text (Continued)', {
        x: 50,
        y: currentY,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.1, 0.1, 0.7),
      });
      
      currentY -= 30;
    };
    
    // Add each diff part to the document
    for (const part of diffResult) {
      // Special handling for modified parts
      if (part.modified) {
        // For modified parts, use blue highlights
        const backgroundColor = rgb(0.8, 0.8, 1.0); // Light blue
        const textColor = rgb(0, 0, 0.7); // Darker blue for text
        const font = helveticaBoldFont; // Bold for modified text
        
        // First add a label to identify this is a modification
        currentPage.drawText('MODIFIED FROM:', {
          x: 50,
          y: currentY,
          size: 8,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        currentY -= 15;
        
        // Check if we need a new page
        if (currentY < 50) {
          addNewPage();
        }
        
        // Display the old text with strikethrough and light red background
        const oldLines = part.oldValue.split('\n');
        for (const line of oldLines) {
          if (!line.trim()) {
            currentY -= 10;
            continue;
          }
          
          // Wrap and display the old text
          let remainingText = line;
          while (remainingText.length > 0) {
            const chunkSize = Math.min(80, remainingText.length);
            let chunk = remainingText.substring(0, chunkSize);
            
            if (chunkSize < remainingText.length && remainingText[chunkSize] !== ' ') {
              const lastSpace = chunk.lastIndexOf(' ');
              if (lastSpace > 0) {
                chunk = chunk.substring(0, lastSpace);
              }
            }
            
            const textWidth = helveticaFont.widthOfTextAtSize(chunk, 12);
            
            // Draw light red background for old text
            currentPage.drawRectangle({
              x: 50,
              y: currentY - 15,
              width: textWidth + 10,
              height: 20,
              color: rgb(1.0, 0.9, 0.9), // Very light red
            });
            
            // Draw the old text
            currentPage.drawText(chunk, {
              x: 55,
              y: currentY - 5,
              size: 12,
              font: helveticaFont,
              color: rgb(0.7, 0.2, 0.2), // Dark red
            });
            
            // Draw strikethrough line
            currentPage.drawLine({
              start: { x: 55, y: currentY - 7 },
              end: { x: 55 + textWidth, y: currentY - 7 },
              thickness: 1,
              color: rgb(0.7, 0.2, 0.2), // Red
              opacity: 0.7,
            });
            
            currentY -= 20;
            
            if (currentY < 50) {
              addNewPage();
            }
            
            remainingText = remainingText.substring(chunk.length).trim();
          }
        }
        
        // Add a "TO" label
        currentPage.drawText('MODIFIED TO:', {
          x: 50,
          y: currentY,
          size: 8,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        currentY -= 15;
        
        // Check if we need a new page
        if (currentY < 50) {
          addNewPage();
        }
        
        // Display the new text with light blue background
        const newLines = part.newValue.split('\n');
        for (const line of newLines) {
          if (!line.trim()) {
            currentY -= 10;
            continue;
          }
          
          // Wrap and display the new text
          let remainingText = line;
          while (remainingText.length > 0) {
            const chunkSize = Math.min(80, remainingText.length);
            let chunk = remainingText.substring(0, chunkSize);
            
            if (chunkSize < remainingText.length && remainingText[chunkSize] !== ' ') {
              const lastSpace = chunk.lastIndexOf(' ');
              if (lastSpace > 0) {
                chunk = chunk.substring(0, lastSpace);
              }
            }
            
            const textWidth = helveticaBoldFont.widthOfTextAtSize(chunk, 12);
            
            // Draw light blue background for new text
            currentPage.drawRectangle({
              x: 50,
              y: currentY - 15,
              width: textWidth + 10,
              height: 20,
              color: rgb(0.8, 0.8, 1.0), // Light blue
            });
            
            // Draw the new text
            currentPage.drawText(chunk, {
              x: 55,
              y: currentY - 5,
              size: 12,
              font: helveticaBoldFont,
              color: rgb(0.2, 0.2, 0.7), // Dark blue
            });
            
            currentY -= 20;
            
            if (currentY < 50) {
              addNewPage();
            }
            
            remainingText = remainingText.substring(chunk.length).trim();
          }
        }
        
        // Add a separator line
        currentPage.drawLine({
          start: { x: 50, y: currentY - 5 },
          end: { x: 562, y: currentY - 5 },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
          dashArray: [3, 3], // Dashed line
        });
        
        currentY -= 15;
      } else {
        // Handle regular additions, deletions and unchanged text
        let textColor = rgb(0, 0, 0); // Default black
        let backgroundColor = null;
        let font = helveticaFont;
        
        if (part.added) {
          backgroundColor = rgb(0.8, 1.0, 0.8); // Light green
          textColor = rgb(0, 0.5, 0); // Darker green for text
        } else if (part.removed) {
          backgroundColor = rgb(1.0, 0.8, 0.8); // Light red
          textColor = rgb(0.5, 0, 0); // Darker red for text
          font = helveticaObliqueFont; // Italic for removed text
        }
        
        // Split the text into lines to handle wrapping
        const lines = part.value.split('\n');
        
        for (const line of lines) {
          // Skip if line is empty
          if (!line.trim()) {
            currentY -= 15;
            continue;
          }
          
          // Check if we need a new page
          if (currentY < 50) {
            addNewPage();
          }
          
          // Wrap text at 80 characters per line approximately
          let remainingText = line;
          while (remainingText.length > 0) {
            const chunkSize = Math.min(80, remainingText.length);
            let chunk = remainingText.substring(0, chunkSize);
            
            // If we're not at the end and the next character isn't a space,
            // try to break at the last space to avoid cutting words
            if (chunkSize < remainingText.length && remainingText[chunkSize] !== ' ') {
              const lastSpace = chunk.lastIndexOf(' ');
              if (lastSpace > 0) {
                chunk = chunk.substring(0, lastSpace);
              }
            }
            
            // Calculate text width for background rectangle
            const textWidth = font.widthOfTextAtSize(chunk, 12);
            
            // Draw background if needed
            if (backgroundColor) {
              currentPage.drawRectangle({
                x: 50,
                y: currentY - 15,
                width: textWidth + 10,
                height: 20,
                color: backgroundColor,
              });
            }
            
            // Draw the text
            currentPage.drawText(chunk, {
              x: 55,
              y: currentY - 5,
              size: 12,
              font: font,
              color: textColor,
            });
            
            // Move to next line
            currentY -= 20;
            
            // Check if we need a new page
            if (currentY < 50) {
              addNewPage();
            }
            
            // Update remaining text
            remainingText = remainingText.substring(chunk.length).trim();
          }
        }
      }
    }
    
    // PART 2: Create a merged visual document
    // Add a section divider
    const dividerPage = pdfDoc.addPage([612, 792]);
    
    dividerPage.drawRectangle({
      x: 0,
      y: 396,
      width: 612,
      height: 396,
      color: rgb(0.9, 0.95, 1.0),
    });
    
    dividerPage.drawText('PART 2: COMBINED DOCUMENT', {
      x: 306 - 140, // Center text
      y: 500,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.6),
    });
    
    dividerPage.drawText('Original document with change markers', {
      x: 306 - 110, // Center text
      y: 460,
      size: 14,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.6),
    });
    
    // Copy and annotate pages from the higher version (right) document
    try {
      // Create a map of significant changes by approximate position
      // This is a simplification - in a real implementation you'd need more sophisticated
      // text position mapping which is complex with PDFs
      const changeMap = [];
      let currentPosition = 0;
      
      for (const part of diffResult) {
        if (part.modified) {
          changeMap.push({
            position: currentPosition,
            length: part.newValue.length,
            type: 'modified',
            text: part.newValue.substring(0, 50) + (part.newValue.length > 50 ? '...' : '')
          });
          currentPosition += part.newValue.length;
        } else if (part.added || part.removed) {
          changeMap.push({
            position: currentPosition,
            length: part.value.length,
            type: part.added ? 'added' : 'removed',
            text: part.value.substring(0, 50) + (part.value.length > 50 ? '...' : '')
          });
          currentPosition += part.value.length;
        } else {
          currentPosition += part.value.length;
        }
      }
      
      // Copy pages from the right document (newer version)
      const copiedPages = await pdfDoc.copyPages(rightPdf, rightPdf.getPageIndices());
      const pageCount = copiedPages.length;
      
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.addPage(copiedPages[i]);
        const { width, height } = page.getSize();
        
        // Add a heading bar
        page.drawRectangle({
          x: 0,
          y: height - 25,
          width: width,
          height: 25,
          color: rgb(0.9, 0.95, 1.0),
          opacity: 0.7,
        });
        
        page.drawText(`Combined Document - Page ${i + 1} of ${pageCount} - Version ${rightDoc?.version || '?'}`, {
          x: width / 2 - 130,
          y: height - 15,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.1, 0.1, 0.6),
        });
        
        // For each page, add change markers
        // This is a simplified approach - real implementation would need to map
        // text positions from the raw text to the PDF page coordinates
        
        // Add change markers to show where changes are located
        if (i < 3 && changeMap.length > 0) { // Just put some markers on the first few pages as example
          let yPos = height - 50;
          
          // Add a few sample change indicators 
          for (let j = 0; j < Math.min(3, changeMap.length); j++) {
            const change = changeMap[j % changeMap.length];
            
            // Create a side margin note for the change
            let noteColor, noteBackground, noteText;
            
            if (change.type === 'modified') {
              noteColor = rgb(0.2, 0.2, 0.7); // Dark blue
              noteBackground = rgb(0.9, 0.9, 1.0); // Light blue
              noteText = 'Modified';
            } else if (change.type === 'added') {
              noteColor = rgb(0.2, 0.7, 0.2); // Dark green
              noteBackground = rgb(0.9, 1.0, 0.9); // Light green
              noteText = 'Addition';
            } else {
              noteColor = rgb(0.7, 0.2, 0.2); // Dark red
              noteBackground = rgb(1.0, 0.9, 0.9); // Light red
              noteText = 'Deletion';
            }
            
            // Draw change marker
            page.drawRectangle({
              x: width - 150,
              y: yPos - 20,
              width: 140,
              height: 18,
              color: noteBackground,
              borderColor: noteColor,
              borderWidth: 1,
              opacity: 0.8,
              borderOpacity: 0.9,
            });
            
            page.drawText(noteText, {
              x: width - 145,
              y: yPos - 10,
              size: 8,
              font: helveticaBoldFont,
              color: noteColor,
            });
            
            // Draw connecting line to text (simplified)
            page.drawLine({
              start: { x: width - 150, y: yPos - 10 },
              end: { x: width - 160, y: yPos - 10 },
              thickness: 1,
              color: noteColor,
              opacity: 0.7,
            });
            
            yPos -= 30;
          }
          
          // Add a small legend at the bottom
          page.drawRectangle({
            x: 20,
            y: 25,
            width: 250,
            height: 50,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
            opacity: 0.9,
          });
          
          page.drawText('See Part 1 for detailed text changes', {
            x: 25,
            y: 55,
            size: 8,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Add color key
          page.drawRectangle({
            x: 25,
            y: 40,
            width: 8,
            height: 8,
            color: rgb(0.9, 1.0, 0.9),
          });
          
          page.drawText('Added', {
            x: 40,
            y: 40,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.7, 0.2),
          });
          
          page.drawRectangle({
            x: 80,
            y: 40,
            width: 8,
            height: 8,
            color: rgb(1.0, 0.9, 0.9),
          });
          
          page.drawText('Deleted', {
            x: 95,
            y: 40,
            size: 7,
            font: helveticaFont,
            color: rgb(0.7, 0.2, 0.2),
          });
          
          page.drawRectangle({
            x: 140,
            y: 40,
            width: 8,
            height: 8,
            color: rgb(0.9, 0.9, 1.0),
          });
          
          page.drawText('Modified', {
            x: 155,
            y: 40,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.7),
          });
        }
      }
    } catch (error) {
      console.error('Error creating combined document:', error.message);
      
      // Add an error page
      const errorPage = pdfDoc.addPage([612, 792]);
      
      errorPage.drawText('Error Creating Combined Document', {
        x: 50,
        y: 700,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.7, 0.2, 0.2),
      });
      
      errorPage.drawText(`Error: ${error.message}`, {
        x: 50,
        y: 670,
        size: 12,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('Fatal error in PDF diff generation:', error);
    
    // Create an error PDF
    const errorPdf = await PDFDocument.create();
    const page = errorPdf.addPage([612, 792]);
    
    const helveticaFont = await errorPdf.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await errorPdf.embedFont(StandardFonts.HelveticaBold);
    
    page.drawText('Error Generating PDF Comparison', {
      x: 50,
      y: 700,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0.8, 0.2, 0.2),
    });
    
    page.drawText(`Error: ${error.message}`, {
      x: 50,
      y: 650,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText('Please try again or contact support if the problem persists.', {
      x: 50,
      y: 620,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    const errorPdfBytes = await errorPdf.save();
    
    return Buffer.from(errorPdfBytes);
  }
}

module.exports = {
  generatePdfDiff
};