# RenderGround Backend

![Node.js](https://img.shields.io/badge/Node.js-v14.17.0-green) ![Express](https://img.shields.io/badge/Express-v4.17.1-blue)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Canvas Initialization](#canvas-initialization)
  - [Get Canvas](#get-canvas)
  - [Export Canvas](#export-canvas)
  - [List Canvases](#list-canvases)
  - [Delete Canvas](#delete-canvas)
  - [Add Elements to Canvas](#add-elements-to-canvas)
  - [Preview Canvas](#preview-canvas)
- [Error Handling](#error-handling)
- [Events](#events)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Introduction

RenderGround is a backend service built with Node.js and Express that allows users to create, manage, and manipulate canvases. Users can initialize canvases, add elements, export them as HTML, and preview their creations.

## Features

- Create and initialize canvases with customizable dimensions and background colors.
- Add various elements (rectangles, circles, text) to the canvas.
- Export the canvas as an HTML file containing an SVG representation.
- Preview the canvas as a PNG image.
- List all created canvases with their metadata.
- Delete canvases when no longer needed.

## Technologies Used

- **Node.js**: JavaScript runtime for building scalable network applications.
- **Express**: Fast, unopinionated, minimalist web framework for Node.js.
- **Canvas**: A library for drawing graphics on the server-side.
- **CORS**: Middleware for enabling Cross-Origin Resource Sharing.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nymishkash/renderground-backend.git
   ```

2. Navigate to the project directory:

   ```bash
   cd renderground-backend
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. The server will run on `http://localhost:6969` by default.

## Usage

You can interact with the API using tools like Postman or cURL. Below are the available API endpoints.

## API Endpoints

### Canvas Initialization

- **POST** `/canvas`
- **Request Body**:
  ```json
  {
    "width": 800,
    "height": 600,
    "id": "unique_canvas_id",
    "backgroundColor": "white",
    "metadata": {}
  }
  ```
- **Response**:
  ```json
  {
    "message": "Canvas initialized",
    "id": "unique_canvas_id",
    "dimensions": { "width": 800, "height": 600 },
    "metadata": { ... }
  }
  ```

### Get Canvas

- **GET** `/canvas/:id`
- **Response**:
  ```json
  {
    "id": "unique_canvas_id",
    "dimensions": { "width": 800, "height": 600 },
    "metadata": { ... }
  }
  ```

### Export Canvas

- **GET** `/canvas/:id/export`
- **Response**: HTML file download containing the SVG representation of the canvas.

### List Canvases

- **GET** `/canvas`
- **Response**:
  ```json
  [
    {
      "id": "unique_canvas_id",
      "dimensions": { "width": 800, "height": 600 },
      "metadata": { ... }
    },
    ...
  ]
  ```

### Delete Canvas

- **DELETE** `/canvas/:id`
- **Response**:
  ```json
  {
    "message": "Canvas deleted successfully"
  }
  ```

### Add Elements to Canvas

- **POST** `/canvas/:id/elements`
- **Request Body**:
  ```json
  {
    "type": "rectangle", // or "circle", "text"
    "properties": { ... }
  }
  ```
- **Response**:
  ```json
  {
    "message": "Element added successfully",
    "metadata": { ... }
  }
  ```

### Preview Canvas

- **GET** `/canvas/:id/preview`
- **Response**: PNG image of the canvas.

## Error Handling

The API provides standardized error responses for various scenarios, including:

- 400 Bad Request: When required parameters are missing.
- 404 Not Found: When a canvas with the specified ID does not exist.
- 500 Internal Server Error: For unexpected errors.

## Events

The application emits events for canvas exports, which can be listened to for logging or analytics purposes.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## Contact

For any inquiries, please reach out to [nymishkash](https://github.com/nymishkash).
