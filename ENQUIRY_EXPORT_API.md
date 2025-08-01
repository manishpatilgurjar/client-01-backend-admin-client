# Enquiry Export API - CSV Generation

## 🔐 **Authentication**
Replace `YOUR_JWT_TOKEN` with your actual JWT token from login.

---

## 📋 **Export API Endpoint**

### **POST /admin/enquiries/export**

This endpoint exports enquiries based on filters and returns data ready for CSV generation on the frontend.

---

## 🚀 **cURL Commands for Different Export Scenarios**

### **1. Export Today's Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "today"
  }'
```

### **2. Export Yesterday's Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "yesterday"
  }'
```

### **3. Export Last 7 Days Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "last7days"
  }'
```

### **4. Export Last 30 Days Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "last30days"
  }'
```

### **5. Export This Month's Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "thisMonth"
  }'
```

### **6. Export Last Month's Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "lastMonth"
  }'
```

### **7. Export This Year's Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "thisYear"
  }'
```

### **8. Export Custom Date Range**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "custom",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### **9. Export with Status Filter**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "thisMonth",
    "status": "new"
  }'
```

### **10. Export with Category Filter**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "last7days",
    "category": "Product Inquiry"
  }'
```

### **11. Export Starred Enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "thisMonth",
    "starred": true
  }'
```

### **12. Export with Search Filter**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "last30days",
    "search": "john"
  }'
```

### **13. Complex Export with Multiple Filters**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFilter": "custom",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "status": "new",
    "category": "Product Inquiry",
    "starred": false,
    "search": "premium"
  }'
```

### **14. Export All Enquiries (No Date Filter)**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 **Expected Response Structure**

### **Success Response:**
```json
{
  "success": true,
  "message": "Enquiries exported successfully",
  "data": {
    "enquiries": [
      {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "message": "I would like to know more about your premium product features and pricing.",
        "contactDate": "2024-01-15"
      },
      {
        "fullName": "Jane Smith",
        "email": "jane.smith@example.com",
        "phone": "+0987654321",
        "message": "Need technical support for the mobile app.",
        "contactDate": "2024-01-14"
      }
    ],
    "totalCount": 2,
    "exportDate": "2024-01-15T10:30:00.000Z",
    "filters": {
      "dateFilter": "last7days",
      "status": "new",
      "category": "Product Inquiry"
    }
  }
}
```

### **Empty Response (No Data):**
```json
{
  "success": true,
  "message": "Enquiries exported successfully",
  "data": {
    "enquiries": [],
    "totalCount": 0,
    "exportDate": "2024-01-15T10:30:00.000Z",
    "filters": {
      "dateFilter": "today"
    }
  }
}
```

---

## 📋 **Request Parameters**

| Parameter | Type | Required | Description | Example Values |
|-----------|------|----------|-------------|---------------|
| `dateFilter` | string | No | Predefined date ranges | `"today"`, `"yesterday"`, `"last7days"`, `"last30days"`, `"thisMonth"`, `"lastMonth"`, `"thisYear"`, `"custom"` |
| `startDate` | string | No | Custom start date (YYYY-MM-DD) | `"2024-01-01"` |
| `endDate` | string | No | Custom end date (YYYY-MM-DD) | `"2024-01-31"` |
| `status` | string | No | Filter by status | `"new"`, `"in-progress"`, `"replied"`, `"closed"` |
| `category` | string | No | Filter by category | `"Product Inquiry"`, `"General Inquiry"`, `"Technical Support"` |
| `starred` | boolean | No | Filter by starred status | `true`, `false` |
| `search` | string | No | Search across all fields | `"john"`, `"product"` |

---

## 📅 **Date Filter Options**

| Filter | Description |
|--------|-------------|
| `today` | Enquiries created today |
| `yesterday` | Enquiries created yesterday |
| `last7days` | Enquiries from last 7 days |
| `last30days` | Enquiries from last 30 days |
| `thisMonth` | Enquiries from current month |
| `lastMonth` | Enquiries from previous month |
| `thisYear` | Enquiries from current year |
| `custom` | Custom date range (requires startDate/endDate) |

---

## 🎯 **Frontend Integration Example**

### **JavaScript/TypeScript Example:**
```javascript
// Function to export enquiries and generate CSV
async function exportEnquiries(filters) {
  try {
    const response = await fetch('/admin/enquiries/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filters)
    });

    const result = await response.json();
    
    if (result.success) {
      // Generate CSV from the data
      const csv = generateCSV(result.data.enquiries);
      
      // Download the CSV file
      downloadCSV(csv, `enquiries_export_${new Date().toISOString().split('T')[0]}.csv`);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Generate CSV from enquiry data
function generateCSV(enquiries) {
  const headers = ['Full Name', 'Email', 'Phone', 'Message', 'Contact Date'];
  const csvContent = [
    headers.join(','),
    ...enquiries.map(enquiry => [
      `"${enquiry.fullName}"`,
      `"${enquiry.email}"`,
      `"${enquiry.phone}"`,
      `"${enquiry.message.replace(/"/g, '""')}"`,
      `"${enquiry.contactDate}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

// Download CSV file
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Usage examples
exportEnquiries({ dateFilter: 'today' });
exportEnquiries({ dateFilter: 'custom', startDate: '2024-01-01', endDate: '2024-01-31' });
exportEnquiries({ dateFilter: 'thisMonth', status: 'new', category: 'Product Inquiry' });
```

---

## ⚠️ **Error Responses**

### **Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "dateFilter": ["Date filter must be one of: today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear, custom"]
    }
  }
}
```

### **Unauthorized Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

---

## 🚀 **Quick Test Examples**

### **Test 1: Export today's enquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateFilter": "today"}'
```

### **Test 2: Export this month's new product inquiries**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateFilter": "thisMonth", "status": "new", "category": "Product Inquiry"}'
```

### **Test 3: Export custom date range**
```bash
curl -X POST "http://localhost:3000/admin/enquiries/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateFilter": "custom", "startDate": "2024-01-01", "endDate": "2024-01-31"}'
```

---

## 📝 **Notes**

- All exports include only the required fields: `fullName`, `email`, `phone`, `message`, `contactDate`
- Date format in response is `YYYY-MM-DD`
- No pagination for exports - returns all matching records
- Export activity is logged for audit trail
- CSV generation should be done on the frontend using the returned data
- Maximum export limit is recommended to be set on frontend (e.g., 10,000 records) 