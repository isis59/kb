# Knowledge Base Server

PHP backend for persisting knowledge base data to files on the server.

## Setup

1. Place the entire `server/` directory on your Apache server
2. Ensure PHP 7.0+ is installed
3. Make sure the `server/` directory has write permissions

## API Endpoints

### Save Knowledge Base
```
POST /api/kb/save
Content-Type: application/json

{
  "articles": { /* article data */ },
  "directories": { /* directory data */ }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Knowledge base saved successfully",
  "timestamp": "2026-07-27T12:00:00+00:00"
}
```

### Load Knowledge Base
```
GET /api/kb/load
```

**Response:**
```json
{
  "articles": { /* article data */ },
  "directories": { /* directory data */ }
}
```

### Export Knowledge Base
```
GET /api/kb/export
```

Downloads the knowledge base as a JSON file.

## File Structure

Data is stored in:
- `server/data/kb.json` - Main knowledge base file
- `server/data/articles/` - Individual article backup files

## Features

✅ **File Persistence** - All data saved as JSON files  
✅ **CORS Enabled** - Works with frontend from any origin  
✅ **Individual Backups** - Each article saved separately  
✅ **Error Handling** - Comprehensive error messages  
✅ **No Database** - Pure file-based storage  

## Configuration

To change the data directory, edit `server/api.php`:

```php
$dataDir = __DIR__ . '/data'; // Change this path
```

## Security Notes

⚠️ This is a basic implementation suitable for internal use.

For production, consider:
- Implementing authentication
- Validating data more strictly
- Restricting file access
- Adding rate limiting
- Using HTTPS
