// User status constants
const USER_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  LOCKED: 3
});

// Supervisor status constants
const SUPERVISOR_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  TERMINATED: 3
});

// Field Agent status constants
const AGENT_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  TERMINATED: 3
});

// Branch status constants
const BRANCH_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1
});

// Customer status constants
const CUSTOMER_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1,
  BLOCKED: 2
});

// Assignment status constants (Agent-Supervisor and Customer-Agent)
const ASSIGNMENT_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1
});

// Collection status constants
const COLLECTION_STATUS = Object.freeze({
  PENDING: 0,
  PARTIALLY_COLLECTED: 1,
  FULLY_COLLECTED: 2,
  FAILED: 3,
  FOLLOW_UP_REQUIRED: 4
});

// Payment method constants
const PAYMENT_METHOD = Object.freeze({
  CASH: 0,
  UPI: 1,
  BANK_TRANSFER: 2,
  OTHER: 3
});

// Payment status constants
const PAYMENT_STATUS = Object.freeze({
  PENDING: 0,
  CONFIRMED: 1,
  FAILED: 2,
  REVERSED: 3
});

// Role Codes
const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  FIELD_AGENT: 'FIELD_AGENT'
});

// Field Visit outcome constants
const VISIT_OUTCOME = Object.freeze({
  CUSTOMER_CONTACTED: 0,
  CUSTOMER_UNAVAILABLE: 1,
  ADDRESS_NOT_FOUND: 2,
  CUSTOMER_REQUESTED_MORE_TIME: 3,
  PAYMENT_PROMISE_RECORDED: 4,
  PAYMENT_DISPUTE_RAISED: 5,
  CUSTOMER_REFUSED_PAYMENT: 6,
  FOLLOW_UP_REQUIRED: 7
});

// Follow-up type constants
const FOLLOW_UP_TYPE = Object.freeze({
  CALL: 0,
  VISIT: 1,
  DOCUMENT_REQUEST: 2
});

// Follow-up status constants
const FOLLOW_UP_STATUS = Object.freeze({
  PENDING: 0,
  COMPLETED: 1,
  CANCELLED: 2
});

// Area status constants
const AREA_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1
});

// Payment Mode status constants
const PAYMENT_MODE_STATUS = Object.freeze({
  INACTIVE: 0,
  ACTIVE: 1
});

module.exports = {
  USER_STATUS,
  SUPERVISOR_STATUS,
  AGENT_STATUS,
  BRANCH_STATUS,
  AREA_STATUS,
  CUSTOMER_STATUS,
  ASSIGNMENT_STATUS,
  COLLECTION_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_MODE_STATUS,
  ROLES,
  VISIT_OUTCOME,
  FOLLOW_UP_TYPE,
  FOLLOW_UP_STATUS
};
