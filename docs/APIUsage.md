# 📘 API Documentation – PR System

> Base URL: `http://localhost:3000` (or your deployed server)

## 🔐 Authentication

### Login

**POST** `/user/login`
Authenticate a user and retrieve a JWT token.

#### Request Body:

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

#### Response:

```json
{
  "token": "jwt-token-string"
}
```

> 🔑 Use this token in the `Authorization` header for protected routes:

```
Authorization: Bearer <token>
```

---

## 📦 Purchase Requisition (PR) Endpoints

### Create PR

**POST** `/pr`
Requires: `create_pr` permission.

#### Headers:

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body:

```json
{
  "item": "Printer",
  "quantity": 2,
  "departmentId": "<dept_id>",
  "totalValue": 50000
}
```

---

### Get PR by ID

**GET** `/pr/:id`
Requires: `view_pr` permission.

---

### Get PRs by User

**GET** `/pr/user/:userId`
Requires: `view_pr` permission.

---

### Get PRs by Department

**GET** `/pr/department/:departmentId`
Requires: `view_pr` permission.

---

### Update PR

**PUT** `/pr/:id`
Requires: `update_pr` permission.

---

### Change PR Status

**PATCH** `/pr/:id/status`
Requires: `approve_pr` permission.

#### Request Body:

```json
{
  "status": "approved"
}
```

---

## 🔁 Approval Workflow

### Create Workflow

**POST** `/workflow`
Requires: `manage_workflow` permission.

#### Body:

```json
{
  "name": "Default Approval Flow"
}
```

---

### Add Rule to Workflow

**POST** `/workflow/:workflowId/rule`
Requires: `manage_workflow` permission.

---

### Initialize Approvals

**POST** `/pr/:prId/approvals/init`
Requires: `approve_pr` permission.

---

### Record Approval

**POST** `/pr/:prId/approvals`
Requires: `approve_pr` permission.

#### Body:

```json
{
  "status": "approved",
  "comment": "Looks good"
}
```

---

### Get Approvals for PR

**GET** `/pr/:prId/approvals`
Requires: `view_pr` permission.

---

## 👑 Admin Endpoints

All admin routes are prefixed with `/admin` and require `manage_users` permission.

### Create Super User

**POST** `/admin/superUser`

#### Body:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

---

### Delete Super User

**DELETE** `/admin/superUser/:email`

---

## 🧾 Example CURL (Login + Create PR)

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r .token)

# Create PR
curl -X POST http://localhost:3000/pr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Laptop",
    "quantity": 3,
    "departmentId": "<your-dept-id>",
    "totalValue": 250000
  }'
```
