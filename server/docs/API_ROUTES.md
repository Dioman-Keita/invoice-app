# API Routes Documentation

## 🚀 **Base URL**

```bash
http://localhost:3000/api
```

## 🔐 **Authentication Routes**

### **POST** `/auth/login`

- **Description**: User login with rememberMe management
- **Body**: `{ email, password, role, rememberMe }`
- **Response**: `auth_token` cookie + user data + activity tracking
- **Protection**: None
- **Tracking**: Automatic `LOGIN`

### **POST** `/auth/register`

- **Description**: User registration with validation
- **Body**: `{ email, password, firstName, lastName, role, terms }`
- **Response**: Verification email sent
- **Protection**: None
- **Roles**: All

### **POST** `/auth/forgot-password`

- **Description**: Password reset request
- **Body**: `{ email }`
- **Response**: Reset email sent
- **Protection**: None

### **POST** `/auth/reset-password`

- **Description**: Password reset
- **Body**: `{ token, password }`
- **Response**: Reset confirmation
- **Protection**: None

### **POST** `/auth/logout`

- **Description**: User logout
- **Response**: Logout confirmation
- **Protection**: `authGuard`

### **POST** `/auth/silent-refresh`

- **Description**: Silent token refresh
- **Response**: New token
- **Protection**: `authGuard`

### **GET** `/auth/status`

- **Description**: Check authentication status
- **Response**: User status
- **Protection**: `authGuard`
- **Tracking**: `REFRESH_PROFILE`

### **POST** `/auth/admin/create-user`

- **Description**: User creation (admin only)
- **Body**: `{ email, password, firstName, lastName, role }`
- **Response**: Created user details
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 📄 **Invoice Management**

### **GET** `/invoices`

- **Description**: List invoices
- **Query Params**: `status`, `supplierId`, `dateFrom`, `dateTo`
- **Response**: List of invoices
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/invoices/last-num`

- **Description**: Get last invoice number
- **Response**: `{ lastNumber: string }`
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/invoices/next-num`

- **Description**: Get next expected invoice number
- **Response**: `{ nextNumber: string }`
- **Protection**: `authGuard` + `requireManagerOrAdmin`
- **Roles**: `invoice_manager`, `admin`

### **GET** `/invoices/dfc/pending`

- **Description**: List pending DFC invoices
- **Response**: List of pending invoices
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **POST** `/invoices`

- **Description**: Create new invoice
- **Body**: Invoice data
- **Response**: Created invoice
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **POST** `/invoices/:id/dfc/approve`

- **Description**: Approve DFC invoice
- **Response**: Approval confirmation
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **POST** `/invoices/:id/dfc/reject`

- **Description**: Reject DFC invoice
- **Body**: `{ comments?: string }`
- **Response**: Rejection confirmation
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/invoices/:id`

- **Description**: Get specific invoice
- **Response**: Invoice details
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **POST** `/invoices/update/:id`

- **Description**: Update invoice
- **Body**: Updated invoice data
- **Response**: Updated invoice
- **Protection**: `authGuard` + `requireManagerOrAdmin`
- **Roles**: `invoice_manager`, `admin`

### **POST** `/invoices/delete/:id`

- **Description**: Delete invoice
- **Response**: Deletion confirmation
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 👥 **Supplier Management**

### **POST** `/supplier`

- **Description**: Create supplier
- **Protection**: `authGuard` + `requireManagerOrAdmin`
- **Roles**: `invoice_manager`, `admin`

### **POST** `/supplier/delete/:id`

- **Description**: Delete supplier (simulation DELETE)
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **GET** `/supplier`

- **Description**: List all suppliers
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/supplier/phone`

- **Description**: Search supplier by phone (`?phone=`)
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/supplier/:id`

- **Description**: Get specific supplier
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/suppliers/search`

- **Description**: Flexible search by field (`?field=&value=`)
- **Protection**: `authGuard` + `requireManagerOrAdmin`
- **Roles**: `invoice_manager`, `admin`

### **GET** `/suppliers/find`

- **Description**: Multi-field search (e.g. `?name=ABC&account_number=123`)
- **Protection**: `authGuard` + `requireManagerOrAdmin`
- **Roles**: `invoice_manager`, `admin`

### **GET** `/suppliers/verify-conflicts`

- **Description**: Verify conflicts (account number / phone)
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

## 🔍 **Advanced Search & Export**

### **GET** `/search/invoices`

- **Description**: Advanced invoice search
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/search/suppliers`

- **Description**: Advanced supplier search
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/search/relational`

- **Description**: Relational search (invoices/suppliers)
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **POST** `/export`

- **Description**: Generate export based on standardized search
- **Body**:

  ```json
  {
    "type": "invoice" | "supplier" | "relational",
    "variant": "list" | "overview",
    "format": "pdf" | "odt" | "xlsx",
    "search": { /* same filters as /search/... */ }
  }
  ```

- **Response**: Binary file
  - `application/pdf` if `format=pdf`
  - `application/vnd.oasis.opendocument.text` if `format=odt`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` if `format=xlsx`
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

### **GET** `/fiscal-years`

- **Description**: Get available fiscal years
- **Protection**: `authGuard` + `requireAgentOrManager`
- **Roles**: `dfc_agent`, `invoice_manager`

## 📊 **Statistics & Dashboard**

### **GET** `/stats/dashboard/kpis`

- **Description**: Key Performance Indicators for admin dashboard
- **Response**: `{ total_employee, total_invoices, business_amount, total_invoice_pending, dateFrom, dateTo }`
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **GET** `/stats/invoices/evolution`

- **Description**: Invoice evolution and amounts per month
- **Response**: Chart data
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## ⚙️ **Fiscal Settings**

### **GET** `/settings/fiscal`

- **Description**: Current fiscal year info (fiscal year, CMDT format, counter, thresholds, alerts, etc.)
- **Protection**: `authGuard`
- **Roles**: `dfc_agent`, `invoice_manager`, `admin`

### **POST** `/settings/auto-year-switch`

- **Description**: Enable/Disable automatic fiscal year switch
- **Body**: `{ enable: boolean }`
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **POST** `/settings/fiscal-year/switch`

- **Description**: Manual fiscal year switch
- **Body**: `{ newYear: string }`
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 👥 **User Management**

### **GET** `/users`

- **Description**: List all users
- **Response**: Array of users
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **GET** `/users/:id`

- **Description**: Get specific user details
- **Response**: User object
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **PUT** `/users/:id`

- **Description**: Update user information
- **Body**: Updated user data
- **Response**: Updated user
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **DELETE** `/users/:id`

- **Description**: Delete user
- **Response**: Deletion confirmation
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **POST** `/users/:id/disable`

- **Description**: Disable user account
- **Response**: Confirmation
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **POST** `/users/:id/enable`

- **Description**: Enable user account
- **Response**: Confirmation
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 🗂️ **System \& Logs**

### **GET** `/system/logs`

- **Description**: Get system error logs with filtering
- **Query Params**: `level` (error, warn, info), `page`, `limit`
- **Response**: Paginated error logs
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **DELETE** `/system/logs`

- **Description**: Clear all system error logs
- **Response**: Deletion confirmation
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 🔄 **Role Migration**

### **POST** `/migration/request`

- **Description**: Submit role migration request
- **Body**: `{ targetRole: string, motivation: string }`
- **Response**: Request confirmation
- **Protection**: `authGuard`
- **Roles**: All authenticated users

### **GET** `/migration/requests`

- **Description**: List all migration requests (admin view)
- **Response**: Array of migration requests
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **GET** `/migration/my-requests`

- **Description**: Get current user's migration requests
- **Response**: Array of user's requests
- **Protection**: `authGuard`
- **Roles**: All authenticated users

### **POST** `/migration/:id/approve`

- **Description**: Approve migration request
- **Response**: Approval confirmation + email sent
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **POST** `/migration/:id/reject`

- **Description**: Reject migration request
- **Body**: `{ reviewNote?: string }`
- **Response**: Rejection confirmation + email sent
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

### **GET** `/migration/stats`

- **Description**: Get migration statistics
- **Response**: Statistics object
- **Protection**: `authGuard` + `requireAdmin`
- **Roles**: `admin`

## 🛡️ **Health Check**

### **GET** `/health`

- **Description**: Server health check
- **Response**: `{ status: 'OK', message: 'Server functional' }`
- **Protection**: None

## 🔧 **Client-Side Usage**

### **Axios Configuration with Inactivity Handling**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important for cookies
});

// Interceptor to handle auth errors and inactivity
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    if (error.response?.data?.message?.includes('inactivity')) {
      // Handle auto logout
      localStorage.clear();
      window.location.href = '/login?reason=inactivity';
    }
    return Promise.reject(error);
  }
);
```

### **Example Usage**

```javascript
// Login with rememberMe
const login = async (email, password, role, rememberMe) => {
  const response = await api.post('/auth/login', { 
    email, password, role, rememberMe 
  });
  return response.data;
};

// Register with validation
const register = async (userData) => {
  const response = await api.post('/auth/register', {
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    terms: userData.terms
  });
  return response.data;
};

// Check status
const checkAuthStatus = async () => {
  const response = await api.get('/auth/status');
  return response.data;
};
```

## 🚨 **Error Codes**

- **200**: Success
- **201**: Created successfully
- **400**: Invalid request
- **401**: Unauthenticated
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **500**: Server error

## 📝 **Important Notes**

1. **Cookies**: All protected requests require the `auth_token` cookie (HttpOnly)
2. **CORS**: Configured for `http://localhost:5173` (or `FRONTEND_URL`) with `credentials: true`
3. **Traceability**: All actions are automatically associated with the logged-in user
4. **Permissions**: Automatic check of roles and resource ownership
5. **Inactivity**: Auto logout after 5min (30min with rememberMe)
6. **Activity Tracking**: All actions are logged in `user_activity`
7. **Refresh**: Tokens renewed automatically before expiration
8. **Validation**: React Hook Form + Zod on client, strict server validation
9. **System Logs**: Admin-only access to error logs with filtering and clearing capabilities
10. **Role Migration**: Users can request role changes, admins approve/reject with email notifications
11. **User Management**: Complete CRUD operations for users (admin only)
12. **Deep Linking**: Email verification and password reset use `invoice-app://` protocol
