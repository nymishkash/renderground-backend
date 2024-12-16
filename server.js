// server.js
const express = require("express");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const cors = require("cors");

const app = express();
// At the top of server.js, modify the CORS setup:
app.use(
  cors({
    origin: "https://renderground.netlify.app",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Event emitter for logging exports
const exportEmitter = new EventEmitter();

// Store canvases in memory with metadata
const canvases = new Map();

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Enhanced canvas initialization with background color and metadata
app.post("/canvas", (req, res) => {
  const {
    width = 800,
    height = 600,
    id,
    backgroundColor = "white",
    metadata = {},
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Canvas ID is required" });
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Set background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Store canvas with metadata
  canvases.set(id, {
    canvas,
    metadata: {
      ...metadata,
      createdAt: new Date(),
      lastModified: new Date(),
      elementCount: 0,
    },
  });

  res.json({
    message: "Canvas initialized",
    id,
    dimensions: { width, height },
    metadata: canvases.get(id).metadata,
  });
});

// Get canvas metadata
app.get("/canvas/:id", (req, res) => {
  const { id } = req.params;
  const canvasData = canvases.get(id);

  if (!canvasData) {
    return res.status(404).json({ error: "Canvas not found" });
  }

  res.json({
    id,
    dimensions: {
      width: canvasData.canvas.width,
      height: canvasData.canvas.height,
    },
    metadata: canvasData.metadata,
  });
});

// Fix canvas export by updating the SVG conversion
function canvasToSVG(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  try {
    // Get canvas data as PNG for better quality
    const imageData = canvas
      .toDataURL("image/png")
      .replace(/^data:image\/png;base64,/, "");
    const base64Data = Buffer.from(imageData, "base64").toString("base64");

    // Create SVG with proper encoding
    const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg 
          width="${width}" 
          height="${height}" 
          viewBox="0 0 ${width} ${height}"
          xmlns="http://www.w3.org/2000/svg" 
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
        >
          <rect width="100%" height="100%" fill="white"/>
          <image 
            width="100%" 
            height="100%" 
            preserveAspectRatio="none" 
            xlink:href="data:image/png;base64,${base64Data}"
          />
        </svg>`;

    return svg;
  } catch (error) {
    console.error("SVG conversion error:", error);
    throw error;
  }
}

// Update the export endpoint
// Single export endpoint
app.get("/canvas/:id/export", (req, res) => {
  const { id } = req.params;
  const canvasData = canvases.get(id);

  if (!canvasData) {
    return res.status(404).json({ error: "Canvas not found" });
  }

  try {
    // Convert canvas to SVG
    const width = canvasData.canvas.width;
    const height = canvasData.canvas.height;

    // Get canvas data as PNG and convert to base64
    const imageData = canvasData.canvas
      .toDataURL("image/png")
      .replace(/^data:image\/png;base64,/, "");
    const base64Data = Buffer.from(imageData, "base64").toString("base64");

    // Create SVG with embedded image
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg 
          width="${width}" 
          height="${height}" 
          viewBox="0 0 ${width} ${height}"
          xmlns="http://www.w3.org/2000/svg" 
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
        >
          <rect width="100%" height="100%" fill="white"/>
          <image 
            width="100%" 
            height="100%" 
            preserveAspectRatio="none" 
            xlink:href="data:image/png;base64,${base64Data}"
          />
        </svg>`;

    // Create HTML document
    const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Canvas Export</title>
      <style>
          body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f0f0f0;
          }
          .canvas-container {
              background: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin: 20px;
              max-width: 100%;
              overflow: auto;
          }
          svg {
              display: block;
              max-width: 100%;
              height: auto;
          }
      </style>
  </head>
  <body>
      <div class="canvas-container">
          ${svgContent}
      </div>
  </body>
  </html>`;

    // Set headers for file download
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="canvas-${id}.html"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(html);

    // Log export
    exportEmitter.emit("export", {
      canvasId: id,
      timestamp: new Date(),
      format: "html",
      metadata: canvasData.metadata,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// List all canvases
app.get("/canvas", (req, res) => {
  const canvasList = Array.from(canvases.entries()).map(([id, data]) => ({
    id,
    dimensions: {
      width: data.canvas.width,
      height: data.canvas.height,
    },
    metadata: data.metadata,
  }));

  res.json(canvasList);
});

// Delete canvas
app.delete("/canvas/:id", (req, res) => {
  const { id } = req.params;

  if (!canvases.has(id)) {
    return res.status(404).json({ error: "Canvas not found" });
  }

  canvases.delete(id);
  res.json({ message: "Canvas deleted successfully" });
});

// Enhanced SVG conversion with optimization
function canvasToSVG(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  try {
    // Get canvas data as PNG for better quality
    const imageData = canvas
      .toDataURL("image/png")
      .replace(/^data:image\/png;base64,/, "");
    const base64Data = Buffer.from(imageData, "base64").toString("base64");

    // Create SVG with proper encoding
    const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg 
          width="${width}" 
          height="${height}" 
          viewBox="0 0 ${width} ${height}"
          xmlns="http://www.w3.org/2000/svg" 
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
        >
          <rect width="100%" height="100%" fill="white"/>
          <image 
            width="100%" 
            height="100%" 
            preserveAspectRatio="none" 
            xlink:href="data:image/png;base64,${base64Data}"
          />
        </svg>`;

    return svg;
  } catch (error) {
    console.error("SVG conversion error:", error);
    throw error;
  }
}
// Add this to your existing server.js

// Helper function to convert canvas to SVG (update existing function)
function canvasToSVG(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  // Get canvas data as PNG for better quality
  const imageData = canvas.toDataURL("image/png");

  // Create SVG with viewBox for better scaling
  let svg = `
        <svg 
            width="${width}" 
            height="${height}" 
            viewBox="0 0 ${width} ${height}"
            xmlns="http://www.w3.org/2000/svg" 
            version="1.1"
        >`;

  // Add white background to ensure visibility
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  // Add the canvas content as an image
  svg += `<image 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none" 
        href="${imageData}"
    />`;

  svg += "</svg>";

  return svg;
}

// Enhanced export event listener with more details
exportEmitter.on("export", (data) => {
  console.log("Export event:", {
    timestamp: data.timestamp,
    canvasId: data.canvasId,
    format: data.format,
    metadata: data.metadata,
    performance: {
      elementCount: data.metadata.elementCount,
      timeSinceCreation: Date.now() - data.metadata.createdAt,
    },
  });
});

// Modify the elements endpoint to ensure it sends a response:
app.post("/canvas/:id/elements", (req, res) => {
  const { id } = req.params;
  const { type, properties } = req.body;

  console.log("Adding element:", { type, properties });
  const canvasData = canvases.get(id);
  if (!canvasData) {
    return res.status(404).json({ error: "Canvas not found" });
  }

  const ctx = canvasData.canvas.getContext("2d");

  try {
    switch (type) {
      case "rectangle": {
        const {
          x,
          y,
          width,
          height,
          color,
          strokeColor,
          strokeWidth,
          rounded,
        } = properties;
        ctx.beginPath();
        if (rounded) {
          const radius = Math.min(rounded, width / 2, height / 2);
          ctx.roundRect(x, y, width, height, radius);
        } else {
          ctx.rect(x, y, width, height);
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth || 1;
          ctx.stroke();
        }
        break;
      }
      case "circle": {
        const {
          centerX,
          centerY,
          radius,
          fillColor,
          strokeColor: circleStroke,
          strokeWidth: circleStrokeWidth,
        } = properties;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        if (fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        if (circleStroke) {
          ctx.strokeStyle = circleStroke;
          ctx.lineWidth = circleStrokeWidth || 1;
          ctx.stroke();
        }
        break;
      }
      case "text": {
        const {
          text,
          x: textX,
          y: textY,
          font,
          textColor,
          align = "center",
          baseline = "middle",
          maxWidth,
        } = properties;
        try {
          // Save the current context state
          ctx.save();

          // Set text properties
          ctx.font = font || "20px Arial";
          ctx.fillStyle = textColor;
          ctx.textAlign = align;
          ctx.textBaseline = baseline;

          // Draw the text
          ctx.fillText(text, textX, textY, maxWidth);

          // Restore the context state
          ctx.restore();

          console.log("Text added:", {
            text,
            position: { x: textX, y: textY },
            style: { font, color: textColor },
          });
        } catch (error) {
          console.error("Error adding text:", error);
          throw error;
        }
        break;
      }
    }

    // Update metadata
    canvasData.metadata.lastModified = new Date();
    canvasData.metadata.elementCount++;

    console.log(
      "Element added successfully, new count:",
      canvasData.metadata.elementCount
    );

    // Send response
    res.json({
      message: "Element added successfully",
      metadata: canvasData.metadata,
    });
  } catch (error) {
    console.error("Error adding element:", error);
    res.status(500).json({ error: "Failed to add element" });
  }
});

// In the preview endpoint:
app.get("/canvas/:id/preview", (req, res) => {
  const { id } = req.params;
  console.log("Preview requested for:", id);

  try {
    const canvasData = canvases.get(id);

    if (!canvasData) {
      console.log("Canvas not found for preview");
      return res.status(404).json({ error: "Canvas not found" });
    }

    const buffer = canvasData.canvas.toBuffer("image/png");
    console.log(
      "Preview buffer size:",
      buffer.length,
      "Elements:",
      canvasData.metadata.elementCount
    );

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(buffer);
  } catch (error) {
    console.error("Error creating preview:", error);
    res.status(500).json({ error: "Failed to create preview" });
  }
});

const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
