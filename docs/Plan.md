## 🧭 Phase 1: Project Foundation and Setup

### ✅ Step 1: Initialize Bun Project & Folder Structure (Already Done)

* Confirm you’ve initialized the project with Bun properly.
* Ensure TypeScript is set up correctly.
* Folder structure is fine as-is:

  ```
  controller/, models/, services/, utils/, docs/
  ```

---

## 🔐 Phase 2: Authentication & Authorization System

### ✅ Step 2: Define User & Role Schema (MongoDB Models)

**Models to create:**

* `User`: `id`, `email`, `password`, `roleId`, `departmentId`
* `Role`: `id`, `name`, `permissions (json array)`
* `Permission` (optional if permissions are hardcoded)

> **Goal:** Establish user identity and role-based access control.

### ✅ Step 3: Authentication Service (JWT-based)

* Implement `/user/login`, `/user/register`
* Hash passwords with bcrypt
* Sign JWT with a secret key
* Store role and department in token

**Related files:**

* `controller/user_controller.ts`
* `services/user_service.ts`
* `utils/jwt.ts`, `utils/hash.ts`

### ✅ Step 4: Authorization Middleware

* Middleware to check JWT
* Middleware to validate roles/permissions per endpoint

---

## 📦 Phase 3: Core PR Functionality

### ✅ Step 5: Create PR Model

**Fields:**

* `id`, `createdBy`, `item`, `quantity`, `status`, `departmentId`, `totalValue`, `approvalWorkflowId`, `categoryId`

### ✅ Step 6: PR Service Implementation

**Core Functions:**

* Create PR
* View PR(s) by user
* View PR(s) by department
* Edit PR (if not approved)
* Update status

**Endpoints:**

* `POST /pr`
* `GET /pr/:id`
* `GET /pr/department`
* `PUT /pr/:id`

---

## ✅ Phase 4: Approval Workflow

### ✅ Step 7: Define Approval Models

* `Approval`: `id`, `prId`, `status`, `approvedAt`, `comments`, `approverId`
* `ApprovalWorkflow`: `id`, `departmentId`, `name`, `rules (json)`
* `WorkflowRule`: `id`, `workflowId`, `condition`, `action`

> This allows PRs to follow dynamic, department-based approval flows.

### ✅ Step 8: Approval Service Implementation

**Functions:**

* Determine next approver from rules
* Create new approval when PR created
* Update PR status when approved/rejected

**Endpoints:**

* `POST /approve/:prId`
* `GET /approve/:prId/status`

---

## 🧩 Phase 5: Category, Department, and Utility Integration

### ✅ Step 9: Category & Department Models

* `Category`: `id`, `name`, `rules`
* `Department`: `id`, `name`

### ✅ Step 10: Add Reference Check Utilities

* Utility functions to map IDs to names
* Department/category validation during PR creation

---

## 🧪 Phase 6: Validation, Rules Engine & Finalization

### ✅ Step 11: Workflow Rule Evaluation Engine

* Parse and evaluate `rules` JSON in `WorkflowRule`
* Check `condition` logic dynamically (e.g., based on PR total value, department, user role)

### ✅ Step 12: Validation Middleware

* Input validation using schema (e.g., Zod or your own validator)
* Authorization checks tied to workflow rules

---

## 📘 Phase 7: Documentation & Test Coverage

### ✅ Step 13: Write Swagger/OpenAPI docs (Optional)

* For `/pr`, `/user`, `/approve` endpoints

### ✅ Step 14: Unit and Integration Testing

* Controllers
* Services
* Workflow logic

---

## 🏁 Final Step: Deployment Considerations

* MongoDB cloud setup or Docker container
* Bun + Express production setup
* Logging with `utils/logger.ts`

---

## References

* [Microsoft PR System](https://learn.microsoft.com/en-us/dynamics365/supply-chain/procurement/purchase-requisitions-overview)
* [Bun Documentation](https://bun.sh/docs)
